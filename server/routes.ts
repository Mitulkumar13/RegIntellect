import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEventSchema, insertFeedbackSchema, type AlertResponse } from "@shared/schema";
import { scoreEvent, categorizeByScore, shouldSummarize } from "./lib/score";
import { normalizeData, detectPatterns } from "./lib/ai-gemini";
import { summarizeEvent } from "./lib/ai-perplexity";
import { sendAlertEmail } from "./lib/email";
import { sendUrgentSMS } from "./lib/sms";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Helper function for retry logic
  async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          const delay = Math.min(200 * Math.pow(4, i), 2000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  // GET /api/recalls - Fetch FDA device enforcement recalls
  app.get("/api/recalls", async (req, res) => {
    try {
      await storage.updateSystemStatus('recalls', { lastSuccess: null, lastError: null });
      
      const response = await withRetry(async () => {
        const fdaResponse = await fetch('https://api.fda.gov/device/enforcement.json?search=report_date:[2024-01-01+TO+2024-12-31]&sort=report_date:desc&limit=50');
        if (!fdaResponse.ok) {
          throw new Error(`FDA API error: ${fdaResponse.status}`);
        }
        return fdaResponse.json();
      });

      const rawEvents = response.results || [];
      const normalized = await normalizeData(rawEvents, 'openFDA');
      const processedEvents = [];

      for (const event of normalized) {
        // Enhance with pattern detection
        const patterns = await detectPatterns(event);
        const enhancedEvent = {
          ...event,
          flags: patterns.flags,
          match: patterns.match,
          sources: ['openfda:enforcement']
        };

        // Score and categorize
        const scoring = scoreEvent(enhancedEvent);
        const category = categorizeByScore(scoring.score);
        
        // Summarize if needed
        let summary = null;
        if (shouldSummarize(category)) {
          summary = await summarizeEvent(enhancedEvent);
        }

        // Create event record
        const eventRecord = {
          source: 'openFDA',
          sourceId: event.id,
          title: event.title,
          summary,
          category,
          score: scoring.score,
          reasons: scoring.reasons,
          deviceName: event.device_name,
          model: event.model,
          manufacturer: event.firm || event.manufacturer,
          classification: event.classification,
          reason: event.reason,
          firm: event.firm,
          state: event.state,
          status: event.status,
          cptCodes: null,
          delta: null,
          originalData: event,
          sourceDate: event.date ? new Date(event.date) : null,
        };

        const savedEvent = await storage.createEvent(eventRecord);
        processedEvents.push(savedEvent);
      }

      await storage.updateSystemStatus('recalls', { lastSuccess: new Date() });

      const alertResponse: AlertResponse = {
        source: 'openFDA device enforcement',
        count: processedEvents.length,
        fetchedAt: new Date().toISOString(),
        events: processedEvents,
      };

      res.json(alertResponse);
    } catch (error) {
      console.error('Recalls endpoint error:', error);
      await storage.updateSystemStatus('recalls', { 
        lastError: new Date(),
        errorCount24h: (await storage.getSystemStatus()).find(s => s.source === 'recalls')?.errorCount24h || 0 + 1
      });
      res.status(500).json({ error: 'Failed to fetch recalls' });
    }
  });

  // GET /api/cms-pfs - Fetch CMS PFS changes
  app.get("/api/cms-pfs", async (req, res) => {
    try {
      await storage.updateSystemStatus('cms_pfs', { lastSuccess: null, lastError: null });

      // Load previous snapshot
      let previousData;
      try {
        previousData = await storage.loadFromFile('cms.json');
      } catch {
        previousData = { lastSnapshot: {}, lastUpdated: null, cptCodes: [] };
      }

      // Mock CMS data for MVP - in production, this would fetch from CMS APIs
      const currentRates = {
        '70553': 296.65, // Brain MRI with contrast
        '70552': 245.32, // Brain MRI without contrast
        '70551': 189.87, // Brain MRI without and with contrast
        '70450': 156.43, // CT head without contrast
        '70460': 198.76, // CT head with contrast
        '70470': 234.21, // CT head without and with contrast
        '72148': 312.45, // MRI lumbar spine without contrast
        '72149': 389.12, // MRI lumbar spine with contrast
        '72158': 445.67, // MRI lumbar spine without and with contrast
        '73721': 278.90, // MRI knee without contrast
        '73722': 334.55, // MRI knee with contrast
      };

      const processedEvents = [];
      const changes = [];

      // Compare with previous snapshot
      for (const [cptCode, newRate] of Object.entries(currentRates)) {
        const oldRate = previousData.lastSnapshot[cptCode];
        
        if (oldRate && oldRate !== newRate) {
          changes.push({
            cptCode,
            oldRate,
            newRate,
            change: newRate - oldRate,
            percentChange: ((newRate - oldRate) / oldRate) * 100
          });
        }
      }

      // Process changes into events
      for (const change of changes) {
        const event = {
          id: `cms-pfs-${change.cptCode}-${Date.now()}`,
          source: 'cms:pfs_change',
          title: `CPT Code ${change.cptCode} Reimbursement Rate Update`,
          device_name: null,
          model: null,
          classification: null,
          reason: 'Medicare PFS rate adjustment',
          firm: 'CMS',
          manufacturer: null,
          state: null,
          status: 'Active',
          codes: [change.cptCode],
          delta: { old: change.oldRate, new: change.newRate },
          match: { exact_model: false, fuzzy_model: false },
          flags: { maude_signal: false, manufacturer_notice: true },
          sources: ['cms:pfs_change'],
          date: new Date().toISOString()
        };

        // Score and categorize
        const scoring = scoreEvent(event);
        const category = categorizeByScore(scoring.score);
        
        // Summarize if needed
        let summary = null;
        if (shouldSummarize(category)) {
          summary = await summarizeEvent(event);
        }

        // Create event record
        const eventRecord = {
          source: 'CMS',
          sourceId: event.id,
          title: event.title,
          summary,
          category,
          score: scoring.score,
          reasons: scoring.reasons,
          deviceName: null,
          model: null,
          manufacturer: event.firm,
          classification: null,
          reason: event.reason,
          firm: event.firm,
          state: null,
          status: event.status,
          cptCodes: event.codes,
          delta: event.delta,
          originalData: event,
          sourceDate: new Date(),
        };

        const savedEvent = await storage.createEvent(eventRecord);
        processedEvents.push(savedEvent);
      }

      // Update snapshot
      await storage.saveToFile('cms.json', {
        lastSnapshot: currentRates,
        lastUpdated: new Date().toISOString(),
        cptCodes: Object.keys(currentRates)
      });

      await storage.updateSystemStatus('cms_pfs', { lastSuccess: new Date() });

      const alertResponse: AlertResponse = {
        source: 'CMS PFS',
        count: processedEvents.length,
        fetchedAt: new Date().toISOString(),
        events: processedEvents,
      };

      res.json(alertResponse);
    } catch (error) {
      console.error('CMS PFS endpoint error:', error);
      await storage.updateSystemStatus('cms_pfs', { 
        lastError: new Date(),
        errorCount24h: (await storage.getSystemStatus()).find(s => s.source === 'cms_pfs')?.errorCount24h || 0 + 1
      });
      res.status(500).json({ error: 'Failed to fetch CMS PFS data' });
    }
  });

  // GET /api/fedreg - Fetch Federal Register items
  app.get("/api/fedreg", async (req, res) => {
    try {
      await storage.updateSystemStatus('fedreg', { lastSuccess: null, lastError: null });

      const response = await withRetry(async () => {
        const fedRegResponse = await fetch('https://www.federalregister.gov/api/v1/articles.json?conditions[term]=radiology+OR+medical+imaging+OR+diagnostic+imaging&conditions[type][]=RULE&conditions[type][]=PRORULE&per_page=20');
        if (!fedRegResponse.ok) {
          throw new Error(`Federal Register API error: ${fedRegResponse.status}`);
        }
        return fedRegResponse.json();
      });

      const rawEvents = response.results || [];
      const normalized = await normalizeData(rawEvents, 'Federal Register');
      const processedEvents = [];

      for (const event of normalized) {
        // Enhance with pattern detection
        const patterns = await detectPatterns(event);
        const enhancedEvent = {
          ...event,
          flags: patterns.flags,
          match: patterns.match,
          sources: ['fedreg:rule']
        };

        // Score and categorize (lower baseline for FedReg)
        const scoring = scoreEvent(enhancedEvent);
        scoring.score = Math.max(scoring.score - 15, 0); // Reduce by 15 points for FedReg
        const category = categorizeByScore(scoring.score);
        
        // Summarize if needed
        let summary = null;
        if (shouldSummarize(category)) {
          summary = await summarizeEvent(enhancedEvent);
        }

        // Create event record
        const eventRecord = {
          source: 'Federal Register',
          sourceId: event.id,
          title: event.title,
          summary,
          category,
          score: scoring.score,
          reasons: scoring.reasons,
          deviceName: null,
          model: null,
          manufacturer: null,
          classification: null,
          reason: event.reason,
          firm: null,
          state: null,
          status: 'Published',
          cptCodes: null,
          delta: null,
          originalData: event,
          sourceDate: event.date ? new Date(event.date) : null,
        };

        const savedEvent = await storage.createEvent(eventRecord);
        processedEvents.push(savedEvent);
      }

      await storage.updateSystemStatus('fedreg', { lastSuccess: new Date() });

      const alertResponse: AlertResponse = {
        source: 'Federal Register',
        count: processedEvents.length,
        fetchedAt: new Date().toISOString(),
        events: processedEvents,
      };

      res.json(alertResponse);
    } catch (error) {
      console.error('Federal Register endpoint error:', error);
      await storage.updateSystemStatus('fedreg', { 
        lastError: new Date(),
        errorCount24h: (await storage.getSystemStatus()).find(s => s.source === 'fedreg')?.errorCount24h || 0 + 1
      });
      res.status(500).json({ error: 'Failed to fetch Federal Register data' });
    }
  });

  // GET /api/events - Get events with filtering
  app.get("/api/events", async (req, res) => {
    try {
      const { limit = '50', category, source } = req.query;
      let events = await storage.getEvents(parseInt(limit as string), category as string);
      
      if (source) {
        events = events.filter(event => event.source === source);
      }
      
      res.json(events);
    } catch (error) {
      console.error('Events endpoint error:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // POST /api/feedback - Submit feedback
  app.post("/api/feedback", async (req, res) => {
    try {
      const validatedData = insertFeedbackSchema.parse(req.body);
      const feedback = await storage.createFeedback(validatedData);
      res.json(feedback);
    } catch (error) {
      console.error('Feedback endpoint error:', error);
      res.status(400).json({ error: 'Invalid feedback data' });
    }
  });

  // POST /api/send-email - Send email alerts
  app.post("/api/send-email", async (req, res) => {
    try {
      const { alertIds, recipients } = req.body;
      
      if (!alertIds?.length || !recipients?.length) {
        return res.status(400).json({ error: 'Missing alert IDs or recipients' });
      }

      const alerts = [];
      for (const id of alertIds) {
        const event = await storage.getEventById(id);
        if (event) alerts.push(event);
      }

      const result = await sendAlertEmail(alerts, recipients);
      res.json(result);
    } catch (error) {
      console.error('Send email endpoint error:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });

  // POST /api/send-sms - Send urgent SMS alerts
  app.post("/api/send-sms", async (req, res) => {
    try {
      const { alertId, phoneNumbers } = req.body;
      
      if (!alertId || !phoneNumbers?.length) {
        return res.status(400).json({ error: 'Missing alert ID or phone numbers' });
      }

      const alert = await storage.getEventById(alertId);
      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      if (alert.category !== 'Urgent') {
        return res.status(400).json({ error: 'SMS only available for urgent alerts' });
      }

      const results = await sendUrgentSMS(alert, phoneNumbers);
      res.json(results);
    } catch (error) {
      console.error('Send SMS endpoint error:', error);
      res.status(500).json({ error: 'Failed to send SMS' });
    }
  });

  // GET /api/status - System status
  app.get("/api/status", async (req, res) => {
    try {
      const systemStatus = await storage.getSystemStatus();
      
      const status: {
        lastSuccess: Record<string, Date | null>;
        lastError: Record<string, Date | null>;
        errorCounts24h: Record<string, number>;
        lastDigestSent: Date | null;
        uptime: number;
        timestamp: string;
      } = {
        lastSuccess: {},
        lastError: {},
        errorCounts24h: {},
        lastDigestSent: null,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      };

      systemStatus.forEach(s => {
        status.lastSuccess[s.source] = s.lastSuccess;
        status.lastError[s.source] = s.lastError;
        status.errorCounts24h[s.source] = s.errorCount24h || 0;
        if (s.source === 'digest' && s.lastDigestSent) {
          status.lastDigestSent = s.lastDigestSent;
        }
      });

      res.json(status);
    } catch (error) {
      console.error('Status endpoint error:', error);
      res.status(500).json({ error: 'Failed to get system status' });
    }
  });

  // GET /api/drug-recalls - Fetch FDA drug recalls and shortages
  app.get("/api/drug-recalls", async (req, res) => {
    try {
      await storage.updateSystemStatus('drug_recalls', { lastSuccess: null, lastError: null });
      
      // Fetch drug enforcement reports
      const drugResponse = await withRetry(async () => {
        const fdaResponse = await fetch('https://api.fda.gov/drug/enforcement.json?search=report_date:[2024-01-01+TO+2024-12-31]+AND+(product_description:contrast+OR+product_description:anesthetic+OR+product_description:sedation+OR+product_description:gadolinium+OR+product_description:iodine)&sort=report_date:desc&limit=50');
        if (!fdaResponse.ok) {
          throw new Error(`FDA Drug API error: ${fdaResponse.status}`);
        }
        return fdaResponse.json();
      });

      // Fetch drug shortage data
      const shortageResponse = await withRetry(async () => {
        const fdaShortageResponse = await fetch('https://api.fda.gov/drug/drugsfda.json?search=products.active_ingredients:contrast+OR+products.active_ingredients:gadolinium+OR+products.active_ingredients:iodine&limit=20');
        if (!fdaShortageResponse.ok) {
          throw new Error(`FDA Shortage API error: ${fdaShortageResponse.status}`);
        }
        return fdaShortageResponse.json();
      });

      const rawEvents = [
        ...(drugResponse.results || []).map((item: any) => ({ ...item, type: 'recall' })),
        ...(shortageResponse.results || []).map((item: any) => ({ ...item, type: 'shortage' }))
      ];

      const normalized = await normalizeData(rawEvents, 'FDA Drug');
      const processedEvents = [];

      for (const event of normalized) {
        const patterns = await detectPatterns(event);
        const enhancedEvent = {
          ...event,
          flags: patterns.flags,
          match: patterns.match,
          sources: [`fda:drug_${event.type}`]
        };

        const scoring = scoreEvent(enhancedEvent);
        // Higher scores for contrast agents and anesthetics
        if (event.title?.toLowerCase().includes('contrast') || 
            event.title?.toLowerCase().includes('anesthetic') ||
            event.title?.toLowerCase().includes('gadolinium')) {
          scoring.score += 20;
        }
        
        const originalData = event.originalData || event;
        
        const category = categorizeByScore(scoring.score);
        
        let summary = null;
        if (shouldSummarize(category)) {
          summary = await summarizeEvent(enhancedEvent);
        }

        const eventRecord = {
          source: 'FDA Drug',
          sourceId: event.id,
          title: event.title,
          summary,
          category,
          score: scoring.score,
          reasons: scoring.reasons,
          deviceName: originalData.product_description || null,
          model: null,
          manufacturer: originalData.recalling_firm || null,
          classification: event.classification,
          reason: originalData.reason_for_recall || event.reason,
          firm: originalData.recalling_firm || null,
          state: event.state,
          status: event.status,
          cptCodes: null,
          delta: null,
          originalData: originalData,
          sourceDate: originalData.report_date ? new Date(originalData.report_date) : null,
        };

        const savedEvent = await storage.createEvent(eventRecord);
        processedEvents.push(savedEvent);
      }

      await storage.updateSystemStatus('drug_recalls', { lastSuccess: new Date() });

      const alertResponse: AlertResponse = {
        source: 'FDA Drug Recalls & Shortages',
        count: processedEvents.length,
        fetchedAt: new Date().toISOString(),
        events: processedEvents,
      };

      res.json(alertResponse);
    } catch (error) {
      console.error('Drug recalls endpoint error:', error);
      await storage.updateSystemStatus('drug_recalls', { 
        lastError: new Date(),
        errorCount24h: (await storage.getSystemStatus()).find(s => s.source === 'drug_recalls')?.errorCount24h || 0 + 1
      });
      res.status(500).json({ error: 'Failed to fetch drug recalls' });
    }
  });

  // GET /api/maude - Fetch MAUDE data as supporting signal
  app.get("/api/maude", async (req, res) => {
    try {
      await storage.updateSystemStatus('maude', { lastSuccess: null, lastError: null });
      
      const response = await withRetry(async () => {
        const maudeResponse = await fetch('https://api.fda.gov/device/event.json?search=date_received:[2024-01-01+TO+2024-12-31]+AND+(device.generic_name:imaging+OR+device.generic_name:contrast+OR+device.generic_name:mri+OR+device.generic_name:ct+OR+device.generic_name:xray)&sort=date_received:desc&limit=100');
        if (!maudeResponse.ok) {
          throw new Error(`MAUDE API error: ${maudeResponse.status}`);
        }
        return maudeResponse.json();
      });

      const rawEvents = response.results || [];
      
      // Process MAUDE data to identify patterns and signals
      const devicePatterns = new Map();
      const severityPatterns = new Map();
      
      for (const event of rawEvents) {
        const deviceKey = `${event.device?.manufacturer_name || 'Unknown'}-${event.device?.model_number || 'Unknown'}`;
        const severity = event.event_type || 'Unknown';
        
        devicePatterns.set(deviceKey, (devicePatterns.get(deviceKey) || 0) + 1);
        severityPatterns.set(severity, (severityPatterns.get(severity) || 0) + 1);
      }

      // Only create events for significant patterns (3+ reports for same device)
      const processedEvents = [];
      const significantDevices = Array.from(devicePatterns.entries())
        .filter(([_, count]) => count >= 3)
        .map(([deviceKey, count]) => ({ deviceKey, count }));

      for (const { deviceKey, count } of significantDevices) {
        const [manufacturer, model] = deviceKey.split('-');
        
        const event = {
          id: `maude-pattern-${deviceKey.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`,
          source: 'maude:pattern',
          title: `MAUDE Signal: ${count} reports for ${manufacturer} ${model}`,
          device_name: model,
          model: model,
          manufacturer: manufacturer,
          classification: 'Signal',
          reason: `${count} adverse event reports detected`,
          firm: manufacturer,
          status: 'Pattern Detected',
          match: { exact_model: true, fuzzy_model: false },
          flags: { maude_signal: true, manufacturer_notice: false },
          sources: ['maude:signal'],
          date: new Date().toISOString()
        };

        const patterns = await detectPatterns(event);
        const enhancedEvent = {
          ...event,
          flags: { ...event.flags, ...patterns.flags },
          match: patterns.match
        };

        const scoring = scoreEvent(enhancedEvent);
        // MAUDE signals are supportive, so lower baseline score
        scoring.score = Math.min(scoring.score, 70);
        const category = categorizeByScore(scoring.score);
        
        let summary = null;
        if (shouldSummarize(category)) {
          summary = await summarizeEvent(enhancedEvent);
        }

        const eventRecord = {
          source: 'MAUDE',
          sourceId: event.id,
          title: event.title,
          summary,
          category,
          score: scoring.score,
          reasons: scoring.reasons,
          deviceName: event.device_name,
          model: event.model,
          manufacturer: event.manufacturer,
          classification: event.classification,
          reason: event.reason,
          firm: event.firm,
          state: null,
          status: event.status,
          cptCodes: null,
          delta: null,
          originalData: { signalCount: count, deviceKey },
          sourceDate: new Date(),
        };

        const savedEvent = await storage.createEvent(eventRecord);
        processedEvents.push(savedEvent);
      }

      await storage.updateSystemStatus('maude', { lastSuccess: new Date() });

      const alertResponse: AlertResponse = {
        source: 'MAUDE Signals',
        count: processedEvents.length,
        fetchedAt: new Date().toISOString(),
        events: processedEvents,
      };

      res.json(alertResponse);
    } catch (error) {
      console.error('MAUDE endpoint error:', error);
      await storage.updateSystemStatus('maude', { 
        lastError: new Date(),
        errorCount24h: (await storage.getSystemStatus()).find(s => s.source === 'maude')?.errorCount24h || 0 + 1
      });
      res.status(500).json({ error: 'Failed to fetch MAUDE data' });
    }
  });

  // GET /api/audit-deadlines - Track audit deadlines and compliance dates
  app.get("/api/audit-deadlines", async (req, res) => {
    try {
      await storage.updateSystemStatus('audit_deadlines', { lastSuccess: null, lastError: null });
      
      // Fetch MQSA and other regulatory deadlines
      const fedRegResponse = await withRetry(async () => {
        const response = await fetch('https://www.federalregister.gov/api/v1/articles.json?conditions[term]=MQSA+OR+mammography+OR+audit+OR+deadline+OR+compliance&conditions[type][]=RULE&conditions[type][]=NOTICE&per_page=30');
        if (!response.ok) {
          throw new Error(`Federal Register API error: ${response.status}`);
        }
        return response.json();
      });

      // Fetch CMS rule dates  
      const cmsResponse = await withRetry(async () => {
        const response = await fetch('https://www.federalregister.gov/api/v1/articles.json?conditions[agencies][]=centers-for-medicare-medicaid-services&conditions[term]=radiology+OR+imaging+OR+deadline&conditions[type][]=RULE&per_page=20');
        if (!response.ok) {
          throw new Error(`CMS Rules API error: ${response.status}`);
        }
        return response.json();
      });

      const rawEvents = [
        ...(fedRegResponse.results || []).map((item: any) => ({ ...item, source_type: 'mqsa' })),
        ...(cmsResponse.results || []).map((item: any) => ({ ...item, source_type: 'cms_rule' }))
      ];

      const processedEvents = [];
      const now = new Date();

      for (const event of rawEvents) {
        // Extract dates from the event
        const effectiveDate = event.effective_on ? new Date(event.effective_on) : null;
        const commentDate = event.comments_close_on ? new Date(event.comments_close_on) : null;
        
        // Only process future deadlines or recent past (30 days)
        const relevantDate = effectiveDate || commentDate;
        if (!relevantDate) continue;
        
        const daysDiff = Math.ceil((relevantDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff < -30 || daysDiff > 365) continue; // Skip if too old or too far future

        let urgencyScore = 50;
        if (daysDiff <= 7) urgencyScore = 90;      // 1 week
        else if (daysDiff <= 30) urgencyScore = 80; // 1 month  
        else if (daysDiff <= 90) urgencyScore = 70; // 3 months

        const deadlineEvent = {
          id: `deadline-${event.document_number}-${Date.now()}`,
          source: event.source_type,
          title: `Deadline: ${event.title}`,
          device_name: null,
          model: null,
          manufacturer: null,
          classification: 'Deadline',
          reason: `Compliance deadline: ${relevantDate.toDateString()}`,
          firm: event.agencies?.[0]?.name || 'Federal Agency',
          status: daysDiff > 0 ? 'Upcoming' : 'Overdue',
          deadline_date: relevantDate,
          days_remaining: daysDiff,
          match: { exact_model: false, fuzzy_model: false },
          flags: { 
            maude_signal: false, 
            manufacturer_notice: false,
            deadline_alert: true,
            urgent_deadline: daysDiff <= 30
          },
          sources: [`${event.source_type}:deadline`],
          date: new Date().toISOString()
        };

        const patterns = await detectPatterns(deadlineEvent);
        const enhancedEvent = {
          ...deadlineEvent,
          flags: { ...deadlineEvent.flags, ...patterns.flags }
        };

        const scoring = scoreEvent(enhancedEvent);
        scoring.score = urgencyScore; // Override with deadline urgency
        const category = categorizeByScore(scoring.score);
        
        let summary = null;
        if (shouldSummarize(category)) {
          summary = await summarizeEvent(enhancedEvent);
        }

        const eventRecord = {
          source: `${event.source_type.toUpperCase()} Deadline`,
          sourceId: deadlineEvent.id,
          title: deadlineEvent.title,
          summary,
          category,
          score: scoring.score,
          reasons: [`Deadline in ${daysDiff} days`, ...scoring.reasons],
          deviceName: null,
          model: null,
          manufacturer: null,
          classification: deadlineEvent.classification,
          reason: deadlineEvent.reason,
          firm: deadlineEvent.firm,
          state: null,
          status: deadlineEvent.status,
          cptCodes: null,
          delta: null,
          originalData: { ...event, deadline_date: relevantDate, days_remaining: daysDiff },
          sourceDate: relevantDate,
        };

        const savedEvent = await storage.createEvent(eventRecord);
        processedEvents.push(savedEvent);
      }

      await storage.updateSystemStatus('audit_deadlines', { lastSuccess: new Date() });

      const alertResponse: AlertResponse = {
        source: 'Audit Deadlines',
        count: processedEvents.length,
        fetchedAt: new Date().toISOString(),
        events: processedEvents,
      };

      res.json(alertResponse);
    } catch (error) {
      console.error('Audit deadlines endpoint error:', error);
      await storage.updateSystemStatus('audit_deadlines', { 
        lastError: new Date(),
        errorCount24h: (await storage.getSystemStatus()).find(s => s.source === 'audit_deadlines')?.errorCount24h || 0 + 1
      });
      res.status(500).json({ error: 'Failed to fetch audit deadlines' });
    }
  });

  // GET /api/state-doh - Monitor state DOH radiology updates
  app.get("/api/state-doh", async (req, res) => {
    try {
      await storage.updateSystemStatus('state_doh', { lastSuccess: null, lastError: null });
      
      // Key state DOH RSS feeds and APIs for radiology
      const stateSources = [
        { state: 'CA', url: 'https://www.cdph.ca.gov/Programs/CHCQ/LCP/Pages/default.aspx' },
        { state: 'NY', url: 'https://www.health.ny.gov/professionals/patients/patient_rights/' },
        { state: 'TX', url: 'https://www.dshs.texas.gov/medical-radiologic-technology/' },
        { state: 'FL', url: 'https://floridahealth.gov/licensing-and-regulation/' }
      ];

      // For MVP, we'll simulate state DOH monitoring
      // In production, this would parse RSS feeds or scrape state websites
      const mockStateUpdates = [
        {
          state: 'CA',
          title: 'California CDPH Updates Mammography Facility Requirements',
          type: 'regulation_update',
          agency: 'California Department of Public Health',
          effective_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
          description: 'New requirements for mammography facility inspections'
        },
        {
          state: 'NY', 
          title: 'New York State Medical Imaging License Renewal Period',
          type: 'license_renewal',
          agency: 'New York State Department of Health',
          effective_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
          description: 'Renewal period for medical imaging professional licenses'
        }
      ];

      const processedEvents = [];

      for (const update of mockStateUpdates) {
        const now = new Date();
        const daysDiff = Math.ceil((update.effective_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        let score = 45; // Base score for state updates
        if (daysDiff <= 30) score = 65;
        if (daysDiff <= 14) score = 75;

        const stateEvent = {
          id: `state-doh-${update.state}-${Date.now()}`,
          source: `state_doh:${update.state.toLowerCase()}`,
          title: update.title,
          device_name: null,
          model: null,
          manufacturer: null,
          classification: update.type,
          reason: update.description,
          firm: update.agency,
          status: 'Active',
          state: update.state,
          effective_date: update.effective_date,
          days_until_effective: daysDiff,
          match: { exact_model: false, fuzzy_model: false },
          flags: { 
            maude_signal: false, 
            manufacturer_notice: false,
            state_regulation: true
          },
          sources: [`state_doh:${update.state.toLowerCase()}`],
          date: new Date().toISOString()
        };

        const patterns = await detectPatterns(stateEvent);
        const enhancedEvent = {
          ...stateEvent,
          flags: { ...stateEvent.flags, ...patterns.flags }
        };

        const scoring = scoreEvent(enhancedEvent);
        scoring.score = score;
        const category = categorizeByScore(scoring.score);
        
        let summary = null;
        if (shouldSummarize(category)) {
          summary = await summarizeEvent(enhancedEvent);
        }

        const eventRecord = {
          source: `${update.state} DOH`,
          sourceId: stateEvent.id,
          title: stateEvent.title,
          summary,
          category,
          score: scoring.score,
          reasons: scoring.reasons,
          deviceName: null,
          model: null,
          manufacturer: null,
          classification: stateEvent.classification,
          reason: stateEvent.reason,
          firm: stateEvent.firm,
          state: stateEvent.state,
          status: stateEvent.status,
          cptCodes: null,
          delta: null,
          originalData: { ...update, days_until_effective: daysDiff },
          sourceDate: update.effective_date,
        };

        const savedEvent = await storage.createEvent(eventRecord);
        processedEvents.push(savedEvent);
      }

      await storage.updateSystemStatus('state_doh', { lastSuccess: new Date() });

      const alertResponse: AlertResponse = {
        source: 'State DOH Updates',
        count: processedEvents.length,
        fetchedAt: new Date().toISOString(),
        events: processedEvents,
      };

      res.json(alertResponse);
    } catch (error) {
      console.error('State DOH endpoint error:', error);
      await storage.updateSystemStatus('state_doh', { 
        lastError: new Date(),
        errorCount24h: (await storage.getSystemStatus()).find(s => s.source === 'state_doh')?.errorCount24h || 0 + 1
      });
      res.status(500).json({ error: 'Failed to fetch state DOH updates' });
    }
  });

  // Health check endpoint moved to /api/health to avoid conflicts with frontend routing
  app.get("/api/health", (req, res) => {
    res.json({ 
      message: "RadIntel service running",
      version: "1.0.0",
      timestamp: new Date().toISOString()
    });
  });



  const httpServer = createServer(app);
  return httpServer;
}
