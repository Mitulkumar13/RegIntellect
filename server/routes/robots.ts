import { Router } from 'express';
import { scoreEvent, generateEventSignature, isDuplicate, shouldSummarize } from '../lib/scoring';
import { normalizeData } from '../lib/ai-gemini';
import { summarizeEvent } from '../lib/ai-perplexity';
import { sendUrgentAlert, sendInformationalAlert, sendDailyDigest } from '../lib/email-service';
import { readJSON, writeJSON } from '../lib/json-storage';
import { canMakeAISummary, incrementPerplexityUsage, getAIUsageStatus } from '../lib/ai-usage-tracker';
import { fetchCDPHAlerts, fetchRHBAlerts } from '../lib/california-sources';

const router = Router();

// Track event signatures for deduplication
const eventSignatures = new Map<string, Date>();

// Helper to check if running in dry run mode
const isDryRun = (req: any) => req.query.dryRun === 'true';

// GET /api/recalls/device - FDA device recalls (every 120min)
router.get('/recalls/device', async (req, res) => {
  const dryRun = isDryRun(req);
  
  try {
    // Fetch FDA device enforcement data
    const fdaUrl = 'https://api.fda.gov/device/enforcement.json?search=(product_description:"x-ray"+OR+product_description:"CT"+OR+product_description:"MRI"+OR+product_description:"ultrasound"+OR+product_description:"mammograph"+OR+product_description:"radiograph"+OR+product_description:"fluoroscop")&sort=report_date:desc&limit=100';
    
    const response = await fetch(fdaUrl);
    if (!response.ok) {
      throw new Error(`FDA API error: ${response.status}`);
    }
    
    const data = await response.json();
    const results = data.results || [];
    
    const events = [];
    const users = await readJSON('users.json');
    const userDevices = await readJSON('user-devices.json');
    
    for (const recall of results) {
      // Generate signature for deduplication
      const signature = generateEventSignature(
        recall.firm_name || '',
        recall.product_description || '',
        recall.product_class || '',
        recall.reason_for_recall || ''
      );
      
      // Check for duplicates within 14-day window
      if (isDuplicate(signature, eventSignatures)) {
        continue;
      }
      
      // Score the event
      const scoring = scoreEvent({
        source: 'fda-device-recall',
        hasRecall: true,
        isExactDeviceMatch: userDevices.some((d: any) => 
          recall.product_description?.toLowerCase().includes(d.model.toLowerCase())
        )
      });
      
      // Normalize data
      let normalized = {
        id: `fda-device-${recall.recall_number}`,
        title: `${recall.product_class || 'Class III'} Recall: ${recall.product_description?.substring(0, 100)}`,
        description: recall.reason_for_recall || 'No reason provided',
        source: 'FDA Device Recall',
        date: recall.report_date || new Date().toISOString(),
        manufacturer: recall.firm_name,
        model: recall.product_code,
        category: scoring.category,
        score: scoring.adjustedScore,
        confidence: scoring.confidence,
        link: `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfres/res.cfm?id=${recall.recall_number}`,
        summary: null
      };
      
      // Try AI normalization if structure is broken
      if (!normalized.title || !normalized.description) {
        try {
          const aiNormalized = await normalizeData(recall, 'fda-device-recall');
          normalized = { ...normalized, ...aiNormalized };
        } catch (error) {
          console.warn('AI normalization failed, using fallback:', error);
        }
      }

      // Add summary if needed and within daily limits
      if (shouldSummarize(normalized.category) && !dryRun && canMakeAISummary()) {
        try {
          if (incrementPerplexityUsage()) {
            normalized.summary = await summarizeEvent(normalized);
          }
        } catch (error) {
          console.warn('Summary generation failed:', error);
        }
      }

      events.push(normalized);
      
      // Track signature
      if (!dryRun) {
        eventSignatures.set(signature, new Date());
      }
    }

    // Save events if not dry run
    if (!dryRun && events.length > 0) {
      const existingEvents = await readJSON('events.json');
      const updatedEvents = [...existingEvents, ...events].slice(-5000); // Keep last 5000
      await writeJSON('events.json', updatedEvents);
    }

    res.json({
      source: 'FDA Device Recalls',
      count: events.length,
      fetchedAt: new Date().toISOString(),
      events: dryRun ? events : events.slice(0, 5) // Limit response size
    });

  } catch (error) {
    console.error('Device recalls error:', error);
    res.status(500).json({ error: 'Failed to fetch device recalls' });
  }
});

// GET /api/recalls/drug - FDA drug recalls & shortages (every 120min)
router.get('/recalls/drug', async (req, res) => {
  const dryRun = isDryRun(req);
  
  try {
    const events = [];
    
    // FDA Drug Recalls
    const fdaDrugUrl = 'https://api.fda.gov/drug/enforcement.json?search=(product_description:"contrast"+OR+product_description:"anesthetic"+OR+product_description:"gadolinium"+OR+product_description:"iodinated")&sort=report_date:desc&limit=50';
    
    const fdaResponse = await fetch(fdaDrugUrl);
    if (fdaResponse.ok) {
      const fdaData = await fdaResponse.json();
      
      for (const recall of fdaData.results || []) {
        const signature = generateEventSignature(
          recall.recalling_firm || '',
          recall.product_description || '',
          recall.classification || '',
          recall.reason_for_recall || ''
        );
        
        if (isDuplicate(signature, eventSignatures)) continue;
        
        const scoring = scoreEvent({
          source: 'fda-drug-recall',
          hasRecall: true
        });
        
        const normalized = {
          id: `fda-drug-${recall.recall_number}`,
          title: `Drug Recall: ${recall.product_description?.substring(0, 100)}`,
          description: recall.reason_for_recall || 'No reason provided',
          source: 'FDA Drug Recall',
          date: recall.report_date || new Date().toISOString(),
          manufacturer: recall.recalling_firm,
          classification: recall.classification,
          category: scoring.category,
          score: scoring.adjustedScore,
          confidence: scoring.confidence,
          drugType: 'contrast_agent', // Categorize for radiology
          link: `https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts`
        };
        
        events.push(normalized);
        
        if (!dryRun) {
          eventSignatures.set(signature, new Date());
        }
      }
    }

    // FDA Drug Shortages
    // Note: FDA doesn't have a public API for shortages, would need web scraping
    // For MVP, using mock structure that matches expected format
    
    // ASHP Drug Shortages (mock structure - would need scraping in production)
    const ashpShortages = [
      {
        drug_name: "Gadolinium-based Contrast Agents",
        shortage_reason: "Manufacturing delays",
        estimated_resupply: "Q2 2025",
        alternatives: ["Alternative contrast protocols", "Lower dose protocols"]
      }
    ];
    
    for (const shortage of ashpShortages) {
      const normalized = {
        id: `ashp-shortage-${shortage.drug_name.replace(/\s+/g, '-').toLowerCase()}`,
        title: `Drug Shortage: ${shortage.drug_name}`,
        description: `Shortage reason: ${shortage.shortage_reason}. Estimated resupply: ${shortage.estimated_resupply}`,
        source: 'ASHP Drug Shortage',
        date: new Date().toISOString(),
        category: 'Informational',
        score: 50, // Medium confidence for ASHP-only
        confidence: 'Medium',
        drugType: 'contrast_agent',
        alternatives: shortage.alternatives
      };
      
      events.push(normalized);
    }

    // Save events if not dry run
    if (!dryRun && events.length > 0) {
      const existingEvents = await readJSON('events.json');
      const updatedEvents = [...existingEvents, ...events].slice(-5000);
      await writeJSON('events.json', updatedEvents);
    }

    res.json({
      source: 'FDA & ASHP Drug Data',
      count: events.length,
      fetchedAt: new Date().toISOString(),
      events: dryRun ? events : events.slice(0, 5)
    });

  } catch (error) {
    console.error('Drug recalls error:', error);
    res.status(500).json({ error: 'Failed to fetch drug recalls' });
  }
});

// GET /api/cpt/pfs - CMS Physician Fee Schedule changes (daily 07:00)
router.get('/cpt/pfs', async (req, res) => {
  const dryRun = isDryRun(req);
  
  try {
    // Mock CMS PFS data structure (in production would fetch from CMS APIs)
    const currentRates = {
      "70450": { rate: 165.32, description: "CT Head w/o contrast" },
      "70460": { rate: 198.45, description: "CT Head w/ contrast" },
      "77065": { rate: 146.78, description: "Diagnostic mammography bilateral" },
      "70551": { rate: 523.12, description: "MRI Brain w/o contrast" },
      "71045": { rate: 89.45, description: "Chest X-ray single view" }
    };
    
    const previousRates = await readJSON('cpt_rates_previous.json');
    const events = [];
    
    for (const [cptCode, current] of Object.entries(currentRates)) {
      const previous = previousRates[cptCode];
      
      if (previous && previous.rate !== current.rate) {
        const deltaPercent = ((current.rate - previous.rate) / previous.rate) * 100;
        const absDelta = Math.abs(deltaPercent);
        
        let category = 'Digest';
        if (absDelta >= 10) category = 'Urgent';
        else if (absDelta >= 5) category = 'Informational';
        
        const scoring = scoreEvent({
          source: 'cms-pfs',
          cptDeltaPercent: deltaPercent
        });
        
        const normalized = {
          id: `cms-pfs-${cptCode}-${new Date().toISOString().split('T')[0]}`,
          title: `CPT ${cptCode} Rate Change: ${deltaPercent > 0 ? '+' : ''}${deltaPercent.toFixed(1)}%`,
          description: `${current.description} rate changed from $${previous.rate} to $${current.rate}`,
          source: 'CMS Physician Fee Schedule',
          date: new Date().toISOString(),
          cptCode,
          oldRate: previous.rate,
          newRate: current.rate,
          deltaPercent,
          category,
          score: scoring.adjustedScore,
          confidence: scoring.confidence,
          link: 'https://www.cms.gov/medicare/physician-fee-schedule'
        };
        
        events.push(normalized);
      }
    }
    
    // Save current rates as previous for next run
    if (!dryRun) {
      await writeJSON('cpt_rates_previous.json', currentRates);
      
      if (events.length > 0) {
        const existingEvents = await readJSON('events.json');
        const updatedEvents = [...existingEvents, ...events].slice(-5000);
        await writeJSON('events.json', updatedEvents);
      }
    }

    res.json({
      source: 'CMS PFS Changes',
      count: events.length,
      fetchedAt: new Date().toISOString(),
      events: dryRun ? events : events.slice(0, 5)
    });

  } catch (error) {
    console.error('CPT PFS error:', error);
    res.status(500).json({ error: 'Failed to fetch CPT changes' });
  }
});

// GET /api/maude - MAUDE device reports (daily 07:30)
router.get('/maude', async (req, res) => {
  const dryRun = isDryRun(req);
  
  try {
    // MAUDE API for device events (support signal only, never standalone alerts)
    const maudeUrl = 'https://api.fda.gov/device/event.json?search=(device.generic_name:"computed+tomography"+OR+device.generic_name:"magnetic+resonance"+OR+device.generic_name:"x-ray")&count=device.generic_name.exact&limit=100';
    
    const response = await fetch(maudeUrl);
    if (!response.ok) {
      throw new Error(`MAUDE API error: ${response.status}`);
    }
    
    const data = await response.json();
    const counts = {};
    
    for (const result of data.results || []) {
      const deviceName = result.term;
      counts[deviceName] = (counts[deviceName] || 0) + result.count;
    }
    
    // Store counts for support signal use (never alert directly)
    if (!dryRun) {
      await writeJSON('maude_counts.json', {
        ...await readJSON('maude_counts.json'),
        [new Date().toISOString().split('T')[0]]: counts
      });
    }

    res.json({
      source: 'MAUDE Device Events',
      count: Object.keys(counts).length,
      fetchedAt: new Date().toISOString(),
      supportSignals: counts // These support other alerts, don't generate standalone alerts
    });

  } catch (error) {
    console.error('MAUDE error:', error);
    res.status(500).json({ error: 'Failed to fetch MAUDE data' });
  }
});

// GET /api/deadlines - Federal Register & CMS deadlines (daily 07:00)
router.get('/deadlines', async (req, res) => {
  const dryRun = isDryRun(req);
  
  try {
    // Mock deadline structure (in production would scrape Federal Register API)
    const deadlines = [
      {
        id: 'cms-2025-pfs-comment',
        title: 'CMS 2026 Physician Fee Schedule Comment Period',
        due_date: '2025-03-15',
        action_required: 'Submit comments on proposed imaging payment changes',
        source: 'Federal Register',
        link: 'https://www.federalregister.gov',
        priority: 'High',
        days_until: Math.ceil((new Date('2025-03-15').getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      },
      {
        id: 'mqsa-facility-inspection',
        title: 'MQSA Annual Facility Inspection Due',
        due_date: '2025-02-28',
        action_required: 'Schedule annual mammography facility inspection',
        source: 'FDA MQSA',
        link: 'https://www.fda.gov/radiation-emitting-products/mqsa',
        priority: 'Urgent',
        days_until: Math.ceil((new Date('2025-02-28').getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      }
    ];
    
    const events = [];
    
    for (const deadline of deadlines) {
      let category = 'Digest';
      
      // Escalate based on time remaining
      if (deadline.days_until <= 1) category = 'Urgent';
      else if (deadline.days_until <= 7) category = 'Informational';
      
      const normalized = {
        id: deadline.id,
        title: deadline.title,
        description: `Due: ${deadline.due_date} (${deadline.days_until} days). Action: ${deadline.action_required}`,
        source: deadline.source,
        date: new Date().toISOString(),
        dueDate: deadline.due_date,
        daysUntil: deadline.days_until,
        actionRequired: deadline.action_required,
        category,
        score: deadline.priority === 'Urgent' ? 90 : 65,
        confidence: 'High',
        link: deadline.link
      };
      
      events.push(normalized);
    }
    
    if (!dryRun) {
      await writeJSON('deadlines.json', deadlines);
      
      if (events.length > 0) {
        const existingEvents = await readJSON('events.json');
        const updatedEvents = [...existingEvents, ...events].slice(-5000);
        await writeJSON('events.json', updatedEvents);
      }
    }

    res.json({
      source: 'Federal Register & CMS Deadlines',
      count: events.length,
      fetchedAt: new Date().toISOString(),
      events: dryRun ? events : events.slice(0, 5)
    });

  } catch (error) {
    console.error('Deadlines error:', error);
    res.status(500).json({ error: 'Failed to fetch deadlines' });
  }
});

// GET /api/recalls/drug - FDA drug recalls and shortages (every 120min)
router.get('/recalls/drug', async (req, res) => {
  const dryRun = isDryRun(req);
  
  try {
    const events = [];
    
    // Fetch FDA drug recalls
    const recallUrl = 'https://api.fda.gov/drug/enforcement.json?search=product_description:"contrast"+OR+product_description:"anesthetic"&limit=50';
    const recallResponse = await fetch(recallUrl);
    
    if (recallResponse.ok) {
      const recallData = await recallResponse.json();
      
      for (const recall of recallData.results || []) {
        const scoring = scoreEvent({
          source: 'fda-drug-recall',
          isDrugDependency: true // Check against user drug dependencies
        });
        
        events.push({
          id: `fda-drug-${recall.recall_number}`,
          title: `Drug Recall: ${recall.product_description?.substring(0, 100)}`,
          description: recall.reason_for_recall || 'No reason provided',
          source: 'FDA Drug Recall',
          date: recall.report_date || new Date().toISOString(),
          category: scoring.category,
          score: scoring.adjustedScore,
          confidence: scoring.confidence
        });
      }
    }
    
    // Fetch FDA drug shortages
    const shortageUrl = 'https://www.accessdata.fda.gov/resource/ndqp-43p5.json';
    const shortageResponse = await fetch(shortageUrl);
    
    if (shortageResponse.ok) {
      const shortageData = await shortageResponse.json();
      const radiologyDrugs = shortageData.filter((drug: any) => 
        drug.generic_name?.toLowerCase().includes('contrast') ||
        drug.generic_name?.toLowerCase().includes('gadolinium') ||
        drug.generic_name?.toLowerCase().includes('iodine')
      );
      
      for (const shortage of radiologyDrugs) {
        const scoring = scoreEvent({
          source: 'fda-drug-shortage',
          isDrugDependency: true
        });
        
        events.push({
          id: `fda-shortage-${shortage.generic_name}`,
          title: `Drug Shortage: ${shortage.generic_name}`,
          description: shortage.shortage_status || 'Shortage reported',
          source: 'FDA Drug Shortage',
          date: new Date().toISOString(),
          category: scoring.category,
          score: scoring.adjustedScore,
          confidence: scoring.confidence
        });
      }
    }
    
    // Save events (unless dry run)
    if (!dryRun && events.length > 0) {
      const existingEvents = await readJSON('events.json');
      existingEvents.push(...events);
      await writeJSON('events.json', existingEvents);
    }
    
    res.json({
      success: true,
      dryRun,
      processed: events.length,
      events: dryRun ? events : undefined
    });
    
  } catch (error: any) {
    console.error('FDA drug recall/shortage error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch FDA drug data',
      message: error.message,
      dryRun
    });
  }
});

// GET /api/cpt/pfs - CMS PFS updates (daily at 07:00)
router.get('/cpt/pfs', async (req, res) => {
  const dryRun = isDryRun(req);
  
  try {
    // This would normally fetch from CMS PFS data
    // For MVP, using mock data structure
    const currentRates = {
      '70551': 250.00, // MRI Brain
      '70553': 350.00, // MRI Brain w/contrast
      '74150': 200.00, // CT Abdomen
      '76700': 150.00, // Abdominal ultrasound
      '77067': 125.00  // Screening mammography
    };
    
    // Load previous rates
    const previousRates = await readJSON('cpt-rates-previous.json');
    const events = [];
    
    for (const [code, currentRate] of Object.entries(currentRates)) {
      const previousRate = previousRates[code];
      if (!previousRate) continue;
      
      const deltaPercent = ((currentRate - previousRate) / previousRate) * 100;
      
      if (Math.abs(deltaPercent) >= 5) {
        const scoring = scoreEvent({
          source: 'cms-pfs',
          cptDeltaPercent: deltaPercent
        });
        
        events.push({
          id: `cpt-${code}-${Date.now()}`,
          title: `CPT ${code} Payment Change`,
          description: `Rate changed from $${previousRate} to $${currentRate} (${deltaPercent.toFixed(1)}%)`,
          source: 'CMS PFS',
          date: new Date().toISOString(),
          category: scoring.category,
          score: scoring.adjustedScore,
          cptCode: code,
          previousRate,
          currentRate,
          deltaPercent
        });
      }
    }
    
    // Save current rates as previous (unless dry run)
    if (!dryRun) {
      await writeJSON('cpt-rates-previous.json', currentRates);
      
      if (events.length > 0) {
        const existingEvents = await readJSON('events.json');
        existingEvents.push(...events);
        await writeJSON('events.json', existingEvents);
      }
    }
    
    res.json({
      success: true,
      dryRun,
      processed: events.length,
      events: dryRun ? events : undefined
    });
    
  } catch (error: any) {
    console.error('CMS PFS error:', error);
    res.status(500).json({ 
      error: 'Failed to process CMS PFS data',
      message: error.message,
      dryRun
    });
  }
});

// GET /api/deadlines - Regulatory deadlines (daily at 07:00)
router.get('/deadlines', async (req, res) => {
  const dryRun = isDryRun(req);
  
  try {
    const events = [];
    const deadlines = [];
    
    // Fetch from Federal Register API
    const fedRegUrl = 'https://www.federalregister.gov/api/v1/documents?conditions[agencies][]=health-and-human-services-department&conditions[agencies][]=centers-for-medicare-medicaid-services&per_page=50';
    
    const response = await fetch(fedRegUrl);
    
    if (response.ok) {
      const data = await response.json();
      
      for (const doc of data.results || []) {
        if (doc.comments_close_on || doc.effective_on) {
          const dueDate = doc.comments_close_on || doc.effective_on;
          const daysDiff = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          
          const deadline = {
            id: `fedreg-${doc.document_number}`,
            title: doc.title,
            dueDate,
            daysUntil: daysDiff,
            actionRequired: doc.comments_close_on ? 'Submit comments' : 'Effective date',
            source: 'Federal Register',
            link: doc.html_url
          };
          
          deadlines.push(deadline);
          
          // Create event for urgent/important deadlines
          if (daysDiff <= 60 && daysDiff > 0) {
            const scoring = scoreEvent({
              source: 'federal-register',
              daysUntilDeadline: daysDiff
            });
            
            events.push({
              id: deadline.id,
              title: deadline.title,
              description: `Due: ${dueDate} (${daysDiff} days). Action: ${deadline.actionRequired}`,
              source: 'Federal Register',
              date: new Date().toISOString(),
              dueDate,
              daysUntil: daysDiff,
              actionRequired: deadline.actionRequired,
              category: scoring.category,
              score: scoring.adjustedScore,
              confidence: scoring.confidence,
              link: deadline.link
            });
          }
        }
      }
    }
    
    // Add California-specific deadlines
    const caDeadlines = [
      {
        id: 'cms-2025-pfs-comment',
        title: 'CMS 2026 Physician Fee Schedule Comment Period',
        dueDate: '2025-03-15',
        daysUntil: Math.ceil((new Date('2025-03-15').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        actionRequired: 'Submit comments on proposed imaging payment changes',
        source: 'Federal Register',
        link: 'https://www.federalregister.gov'
      },
      {
        id: 'mqsa-facility-inspection',
        title: 'MQSA Annual Facility Inspection Due',
        dueDate: '2025-02-28',
        daysUntil: Math.ceil((new Date('2025-02-28').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        actionRequired: 'Schedule annual mammography facility inspection',
        source: 'FDA MQSA',
        link: 'https://www.fda.gov/radiation-emitting-products/mqsa'
      }
    ];
    
    caDeadlines.forEach(deadline => {
      deadlines.push(deadline);
      
      if (deadline.daysUntil <= 90) {
        const scoring = scoreEvent({
          source: deadline.source.toLowerCase().replace(' ', '-'),
          daysUntilDeadline: deadline.daysUntil,
          isMQSA: deadline.id.includes('mqsa')
        });
        
        events.push({
          ...deadline,
          description: `Due: ${deadline.dueDate} (${deadline.daysUntil} days). Action: ${deadline.actionRequired}`,
          date: new Date().toISOString(),
          category: scoring.category,
          score: scoring.adjustedScore,
          confidence: scoring.confidence
        });
      }
    });
    
    // Save data (unless dry run)
    if (!dryRun) {
      await writeJSON('deadlines.json', deadlines);
      
      if (events.length > 0) {
        const existingEvents = await readJSON('events.json');
        const updatedEvents = [...existingEvents, ...events].slice(-5000);
        await writeJSON('events.json', updatedEvents);
      }
    }

    res.json({
      source: 'Federal Register & CMS Deadlines',
      count: events.length,
      fetchedAt: new Date().toISOString(),
      events: dryRun ? events : events.slice(0, 5)
    });

  } catch (error) {
    console.error('Deadlines error:', error);
    res.status(500).json({ error: 'Failed to fetch deadlines' });
  }
});

// GET /api/vendor-advisories - Vendor security advisories (daily)
router.get('/vendor-advisories', async (req, res) => {
  const dryRun = isDryRun(req);
  
  try {
    // This would normally fetch from vendor sites
    // For MVP, returning structured example
    const advisories = [
      {
        id: `vendor-${Date.now()}-1`,
        title: 'Security Update for MAGNETOM Systems',
        description: 'Critical security patch for network vulnerability',
        vendor: 'Siemens',
        date: new Date().toISOString(),
        category: 'Important', // Vendor advisories are always "Important"
        link: 'https://example.com/advisory'
      }
    ];
    
    // Save advisories (unless dry run)
    if (!dryRun && advisories.length > 0) {
      const existingEvents = await readJSON('events.json');
      existingEvents.push(...advisories);
      await writeJSON('events.json', existingEvents);
    }
    
    res.json({
      success: true,
      dryRun,
      processed: advisories.length,
      advisories: dryRun ? advisories : undefined
    });
    
  } catch (error: any) {
    console.error('Vendor advisories error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch vendor advisories',
      message: error.message,
      dryRun
    });
  }
});

// POST /api/send-digest - Send daily digest email
router.post('/send-digest', async (req, res) => {
  const dryRun = isDryRun(req);
  
  try {
    const events = await readJSON('events.json');
    const today = new Date().toDateString();
    
    // Filter today's digest-worthy events
    const digestEvents = events.filter((e: any) => 
      new Date(e.date).toDateString() === today && 
      e.category === 'Digest'
    );
    
    if (digestEvents.length === 0) {
      return res.json({
        success: true,
        message: 'No digest events for today',
        dryRun
      });
    }
    
    // Get AI summary for digest
    const summary = await batchSummarizeDigest(digestEvents);
    
    // Get users with digest enabled
    const users = await readJSON('users.json');
    const digestUsers = users.filter((u: any) => u.preferences?.digestEmail);
    
    if (!dryRun) {
      for (const user of digestUsers) {
        await sendDailyDigest(user.email, digestEvents, summary);
      }
    }
    
    res.json({
      success: true,
      dryRun,
      sent: dryRun ? 0 : digestUsers.length,
      events: digestEvents.length
    });
    
  } catch (error: any) {
    console.error('Send digest error:', error);
    res.status(500).json({ 
      error: 'Failed to send digest',
      message: error.message,
      dryRun
    });
  }
});

// GET /api/california-alerts - California state sources (RHB + CDPH) - daily
router.get('/california-alerts', async (req, res) => {
  const dryRun = isDryRun(req);
  
  try {
    const events = [];
    
    // Fetch CDPH alerts
    const cdphAlerts = await fetchCDPHAlerts();
    events.push(...cdphAlerts);
    
    // Fetch RHB alerts  
    const rhbAlerts = await fetchRHBAlerts();
    events.push(...rhbAlerts);
    
    // Save events (unless dry run)
    if (!dryRun && events.length > 0) {
      const existingEvents = await readJSON('events.json');
      existingEvents.push(...events);
      await writeJSON('events.json', existingEvents);
    }
    
    res.json({
      source: 'California State Sources (RHB + CDPH)',
      count: events.length,
      fetchedAt: new Date().toISOString(),
      events: dryRun ? events : events.slice(0, 5)
    });
    
  } catch (error: any) {
    console.error('California alerts error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch California alerts',
      message: error.message,
      dryRun
    });
  }
});

export default router;