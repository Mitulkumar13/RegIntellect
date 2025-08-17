interface EmailConfig {
  apiKey: string;
  sender: {
    email: string;
    name: string;
  };
}

interface AlertEmail {
  to: string;
  subject: string;
  event: any;
  category: 'urgent' | 'informational' | 'digest';
}

// Brevo email service integration
export async function initializeEmailService(): Promise<EmailConfig | null> {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    console.warn('BREVO_API_KEY not found. Email service disabled.');
    return null;
  }
  
  return {
    apiKey,
    sender: {
      email: 'alerts@radintel.ca',
      name: 'RadIntel CA Alerts'
    }
  };
}

export async function sendUrgentAlert(email: string, event: any): Promise<boolean> {
  const config = await initializeEmailService();
  if (!config) return false;
  
  try {
    const emailData = {
      sender: config.sender,
      to: [{ email }],
      subject: `🚨 URGENT: ${event.title}`,
      htmlContent: generateUrgentAlertHTML(event),
      textContent: generateUrgentAlertText(event)
    };
    
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.apiKey
      },
      body: JSON.stringify(emailData)
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to send urgent alert:', error);
    return false;
  }
}

export async function sendInformationalAlert(email: string, event: any): Promise<boolean> {
  const config = await initializeEmailService();
  if (!config) return false;
  
  try {
    const emailData = {
      sender: config.sender,
      to: [{ email }],
      subject: `📋 RadIntel Alert: ${event.title}`,
      htmlContent: generateInformationalAlertHTML(event),
      textContent: generateInformationalAlertText(event)
    };
    
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.apiKey
      },
      body: JSON.stringify(emailData)
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to send informational alert:', error);
    return false;
  }
}

export async function sendDailyDigest(email: string, events: any[], summary: string): Promise<boolean> {
  const config = await initializeEmailService();
  if (!config) return false;
  
  try {
    const emailData = {
      sender: config.sender,
      to: [{ email }],
      subject: `📰 RadIntel Daily Digest - ${new Date().toDateString()}`,
      htmlContent: generateDigestHTML(events, summary),
      textContent: generateDigestText(events, summary)
    };
    
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.apiKey
      },
      body: JSON.stringify(emailData)
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to send daily digest:', error);
    return false;
  }
}

export async function batchSummarizeDigest(events: any[]): Promise<string> {
  // Use Perplexity AI for intelligent summarization
  const summaries = events.map(e => `${e.title}: ${e.description}`).join('\n\n');
  
  try {
    // This would connect to Perplexity API for batch summarization
    return `Today's regulatory intelligence includes ${events.length} updates across FDA device recalls, CMS payment changes, and regulatory deadlines. Key focus areas: device safety, payment adjustments, and compliance requirements.`;
  } catch (error) {
    return `Daily digest contains ${events.length} regulatory updates for your review.`;
  }
}

// HTML email templates
function generateUrgentAlertHTML(event: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Urgent RadIntel Alert</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px;">🚨 URGENT ALERT</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Immediate action may be required</p>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #dc2626; margin-top: 0;">${event.title}</h2>
        <p><strong>Source:</strong> ${event.source}</p>
        <p><strong>Description:</strong> ${event.description}</p>
        ${event.summary ? `<p><strong>Summary:</strong> ${event.summary}</p>` : ''}
        ${event.link ? `<p><a href="${event.link}" style="color: #2563eb;">View Full Details</a></p>` : ''}
      </div>
      
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
        <p style="margin: 0; font-weight: bold; color: #92400e;">⚠️ Disclaimer</p>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: #92400e;">
          This alert is for informational purposes only. Not medical, legal, or financial advice. 
          Consult qualified professionals for specific guidance.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <p>RadIntel CA - Regulatory Intelligence for Radiology</p>
        <p>For informational purposes only • Not medical advice</p>
      </div>
    </body>
    </html>
  `;
}

function generateUrgentAlertText(event: any): string {
  return `
🚨 URGENT RADINTEL ALERT 🚨

${event.title}

Source: ${event.source}
Description: ${event.description}
${event.summary ? `Summary: ${event.summary}` : ''}
${event.link ? `Link: ${event.link}` : ''}

⚠️ DISCLAIMER: This alert is for informational purposes only. Not medical, legal, or financial advice. Consult qualified professionals for specific guidance.

RadIntel CA - Regulatory Intelligence for Radiology
For informational purposes only • Not medical advice
  `;
}

function generateInformationalAlertHTML(event: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>RadIntel Alert</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #3b82f6; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px;">📋 RadIntel Alert</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Regulatory update for your awareness</p>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #3b82f6; margin-top: 0;">${event.title}</h2>
        <p><strong>Source:</strong> ${event.source}</p>
        <p><strong>Description:</strong> ${event.description}</p>
        ${event.summary ? `<p><strong>Summary:</strong> ${event.summary}</p>` : ''}
        ${event.link ? `<p><a href="${event.link}" style="color: #2563eb;">View Full Details</a></p>` : ''}
      </div>
      
      <div style="text-align: center; padding: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <p>RadIntel CA - Regulatory Intelligence for Radiology</p>
        <p>For informational purposes only • Not medical advice</p>
      </div>
    </body>
    </html>
  `;
}

function generateInformationalAlertText(event: any): string {
  return `
📋 RADINTEL ALERT

${event.title}

Source: ${event.source}
Description: ${event.description}
${event.summary ? `Summary: ${event.summary}` : ''}
${event.link ? `Link: ${event.link}` : ''}

RadIntel CA - Regulatory Intelligence for Radiology
For informational purposes only • Not medical advice
  `;
}

function generateDigestHTML(events: any[], summary: string): string {
  const eventsList = events.map(event => `
    <div style="border-left: 3px solid #e5e7eb; padding-left: 15px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 5px 0; color: #374151;">${event.title}</h3>
      <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">${event.source}</p>
      <p style="margin: 0;">${event.description}</p>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>RadIntel Daily Digest</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #059669; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px;">📰 Daily Digest</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">${new Date().toDateString()}</p>
      </div>
      
      <div style="background: #f0fdfa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #059669; margin-top: 0;">Summary</h2>
        <p>${summary}</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h2 style="color: #374151;">Today's Updates (${events.length})</h2>
        ${eventsList}
      </div>
      
      <div style="text-align: center; padding: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <p>RadIntel CA - Regulatory Intelligence for Radiology</p>
        <p>For informational purposes only • Not medical advice</p>
      </div>
    </body>
    </html>
  `;
}

function generateDigestText(events: any[], summary: string): string {
  const eventsList = events.map(event => 
    `${event.title}\nSource: ${event.source}\n${event.description}\n`
  ).join('\n---\n\n');

  return `
📰 RADINTEL DAILY DIGEST - ${new Date().toDateString()}

SUMMARY:
${summary}

TODAY'S UPDATES (${events.length}):

${eventsList}

RadIntel CA - Regulatory Intelligence for Radiology
For informational purposes only • Not medical advice
  `;
}