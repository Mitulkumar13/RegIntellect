import { Router } from 'express';
import { scoreEvent, generateEventSignature, isDuplicate, shouldSummarize } from '../lib/scoring';
import { normalizeWithGemini, summarizeWithPerplexity, batchSummarizeDigest, getAIUsageStatus } from '../lib/ai-services';
import { sendUrgentAlert, sendInformationalAlert, sendDailyDigest } from '../lib/email-service';
import { readJSON, writeJSON } from '../lib/json-storage';

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
        const aiNormalized = await normalizeWithGemini(recall);
        if (aiNormalized) {
          normalized = { ...normalized, ...aiNormalized };
        }
      }
      
      // Add AI summary if applicable
      if (shouldSummarize(scoring.category)) {
        const summary = await summarizeWithPerplexity(
          `${normalized.title}\n${normalized.description}`,
          scoring.category
        );
        if (summary) {
          normalized.summary = summary;
        }
      }
      
      events.push(normalized);
      
      // Send alerts based on category (unless dry run)
      if (!dryRun) {
        eventSignatures.set(signature, new Date());
        
        // Get users with email notifications enabled
        const emailUsers = users.filter((u: any) => u.preferences?.urgentEmail);
        
        if (scoring.category === 'Urgent') {
          for (const user of emailUsers) {
            await sendUrgentAlert(user.email, normalized);
          }
        } else if (scoring.category === 'Informational' && emailUsers.some((u: any) => u.preferences?.informationalEmail)) {
          for (const user of emailUsers.filter((u: any) => u.preferences?.informationalEmail)) {
            await sendInformationalAlert(user.email, normalized);
          }
        }
        
        // Save event
        const existingEvents = await readJSON('events.json');
        existingEvents.push(normalized);
        // Keep only last 5000 events
        if (existingEvents.length > 5000) {
          existingEvents.splice(0, existingEvents.length - 5000);
        }
        await writeJSON('events.json', existingEvents);
      }
    }
    
    // Update system status
    if (!dryRun) {
      const status = await readJSON('system-status.json');
      status.lastSuccess.fdaDevice = new Date().toISOString();
      await writeJSON('system-status.json', status);
    }
    
    res.json({
      success: true,
      dryRun,
      processed: events.length,
      events: dryRun ? events : undefined,
      aiUsage: getAIUsageStatus()
    });
    
  } catch (error: any) {
    console.error('FDA device recall error:', error);
    
    if (!dryRun) {
      const status = await readJSON('system-status.json');
      status.lastError.fdaDevice = {
        time: new Date().toISOString(),
        message: error.message
      };
      await writeJSON('system-status.json', status);
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch FDA device recalls',
      message: error.message,
      dryRun
    });
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
    // Fetch from Federal Register API
    const fedRegUrl = 'https://www.federalregister.gov/api/v1/documents?conditions[agencies][]=health-and-human-services-department&conditions[agencies][]=centers-for-medicare-medicaid-services&per_page=50';
    
    const response = await fetch(fedRegUrl);
    const deadlines = [];
    
    if (response.ok) {
      const data = await response.json();
      
      for (const doc of data.results || []) {
        if (doc.comments_close_on || doc.effective_on) {
          deadlines.push({
            id: `fedreg-${doc.document_number}`,
            title: doc.title,
            dueDate: doc.comments_close_on || doc.effective_on,
            actionRequired: doc.comments_close_on ? 'Submit comments' : 'Effective date',
            source: 'Federal Register',
            link: doc.html_url,
            category: 'Digest' // Default to digest
          });
        }
      }
    }
    
    // Save deadlines (unless dry run)
    if (!dryRun && deadlines.length > 0) {
      await writeJSON('deadlines.json', deadlines);
    }
    
    res.json({
      success: true,
      dryRun,
      processed: deadlines.length,
      deadlines: dryRun ? deadlines : undefined
    });
    
  } catch (error: any) {
    console.error('Deadlines error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch deadlines',
      message: error.message,
      dryRun
    });
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

export default router;