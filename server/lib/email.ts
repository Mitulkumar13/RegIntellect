export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface AlertForEmail {
  id: string;
  title: string;
  summary: string | null;
  category: string;
  score: number;
  source: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<EmailResult> {
  const apiKey = process.env.EMAIL_API_KEY || process.env.VITE_EMAIL_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || process.env.VITE_EMAIL_FROM || 'alerts@radintel.app';
  
  if (!apiKey) {
    console.warn('EMAIL_API_KEY not configured, skipping email send');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    // Using a generic email service API format
    // This can be adapted for SendGrid, Mailgun, Brevo, etc.
    const response = await fetch('https://api.emailprovider.com/v1/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Email API error: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, messageId: result.id || result.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendAlertEmail(alerts: AlertForEmail[], recipients: string[]): Promise<EmailResult> {
  if (!alerts.length || !recipients.length) {
    return { success: false, error: 'No alerts or recipients provided' };
  }

  const urgentAlerts = alerts.filter(alert => alert.category === 'Urgent');
  const infoAlerts = alerts.filter(alert => alert.category === 'Informational');
  
  const subject = urgentAlerts.length > 0 
    ? `🚨 URGENT: ${urgentAlerts.length} Critical Radiology Alert${urgentAlerts.length > 1 ? 's' : ''}`
    : `📋 Radiology Intelligence Update - ${alerts.length} New Alert${alerts.length > 1 ? 's' : ''}`;

  const html = generateEmailHTML(alerts, urgentAlerts, infoAlerts);
  const text = generateEmailText(alerts, urgentAlerts, infoAlerts);

  return await sendEmail({
    to: recipients,
    subject,
    html,
    text,
  });
}

function generateEmailHTML(alerts: AlertForEmail[], urgentAlerts: AlertForEmail[], infoAlerts: AlertForEmail[]): string {
  const urgentSection = urgentAlerts.length > 0 ? `
    <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 16px 0;">
      <h2 style="color: #dc2626; margin: 0 0 12px 0;">🚨 URGENT ALERTS</h2>
      ${urgentAlerts.map(alert => `
        <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #fecaca;">
          <h3 style="margin: 0; color: #991b1b;">${alert.title}</h3>
          <p style="margin: 4px 0; color: #7f1d1d;">${alert.summary || 'No summary available'}</p>
          <small style="color: #991b1b;">Score: ${alert.score} | Source: ${alert.source}</small>
        </div>
      `).join('')}
    </div>
  ` : '';

  const infoSection = infoAlerts.length > 0 ? `
    <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0;">
      <h2 style="color: #d97706; margin: 0 0 12px 0;">📋 INFORMATIONAL ALERTS</h2>
      ${infoAlerts.map(alert => `
        <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #fed7aa;">
          <h3 style="margin: 0; color: #92400e;">${alert.title}</h3>
          <p style="margin: 4px 0; color: #78350f;">${alert.summary || 'No summary available'}</p>
          <small style="color: #92400e;">Score: ${alert.score} | Source: ${alert.source}</small>
        </div>
      `).join('')}
    </div>
  ` : '';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">RadIntel Alert System</h1>
        <p style="margin: 8px 0 0 0;">Regulatory Intelligence for Radiology</p>
      </div>
      
      ${urgentSection}
      ${infoSection}
      
      <div style="background: #f9fafb; padding: 16px; margin: 16px 0; text-align: center;">
        <p style="margin: 0; color: #6b7280;">
          View full dashboard at <a href="${process.env.REPLIT_DEV_DOMAIN || 'your-domain.com'}/dashboard">RadIntel Dashboard</a>
        </p>
      </div>
    </div>
  `;
}

function generateEmailText(alerts: AlertForEmail[], urgentAlerts: AlertForEmail[], infoAlerts: AlertForEmail[]): string {
  let text = 'RadIntel Alert System - Regulatory Intelligence\n\n';
  
  if (urgentAlerts.length > 0) {
    text += '🚨 URGENT ALERTS\n';
    text += '=================\n\n';
    urgentAlerts.forEach(alert => {
      text += `${alert.title}\n`;
      text += `${alert.summary || 'No summary available'}\n`;
      text += `Score: ${alert.score} | Source: ${alert.source}\n\n`;
    });
  }
  
  if (infoAlerts.length > 0) {
    text += '📋 INFORMATIONAL ALERTS\n';
    text += '========================\n\n';
    infoAlerts.forEach(alert => {
      text += `${alert.title}\n`;
      text += `${alert.summary || 'No summary available'}\n`;
      text += `Score: ${alert.score} | Source: ${alert.source}\n\n`;
    });
  }
  
  text += `View full dashboard: ${process.env.REPLIT_DEV_DOMAIN || 'your-domain.com'}/dashboard\n`;
  
  return text;
}
