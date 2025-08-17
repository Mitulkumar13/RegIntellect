// Email and SMS alert notification services

import { Alert } from '@shared/schema';

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  phoneNumber: string;
}

export async function sendAlertEmail(alerts: Alert[], recipients: string[]): Promise<EmailResult> {
  try {
    console.log(`Sending email alerts to ${recipients.length} recipients for ${alerts.length} alerts`);
    
    // Mock implementation - replace with actual email service
    // This would integrate with SendGrid, Mailgun, Brevo, etc.
    
    const emailSubject = alerts.length === 1 
      ? `RadIntel CA Alert: ${alerts[0].title}`
      : `RadIntel CA Digest: ${alerts.length} New Alerts`;
    
    const emailBody = generateEmailBody(alerts);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Log for demo purposes
    console.log('Email Content:', {
      to: recipients,
      subject: emailSubject,
      body: emailBody.substring(0, 200) + '...'
    });
    
    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
  } catch (error) {
    console.error('Email sending failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error'
    };
  }
}

export async function sendUrgentSMS(alert: Alert, phoneNumbers: string[]): Promise<SMSResult[]> {
  const results: SMSResult[] = [];
  
  for (const phoneNumber of phoneNumbers) {
    try {
      console.log(`Sending urgent SMS to ${phoneNumber} for alert: ${alert.title}`);
      
      // Mock implementation - replace with Twilio or similar SMS service
      const smsBody = generateSMSBody(alert);
      
      // Simulate SMS sending delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Log for demo purposes
      console.log('SMS Content:', {
        to: phoneNumber,
        body: smsBody
      });
      
      results.push({
        success: true,
        messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        phoneNumber
      });
      
    } catch (error) {
      console.error(`SMS sending failed to ${phoneNumber}:`, error);
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown SMS error',
        phoneNumber
      });
    }
  }
  
  return results;
}

function generateEmailBody(alerts: Alert[]): string {
  if (alerts.length === 1) {
    const alert = alerts[0];
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
    .alert { border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; background-color: #fef2f2; }
    .priority-critical { border-left-color: #dc2626; background-color: #fef2f2; }
    .priority-high { border-left-color: #f59e0b; background-color: #fffbeb; }
    .priority-medium { border-left-color: #3b82f6; background-color: #eff6ff; }
    .priority-low { border-left-color: #10b981; background-color: #f0fdf4; }
    .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>RadIntel CA Alert</h1>
    <p>California Radiology Compliance Intelligence</p>
  </div>
  
  <div class="alert priority-${alert.priority.toLowerCase()}">
    <h2>${alert.title}</h2>
    <p><strong>Priority:</strong> ${alert.priority}</p>
    <p><strong>Source:</strong> ${alert.source}</p>
    ${alert.summary ? `<p><strong>Summary:</strong> ${alert.summary}</p>` : ''}
    ${alert.cptCodes && alert.cptCodes.length > 0 ? `<p><strong>Affected CPT Codes:</strong> ${alert.cptCodes.join(', ')}</p>` : ''}
    <p><strong>Date:</strong> ${new Date(alert.createdAt).toLocaleDateString()}</p>
  </div>
  
  <div class="footer">
    <p>This is an automated alert from RadIntel CA. Please review and acknowledge in your dashboard.</p>
    <p>© 2025 RadIntel CA - California Radiology Compliance Intelligence</p>
  </div>
</body>
</html>`;
  } else {
    // Multiple alerts digest
    const criticalCount = alerts.filter(a => a.priority === 'CRITICAL').length;
    const highCount = alerts.filter(a => a.priority === 'HIGH').length;
    
    let alertsHtml = '';
    alerts.forEach(alert => {
      alertsHtml += `
      <div class="alert priority-${alert.priority.toLowerCase()}">
        <h3>${alert.title}</h3>
        <p><strong>Priority:</strong> ${alert.priority} | <strong>Source:</strong> ${alert.source}</p>
        ${alert.summary ? `<p>${alert.summary}</p>` : ''}
      </div>`;
    });
    
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
    .alert { border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; background-color: #fef2f2; }
    .priority-critical { border-left-color: #dc2626; background-color: #fef2f2; }
    .priority-high { border-left-color: #f59e0b; background-color: #fffbeb; }
    .priority-medium { border-left-color: #3b82f6; background-color: #eff6ff; }
    .priority-low { border-left-color: #10b981; background-color: #f0fdf4; }
    .summary { padding: 15px; background-color: #f9fafb; margin: 20px 0; }
    .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>RadIntel CA Alert Digest</h1>
    <p>California Radiology Compliance Intelligence</p>
  </div>
  
  <div class="summary">
    <h2>Alert Summary</h2>
    <p><strong>Total Alerts:</strong> ${alerts.length}</p>
    ${criticalCount > 0 ? `<p><strong>Critical:</strong> ${criticalCount}</p>` : ''}
    ${highCount > 0 ? `<p><strong>High Priority:</strong> ${highCount}</p>` : ''}
    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
  </div>
  
  ${alertsHtml}
  
  <div class="footer">
    <p>This is an automated digest from RadIntel CA. Please review and acknowledge alerts in your dashboard.</p>
    <p>© 2025 RadIntel CA - California Radiology Compliance Intelligence</p>
  </div>
</body>
</html>`;
  }
}

function generateSMSBody(alert: Alert): string {
  const priorityEmoji = {
    'CRITICAL': '🚨',
    'HIGH': '⚠️',
    'MEDIUM': 'ℹ️',
    'LOW': '📋'
  };
  
  const emoji = priorityEmoji[alert.priority as keyof typeof priorityEmoji] || '📋';
  
  let smsBody = `${emoji} RadIntel CA URGENT ALERT\n\n`;
  smsBody += `${alert.title}\n\n`;
  
  if (alert.summary && alert.summary.length < 100) {
    smsBody += `${alert.summary}\n\n`;
  }
  
  smsBody += `Priority: ${alert.priority}\n`;
  smsBody += `Source: ${alert.source}\n\n`;
  smsBody += `Check your RadIntel CA dashboard for full details.`;
  
  // SMS messages should be under 160 characters for single segment
  // If longer, it will be sent as multiple segments
  if (smsBody.length > 320) {
    // Truncate if too long
    smsBody = smsBody.substring(0, 300) + '... (see dashboard)';
  }
  
  return smsBody;
}

export async function sendDigestEmail(alerts: Alert[], recipients: string[], period: 'daily' | 'weekly' = 'daily'): Promise<EmailResult> {
  try {
    console.log(`Sending ${period} digest to ${recipients.length} recipients for ${alerts.length} alerts`);
    
    const subject = `RadIntel CA ${period.charAt(0).toUpperCase() + period.slice(1)} Digest - ${alerts.length} Alerts`;
    
    // Group alerts by priority
    const critical = alerts.filter(a => a.priority === 'CRITICAL');
    const high = alerts.filter(a => a.priority === 'HIGH');
    const medium = alerts.filter(a => a.priority === 'MEDIUM');
    const low = alerts.filter(a => a.priority === 'LOW');
    
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
    .summary { padding: 20px; background-color: #f9fafb; }
    .priority-section { margin: 20px 0; }
    .priority-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
    .alert-item { padding: 10px; margin: 5px 0; border-left: 4px solid #ccc; background-color: #fff; }
    .critical { border-left-color: #dc2626; }
    .high { border-left-color: #f59e0b; }
    .medium { border-left-color: #3b82f6; }
    .low { border-left-color: #10b981; }
    .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>RadIntel CA ${period.charAt(0).toUpperCase() + period.slice(1)} Digest</h1>
    <p>California Radiology Compliance Intelligence</p>
  </div>
  
  <div class="summary">
    <h2>Summary</h2>
    <p><strong>Period:</strong> ${period.charAt(0).toUpperCase() + period.slice(1)}</p>
    <p><strong>Total Alerts:</strong> ${alerts.length}</p>
    ${critical.length > 0 ? `<p style="color: #dc2626;"><strong>Critical:</strong> ${critical.length}</p>` : ''}
    ${high.length > 0 ? `<p style="color: #f59e0b;"><strong>High Priority:</strong> ${high.length}</p>` : ''}
    ${medium.length > 0 ? `<p style="color: #3b82f6;"><strong>Medium Priority:</strong> ${medium.length}</p>` : ''}
    ${low.length > 0 ? `<p style="color: #10b981;"><strong>Low Priority:</strong> ${low.length}</p>` : ''}
  </div>
  
  ${critical.length > 0 ? `
  <div class="priority-section">
    <div class="priority-title" style="color: #dc2626;">🚨 Critical Alerts</div>
    ${critical.map(alert => `
    <div class="alert-item critical">
      <strong>${alert.title}</strong><br>
      <small>${alert.source} - ${new Date(alert.createdAt).toLocaleDateString()}</small>
    </div>`).join('')}
  </div>` : ''}
  
  ${high.length > 0 ? `
  <div class="priority-section">
    <div class="priority-title" style="color: #f59e0b;">⚠️ High Priority Alerts</div>
    ${high.slice(0, 5).map(alert => `
    <div class="alert-item high">
      <strong>${alert.title}</strong><br>
      <small>${alert.source} - ${new Date(alert.createdAt).toLocaleDateString()}</small>
    </div>`).join('')}
    ${high.length > 5 ? `<p><em>... and ${high.length - 5} more high priority alerts</em></p>` : ''}
  </div>` : ''}
  
  <div class="footer">
    <p>This is an automated ${period} digest from RadIntel CA.</p>
    <p>Visit your dashboard to review all alerts and take action.</p>
    <p>© 2025 RadIntel CA - California Radiology Compliance Intelligence</p>
  </div>
</body>
</html>`;
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      success: true,
      messageId: `digest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
  } catch (error) {
    console.error('Digest email sending failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown digest email error'
    };
  }
}