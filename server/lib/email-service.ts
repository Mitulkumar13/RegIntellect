// Email service using Brevo (formerly SendinBlue)

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  tags?: string[];
}

interface BrevoEmailPayload {
  sender: { name: string; email: string };
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  tags?: string[];
}

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const FROM_EMAIL = 'alerts@radintel.com';
const FROM_NAME = 'RadIntel CA';

// Email footer disclaimer
const EMAIL_FOOTER = `
<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666;">
  <p>This content is informational and does not constitute medical, legal, or financial advice.</p>
  <p>© 2025 RadIntel CA - Regulatory & operational intelligence for radiology</p>
  <p><a href="https://radintel.com/unsubscribe" style="color: #666;">Unsubscribe</a> | 
     <a href="https://radintel.com/preferences" style="color: #666;">Update Preferences</a></p>
</div>
`;

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.error('BREVO_API_KEY not configured');
    return false;
  }

  try {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    
    const payload: BrevoEmailPayload = {
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: recipients.map(email => ({ email })),
      subject: options.subject,
      htmlContent: options.html + EMAIL_FOOTER,
      textContent: options.text,
      tags: options.tags
    };

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Brevo API error:', error);
      return false;
    }

    console.log(`Email sent successfully to ${recipients.join(', ')}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// Send urgent alert email
export async function sendUrgentAlert(
  to: string,
  event: any
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">⚠️ Urgent Alert</h1>
      </div>
      <div style="padding: 20px; background: #fff; border: 1px solid #e5e5e5; border-top: none;">
        <h2 style="color: #333; margin-top: 0;">${event.title}</h2>
        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #991b1b;">${event.summary || event.description}</p>
        </div>
        
        <div style="margin: 20px 0;">
          <p><strong>Source:</strong> ${event.source}</p>
          <p><strong>Category:</strong> ${event.category}</p>
          <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
          ${event.manufacturer ? `<p><strong>Manufacturer:</strong> ${event.manufacturer}</p>` : ''}
          ${event.model ? `<p><strong>Model:</strong> ${event.model}</p>` : ''}
        </div>
        
        ${event.link ? `
        <div style="margin-top: 30px;">
          <a href="${event.link}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Full Details
          </a>
        </div>
        ` : ''}
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `[URGENT] ${event.title} - RadIntel Alert`,
    html,
    tags: ['urgent', event.source]
  });
}

// Send informational alert email
export async function sendInformationalAlert(
  to: string,
  event: any
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">ℹ️ Informational Alert</h1>
      </div>
      <div style="padding: 20px; background: #fff; border: 1px solid #e5e5e5; border-top: none;">
        <h2 style="color: #333; margin-top: 0;">${event.title}</h2>
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #1e40af;">${event.summary || event.description}</p>
        </div>
        
        <div style="margin: 20px 0;">
          <p><strong>Source:</strong> ${event.source}</p>
          <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
        </div>
        
        ${event.link ? `
        <div style="margin-top: 30px;">
          <a href="${event.link}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Learn More
          </a>
        </div>
        ` : ''}
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `[INFO] ${event.title} - RadIntel Alert`,
    html,
    tags: ['informational', event.source]
  });
}

// Send daily digest email
export async function sendDailyDigest(
  to: string,
  events: any[],
  summary?: string
): Promise<boolean> {
  const eventsByCategory = events.reduce((acc, event) => {
    if (!acc[event.category]) acc[event.category] = [];
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, any[]>);

  let eventsHtml = '';
  
  for (const [category, categoryEvents] of Object.entries(eventsByCategory)) {
    eventsHtml += `
      <h3 style="color: #333; margin-top: 30px; border-bottom: 2px solid #e5e5e5; padding-bottom: 10px;">
        ${category} (${categoryEvents.length})
      </h3>
    `;
    
    for (const event of categoryEvents) {
      eventsHtml += `
        <div style="margin: 15px 0; padding: 15px; background: #f9fafb; border-radius: 6px;">
          <h4 style="margin: 0 0 10px 0; color: #333;">${event.title}</h4>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">${event.description}</p>
          <div style="margin-top: 10px; font-size: 12px; color: #999;">
            <span>Source: ${event.source}</span> | 
            <span>Date: ${new Date(event.date).toLocaleDateString()}</span>
            ${event.link ? ` | <a href="${event.link}" style="color: #3b82f6;">View Details</a>` : ''}
          </div>
        </div>
      `;
    }
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Daily Regulatory Digest</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <div style="padding: 20px; background: #fff; border: 1px solid #e5e5e5; border-top: none;">
        ${summary ? `
        <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin-bottom: 30px;">
          <h2 style="margin: 0 0 10px 0; color: #333; font-size: 18px;">AI Summary</h2>
          <p style="margin: 0; color: #666; line-height: 1.6;">${summary}</p>
        </div>
        ` : ''}
        
        <div style="margin-bottom: 20px; padding: 15px; background: #fef3c7; border-radius: 6px;">
          <p style="margin: 0; color: #92400e;">
            <strong>📊 Today's Overview:</strong> ${events.length} total updates across all categories
          </p>
        </div>
        
        ${eventsHtml}
        
        <div style="margin-top: 40px; text-align: center;">
          <a href="https://radintel.com/dashboard" style="background: #6366f1; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Full Dashboard
          </a>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Daily Digest - ${events.length} Updates - RadIntel`,
    html,
    tags: ['digest', 'daily']
  });
}

// Send weekly newsletter
export async function sendWeeklyNewsletter(
  to: string,
  content: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #06b6d4 0%, #6366f1 100%); color: white; padding: 40px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 32px;">Weekly Regulatory Review</h1>
        <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 18px;">Your RadIntel Weekly Newsletter</p>
      </div>
      <div style="padding: 30px; background: #fff; border: 1px solid #e5e5e5; border-top: none;">
        <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">
          ${content}
        </div>
        
        <div style="margin-top: 40px; text-align: center;">
          <a href="https://radintel.com/dashboard" style="background: #6366f1; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Visit Dashboard
          </a>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Weekly Review - RadIntel Regulatory Intelligence`,
    html,
    tags: ['newsletter', 'weekly']
  });
}