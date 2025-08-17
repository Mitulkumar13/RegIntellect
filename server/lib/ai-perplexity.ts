// Perplexity AI integration for clinical alert summarization

export interface SummaryRequest {
  title: string;
  description: string;
  classification?: string;
  device_type?: string;
  manufacturer?: string;
  impact_level?: string;
}

export interface SummaryResponse {
  summary: string;
  action_required: boolean;
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  clinic_impact: string;
}

export async function summarizeEvent(eventData: SummaryRequest): Promise<SummaryResponse> {
  try {
    console.log(`Generating clinical summary for: ${eventData.title}`);
    
    // Mock implementation for MVP - replace with actual Perplexity API call
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Generate mock summary based on event characteristics
    const summary = generateMockSummary(eventData);
    const actionRequired = determineActionRequired(eventData);
    const urgencyLevel = determineUrgencyLevel(eventData);
    const clinicImpact = generateClinicImpact(eventData);
    
    return {
      summary,
      action_required: actionRequired,
      urgency_level: urgencyLevel,
      clinic_impact: clinicImpact
    };
  } catch (error) {
    console.error('Perplexity AI summarization failed:', error);
    
    // Fallback summary
    return {
      summary: `${eventData.device_type || 'Device'} alert: ${eventData.title}. Review manufacturer guidance and assess clinic impact.`,
      action_required: true,
      urgency_level: 'medium',
      clinic_impact: 'Review required to determine specific clinic impact.'
    };
  }
}

export async function generateDigestSummary(events: SummaryRequest[]): Promise<string> {
  try {
    console.log(`Generating digest summary for ${events.length} events`);
    
    // Mock implementation - replace with actual Perplexity API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const highPriorityCount = events.filter(e => e.impact_level === 'high').length;
    const deviceTypes = [...new Set(events.map(e => e.device_type).filter(Boolean))];
    const manufacturers = [...new Set(events.map(e => e.manufacturer).filter(Boolean))];
    
    let digest = `Weekly Radiology Compliance Digest - ${events.length} alerts reviewed:\n\n`;
    
    if (highPriorityCount > 0) {
      digest += `🚨 ${highPriorityCount} high-priority alerts requiring immediate attention.\n`;
    }
    
    if (deviceTypes.length > 0) {
      digest += `📋 Equipment alerts: ${deviceTypes.slice(0, 3).join(', ')}${deviceTypes.length > 3 ? ' and others' : ''}.\n`;
    }
    
    if (manufacturers.length > 0) {
      digest += `🏭 Manufacturers with advisories: ${manufacturers.slice(0, 3).join(', ')}${manufacturers.length > 3 ? ' and others' : ''}.\n`;
    }
    
    digest += `\n💡 Recommendation: Review high-priority alerts first, then assess equipment-specific impacts on your clinic operations.`;
    
    return digest;
  } catch (error) {
    console.error('Digest summarization failed:', error);
    return `Weekly digest: ${events.length} alerts reviewed. Please review individual alerts for specific details.`;
  }
}

// Helper functions for mock implementation
function generateMockSummary(eventData: SummaryRequest): string {
  const device = eventData.device_type || 'medical device';
  const manufacturer = eventData.manufacturer ? ` from ${eventData.manufacturer}` : '';
  
  if (eventData.classification === 'Class I') {
    return `Critical ${device} recall${manufacturer}. Immediate action required - stop using affected equipment and contact service representative. Patient safety may be at risk.`;
  } else if (eventData.classification === 'Class II') {
    return `Important ${device} alert${manufacturer}. Review affected equipment and follow manufacturer guidance. Schedule service check if needed.`;
  } else if (eventData.classification === 'Class III') {
    return `${device} advisory${manufacturer}. Minor issue reported - review during next scheduled maintenance. Low patient risk.`;
  } else {
    return `${device} notification${manufacturer}. Review details and assess impact on your clinic operations.`;
  }
}

function determineActionRequired(eventData: SummaryRequest): boolean {
  return eventData.classification === 'Class I' || 
         eventData.classification === 'Class II' ||
         eventData.impact_level === 'high';
}

function determineUrgencyLevel(eventData: SummaryRequest): 'low' | 'medium' | 'high' | 'critical' {
  if (eventData.classification === 'Class I') return 'critical';
  if (eventData.classification === 'Class II') return 'high';
  if (eventData.classification === 'Class III') return 'medium';
  if (eventData.impact_level === 'high') return 'high';
  return 'medium';
}

function generateClinicImpact(eventData: SummaryRequest): string {
  const device = eventData.device_type || 'equipment';
  
  if (eventData.classification === 'Class I') {
    return `High impact - immediately verify if you have affected ${device} and take corrective action.`;
  } else if (eventData.classification === 'Class II') {
    return `Medium impact - check ${device} inventory and plan maintenance window for updates.`;
  } else {
    return `Low to medium impact - review ${device} operations during routine quality checks.`;
  }
}