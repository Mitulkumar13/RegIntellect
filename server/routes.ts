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
