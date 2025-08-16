export interface SMSOptions {
  to: string;
  text: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SMSResultWithPhone extends SMSResult {
  phone: string;
}

export interface AlertForSMS {
  id: string;
  title: string;
}

export async function sendSMS({ to, text }: SMSOptions): Promise<SMSResult> {
  const accountSid = process.env.TWILIO_SID || process.env.VITE_TWILIO_SID;
  const authToken = process.env.TWILIO_TOKEN || process.env.VITE_TWILIO_TOKEN;
  const fromNumber = process.env.TWILIO_FROM || process.env.VITE_TWILIO_FROM;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio credentials not configured, skipping SMS send');
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: to,
        Body: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Twilio API error: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('SMS sending error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendUrgentSMS(alert: AlertForSMS, phoneNumbers: string[]): Promise<SMSResultWithPhone[]> {
  if (!phoneNumbers.length) {
    return { success: false, error: 'No phone numbers provided' };
  }

  const text = `🚨 URGENT RadIntel Alert: ${alert.title.substring(0, 100)}${alert.title.length > 100 ? '...' : ''}\n\nView details: ${process.env.REPLIT_DEV_DOMAIN || 'your-domain.com'}/dashboard`;

  const results = [];
  for (const phone of phoneNumbers) {
    const result = await sendSMS({ to: phone, text });
    results.push({ phone, ...result });
  }

  return results;
}
