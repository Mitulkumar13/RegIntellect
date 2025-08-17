import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { insertAlertSchema, insertComplianceItemSchema } from '@shared/schema';
import { scoreEvent, categorizeByScore, getPriorityLevel } from '../lib/score';
import { summarizeEvent } from '../lib/ai-perplexity';
import { sendAlertEmail, sendUrgentSMS } from '../lib/email-alerts';

const router = Router();

// Get alerts for a specific clinic
router.get('/clinics/:id/alerts', async (req, res) => {
  try {
    const { limit = '50', priority } = req.query;
    let alerts;
    
    if (priority) {
      alerts = await storage.getAlertsByPriority(priority as string);
    } else {
      alerts = await storage.getAlertsByClinic(req.params.id, parseInt(limit as string));
    }
    
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching clinic alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get system-wide alerts
router.get('/alerts/system', async (req, res) => {
  try {
    const { limit = '50' } = req.query;
    const alerts = await storage.getSystemWideAlerts(parseInt(limit as string));
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching system alerts:', error);
    res.status(500).json({ error: 'Failed to fetch system alerts' });
  }
});

// Get unacknowledged alerts
router.get('/alerts/unacknowledged', async (req, res) => {
  try {
    const { clinicId } = req.query;
    const alerts = await storage.getUnacknowledgedAlerts(clinicId as string);
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching unacknowledged alerts:', error);
    res.status(500).json({ error: 'Failed to fetch unacknowledged alerts' });
  }
});

// Create new alert
router.post('/alerts', async (req, res) => {
  try {
    const alertData = insertAlertSchema.parse(req.body);
    const alert = await storage.createAlert(alertData);
    res.status(201).json(alert);
  } catch (error) {
    console.error('Error creating alert:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid alert data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Acknowledge alert
router.patch('/alerts/:id/acknowledge', async (req, res) => {
  try {
    const { acknowledgedBy = 'System User' } = req.body;
    const alert = await storage.acknowledgeAlert(req.params.id, acknowledgedBy);
    res.json(alert);
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// Process and create alerts from raw event data
router.post('/alerts/process', async (req, res) => {
  try {
    const { events, clinicId } = req.body;
    
    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Events must be an array' });
    }
    
    const processedAlerts = [];
    
    for (const event of events) {
      // Score the event
      const { score, factors } = scoreEvent(event);
      const priority = getPriorityLevel(score);
      const category = categorizeByScore(score);
      
      // Skip suppressed events
      if (category === 'Suppressed') continue;
      
      // Generate summary for high-priority events
      let summary = event.summary;
      if (score >= 75) {
        try {
          const summaryResponse = await summarizeEvent({
            title: event.title,
            description: event.product_description || event.device_name || '',
            classification: event.classification,
            device_type: event.modality_type,
            manufacturer: event.manufacturer,
            impact_level: priority.toLowerCase()
          });
          summary = summaryResponse.summary;
        } catch (summaryError) {
          console.warn('Failed to generate AI summary:', summaryError);
        }
      }
      
      // Create alert
      const alertData = {
        clinicId: clinicId || null,
        type: determineAlertType(event),
        priority,
        source: event.source,
        title: event.title,
        summary,
        cptCodes: event.cpt_codes || [],
        payload: event
      };
      
      const alert = await storage.createAlert(alertData);
      processedAlerts.push(alert);
      
      // Send urgent notifications for critical alerts
      if (priority === 'CRITICAL' && clinicId) {
        try {
          const clinic = await storage.getClinicById(clinicId);
          if (clinic && clinic.contactEmails.length > 0) {
            await sendAlertEmail([alert], clinic.contactEmails);
          }
        } catch (notificationError) {
          console.error('Failed to send urgent notification:', notificationError);
        }
      }
    }
    
    res.json({
      processed: processedAlerts.length,
      alerts: processedAlerts
    });
  } catch (error) {
    console.error('Error processing alerts:', error);
    res.status(500).json({ error: 'Failed to process alerts' });
  }
});

// Get compliance items for clinic
router.get('/clinics/:id/compliance', async (req, res) => {
  try {
    const complianceItems = await storage.getComplianceItemsByClinic(req.params.id);
    res.json(complianceItems);
  } catch (error) {
    console.error('Error fetching compliance items:', error);
    res.status(500).json({ error: 'Failed to fetch compliance items' });
  }
});

// Get overdue compliance items
router.get('/compliance/overdue', async (req, res) => {
  try {
    const { clinicId } = req.query;
    const overdueItems = await storage.getOverdueComplianceItems(clinicId as string);
    res.json(overdueItems);
  } catch (error) {
    console.error('Error fetching overdue compliance:', error);
    res.status(500).json({ error: 'Failed to fetch overdue compliance items' });
  }
});

// Create compliance item
router.post('/compliance', async (req, res) => {
  try {
    const itemData = insertComplianceItemSchema.parse(req.body);
    const item = await storage.createComplianceItem(itemData);
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating compliance item:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid compliance item data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create compliance item' });
  }
});

// Update compliance item
router.patch('/compliance/:id', async (req, res) => {
  try {
    const updates = req.body;
    const item = await storage.updateComplianceItem(req.params.id, updates);
    res.json(item);
  } catch (error) {
    console.error('Error updating compliance item:', error);
    res.status(500).json({ error: 'Failed to update compliance item' });
  }
});

// Helper function to determine alert type
function determineAlertType(event: any): string {
  if (event.source?.toLowerCase().includes('fda') || event.recall_number) {
    return 'device_recall';
  }
  if (event.source?.toLowerCase().includes('cms') || event.cpt_code) {
    return 'cms_pfs';
  }
  if (event.source?.toLowerCase().includes('cdph') || 
      event.source?.toLowerCase().includes('rhb') ||
      event.source?.toLowerCase().includes('mbc')) {
    return 'regulatory';
  }
  if (event.due_date) {
    return 'compliance';
  }
  return 'regulatory';
}

export default router;