export interface EventToSummarize {
  id: string;
  title: string;
  source: string;
  device_name?: string | null;
  manufacturer?: string | null;
  reason?: string | null;
  classification?: string | null;
}

export interface SummaryResult {
  eventId: string;
  summary: string;
}

export async function summarizeEvent(event: EventToSummarize): Promise<string> {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY || process.env.VITE_PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are an expert medical regulatory analyst. Create clear, actionable 1-2 sentence summaries for radiology clinic staff. Focus on immediate impact and required actions. Be precise and clinic-ready.'
          },
          {
            role: 'user',
            content: `Summarize this regulatory event for a radiology clinic:

Title: ${event.title}
Source: ${event.source}
Device: ${event.device_name || 'N/A'}
Manufacturer: ${event.manufacturer || 'N/A'}
Reason: ${event.reason || 'N/A'}
Classification: ${event.classification || 'N/A'}

Create a clinic-ready alert in 1-2 sentences that explains the impact and any required actions.`
          }
        ],
        temperature: 0.2,
        max_tokens: 150,
        return_related_questions: false,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Summary unavailable';
  } catch (error) {
    console.error('Perplexity summarization error:', error);
    return `${event.title.substring(0, 100)}${event.title.length > 100 ? '...' : ''}`;
  }
}

export async function batchSummarize(events: EventToSummarize[]): Promise<SummaryResult[]> {
  const summaries = [];
  
  for (const event of events) {
    try {
      const summary = await summarizeEvent(event);
      summaries.push({ eventId: event.id, summary });
      
      // Rate limiting - wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to summarize event ${event.id}:`, error);
      summaries.push({ 
        eventId: event.id, 
        summary: `${event.title.substring(0, 100)}${event.title.length > 100 ? '...' : ''}` 
      });
    }
  }
  
  return summaries;
}
