// AI integration services for RadIntel

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini (for normalization)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Initialize Perplexity configuration
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || '';

// Daily usage tracking
let dailyUsage = {
  date: new Date().toDateString(),
  summaries: 0,
  maxSummaries: 6,
  digestBatch: false,
  newsletterBatch: false
};

function resetDailyUsage() {
  const today = new Date().toDateString();
  if (dailyUsage.date !== today) {
    dailyUsage = {
      date: today,
      summaries: 0,
      maxSummaries: 6,
      digestBatch: false,
      newsletterBatch: false
    };
  }
}

// Gemini normalization (fallback only)
export async function normalizeWithGemini(data: any): Promise<any> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
    Normalize the following regulatory data into a consistent JSON structure.
    Extract: title, description, date, source, manufacturer, model, classification, reason, link
    Return ONLY valid JSON, no explanations.
    
    Data: ${JSON.stringify(data)}
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return null;
  } catch (error) {
    console.error('Gemini normalization error:', error);
    return null;
  }
}

// Perplexity summarization
export async function summarizeWithPerplexity(
  content: string,
  category: string
): Promise<string | null> {
  resetDailyUsage();
  
  // Check daily cap
  if (dailyUsage.summaries >= dailyUsage.maxSummaries) {
    console.log('Daily summary cap reached');
    return null;
  }
  
  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a medical regulatory expert. Provide concise, actionable summaries for radiology clinic staff. Focus on operational impact and required actions. Maximum 2 sentences.'
          },
          {
            role: 'user',
            content: `Summarize this ${category} alert for radiology clinic operations:\n\n${content}`
          }
        ],
        temperature: 0.2,
        max_tokens: 100,
        stream: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }
    
    const data = await response.json();
    dailyUsage.summaries++;
    
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error('Perplexity summarization error:', error);
    return null;
  }
}

// Batch summarization for Digest
export async function batchSummarizeDigest(events: any[]): Promise<string | null> {
  resetDailyUsage();
  
  if (dailyUsage.digestBatch) {
    console.log('Daily digest batch already used');
    return null;
  }
  
  try {
    const eventList = events.map(e => 
      `- ${e.title} (${e.source}): ${e.description}`
    ).join('\n');
    
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'Create a concise daily digest summary for radiology clinic staff. Group by importance and provide actionable insights.'
          },
          {
            role: 'user',
            content: `Create a daily digest from these regulatory updates:\n\n${eventList}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
        stream: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }
    
    const data = await response.json();
    dailyUsage.digestBatch = true;
    
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error('Digest batch summarization error:', error);
    return null;
  }
}

// Batch summarization for Newsletter
export async function batchSummarizeNewsletter(
  events: any[],
  deadlines: any[],
  cptChanges: any[]
): Promise<string | null> {
  resetDailyUsage();
  
  if (dailyUsage.newsletterBatch) {
    console.log('Daily newsletter batch already used');
    return null;
  }
  
  try {
    const content = `
    Top Events (Last 7 Days):
    ${events.map(e => `- ${e.title}: ${e.description}`).join('\n')}
    
    Upcoming Deadlines (30 Days):
    ${deadlines.map(d => `- ${d.dueDate}: ${d.action} (${d.source})`).join('\n')}
    
    CPT Payment Changes:
    ${cptChanges.map(c => `- ${c.code}: ${c.deltaPercent}% change`).join('\n')}
    `;
    
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'Create an engaging weekly newsletter for radiology clinic administrators. Highlight key changes, upcoming deadlines, and financial impacts.'
          },
          {
            role: 'user',
            content: `Create a weekly newsletter from this data:\n\n${content}`
          }
        ],
        temperature: 0.4,
        max_tokens: 800,
        stream: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }
    
    const data = await response.json();
    dailyUsage.newsletterBatch = true;
    
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error('Newsletter batch summarization error:', error);
    return null;
  }
}

// Get AI usage status
export function getAIUsageStatus() {
  resetDailyUsage();
  return {
    date: dailyUsage.date,
    summariesUsed: dailyUsage.summaries,
    summariesMax: dailyUsage.maxSummaries,
    digestUsed: dailyUsage.digestBatch,
    newsletterUsed: dailyUsage.newsletterBatch,
    remaining: dailyUsage.maxSummaries - dailyUsage.summaries
  };
}

// Check if should use AI summary
export function canUseSummary(): boolean {
  resetDailyUsage();
  return dailyUsage.summaries < dailyUsage.maxSummaries;
}