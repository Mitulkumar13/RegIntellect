import { Router } from 'express';
import { storage } from '../storage';
import { collectAllSources, collectFDARecalls, collectCMSPaymentChanges, collectFederalRegisterNotices } from '../lib/data-collectors';
import { normalizeData, detectPatterns } from '../lib/ai-gemini';
import { scoreEvent, categorizeByScore, getPriorityLevel } from '../lib/score';
import { classifyRadiologyModality, getCaliforniaRegion, calculateRadiologyImpact } from '../lib/radiology-utils';

const router = Router();

// Manual data collection from all sources
router.post('/collect/all', async (req, res) => {
  try {
    console.log('Starting comprehensive data collection...');
    
    const results = await collectAllSources();
    const processedData = [];
    let totalEvents = 0;
    
    for (const result of results) {
      if (result.success && result.data) {
        // Normalize data using AI
        const normalizedData = await normalizeData(result.data);
        
        // Process each normalized event
        for (const normalizedEvent of normalizedData) {
          const eventData = {
            source: result.source,
            sourceId: normalizedEvent.title.substring(0, 50), // Use title as source ID for demo
            title: normalizedEvent.title,
            category: 'Digest', // Will be updated based on score
            score: 0, // Will be updated
            reasons: ['Automated collection'],
            
            // Radiology-specific fields
            deviceName: normalizedEvent.device_name,
            model: normalizedEvent.model,
            manufacturer: normalizedEvent.manufacturer,
            classification: normalizedEvent.classification,
            reason: normalizedEvent.reason_for_recall,
            firm: normalizedEvent.manufacturer,
            state: normalizedEvent.state,
            status: 'Active',
            modalityType: normalizedEvent.modality_type || classifyRadiologyModality(normalizedEvent.device_name || ''),
            radiologyImpact: calculateRadiologyImpact(normalizedEvent),
            californiaRegion: getCaliforniaRegion(normalizedEvent.state || '', 'CA'),
            
            originalData: normalizedEvent
          };
          
          // Score and categorize the event
          const { score, factors } = scoreEvent(eventData);
          eventData.score = score;
          eventData.category = categorizeByScore(score);
          
          // Create event in database
          if (score >= 50) { // Only store events with sufficient score
            const createdEvent = await storage.createEvent(eventData);
            processedData.push({
              ...createdEvent,
              scoringFactors: factors
            });
            totalEvents++;
          }
        }
      }
    }
    
    // Update system status for all sources
    for (const result of results) {
      await storage.updateSystemStatus(result.source.toLowerCase(), {
        lastSuccess: result.success ? new Date() : undefined,
        lastError: result.success ? undefined : new Date(),
        errorCount24h: result.success ? 0 : undefined
      });
    }
    
    // Detect patterns in collected data
    const { patterns, insights } = await detectPatterns(processedData);
    
    res.json({
      success: true,
      totalCollected: totalEvents,
      sourceResults: results.map(r => ({
        source: r.source,
        success: r.success,
        count: r.count,
        error: r.error
      })),
      patterns,
      insights,
      sampleEvents: processedData.slice(0, 5) // Return first 5 events for preview
    });
    
  } catch (error) {
    console.error('Data collection failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      totalCollected: 0
    });
  }
});

// Collect FDA recalls specifically
router.post('/collect/fda', async (req, res) => {
  try {
    const result = await collectFDARecalls();
    
    if (result.success && result.data) {
      const normalizedData = await normalizeData(result.data);
      const processedEvents = [];
      
      for (const event of normalizedData) {
        if (event.normalized) {
          const eventData = {
            source: 'FDA',
            sourceId: event.title.substring(0, 50),
            title: event.title,
            category: categorizeByScore(scoreEvent(event).score),
            score: scoreEvent(event).score,
            reasons: ['FDA Device Enforcement'],
            deviceName: event.device_name,
            manufacturer: event.manufacturer,
            classification: event.classification,
            reason: event.reason_for_recall,
            state: event.state,
            modalityType: event.modality_type,
            originalData: event
          };
          
          const createdEvent = await storage.createEvent(eventData);
          processedEvents.push(createdEvent);
        }
      }
      
      await storage.updateSystemStatus('fda', {
        lastSuccess: new Date(),
        errorCount24h: 0
      });
      
      res.json({
        success: true,
        source: 'FDA',
        processed: processedEvents.length,
        events: processedEvents
      });
    } else {
      throw new Error(result.error || 'FDA collection failed');
    }
  } catch (error) {
    console.error('FDA collection error:', error);
    
    await storage.updateSystemStatus('fda', {
      lastError: new Date(),
      errorCount24h: 1
    });
    
    res.status(500).json({
      success: false,
      source: 'FDA',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Collect CMS payment changes
router.post('/collect/cms', async (req, res) => {
  try {
    const result = await collectCMSPaymentChanges();
    
    if (result.success && result.data) {
      const processedEvents = [];
      
      for (const cmsData of result.data) {
        const eventData = {
          source: 'CMS',
          sourceId: `CMS-${cmsData.cpt_code}-${cmsData.year}`,
          title: `CMS Payment Update: ${cmsData.description}`,
          category: 'Informational',
          score: 75, // CMS changes are always informational
          reasons: ['CMS Payment Schedule Update'],
          cptCodes: [cmsData.cpt_code],
          delta: { old: cmsData.old_rate, new: cmsData.new_rate },
          originalData: cmsData
        };
        
        const createdEvent = await storage.createEvent(eventData);
        processedEvents.push(createdEvent);
      }
      
      await storage.updateSystemStatus('cms', {
        lastSuccess: new Date(),
        errorCount24h: 0
      });
      
      res.json({
        success: true,
        source: 'CMS',
        processed: processedEvents.length,
        events: processedEvents
      });
    } else {
      throw new Error(result.error || 'CMS collection failed');
    }
  } catch (error) {
    console.error('CMS collection error:', error);
    
    await storage.updateSystemStatus('cms', {
      lastError: new Date(),
      errorCount24h: 1
    });
    
    res.status(500).json({
      success: false,
      source: 'CMS',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Collect Federal Register notices
router.post('/collect/fedreg', async (req, res) => {
  try {
    const result = await collectFederalRegisterNotices();
    
    if (result.success && result.data) {
      const processedEvents = [];
      
      for (const notice of result.data) {
        const eventData = {
          source: 'FederalRegister',
          sourceId: notice.id,
          title: notice.title,
          category: 'Informational',
          score: 70, // Federal Register notices are generally informational
          reasons: ['Federal Register Notice'],
          originalData: notice
        };
        
        const createdEvent = await storage.createEvent(eventData);
        processedEvents.push(createdEvent);
      }
      
      await storage.updateSystemStatus('fedreg', {
        lastSuccess: new Date(),
        errorCount24h: 0
      });
      
      res.json({
        success: true,
        source: 'FederalRegister',
        processed: processedEvents.length,
        events: processedEvents
      });
    } else {
      throw new Error(result.error || 'Federal Register collection failed');
    }
  } catch (error) {
    console.error('Federal Register collection error:', error);
    
    await storage.updateSystemStatus('fedreg', {
      lastError: new Date(),
      errorCount24h: 1
    });
    
    res.status(500).json({
      success: false,
      source: 'FederalRegister',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get collection status
router.get('/status', async (req, res) => {
  try {
    const systemStatus = await storage.getSystemStatus();
    const recentEvents = await storage.getEvents(10);
    
    res.json({
      sources: systemStatus,
      recentEvents: recentEvents.length,
      lastActivity: recentEvents[0]?.archivedAt || null
    });
  } catch (error) {
    console.error('Error fetching collection status:', error);
    res.status(500).json({ error: 'Failed to fetch collection status' });
  }
});

// Force refresh all data sources
router.post('/refresh', async (req, res) => {
  try {
    console.log('Manual refresh triggered...');
    
    // This would typically be handled by a scheduled job
    // For now, we'll just trigger a collection
    const results = await collectAllSources();
    
    res.json({
      message: 'Data refresh initiated',
      sources: results.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error during manual refresh:', error);
    res.status(500).json({ error: 'Failed to refresh data sources' });
  }
});

export default router;