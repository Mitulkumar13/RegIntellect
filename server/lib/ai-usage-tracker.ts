// AI Usage Tracking for Rate Limiting
// As specified in build brief: max 6 real-time summaries/day

interface AIUsageStats {
  perplexityCallsToday: number;
  geminiCallsToday: number;
  lastResetDate: string;
  dailyLimit: number;
}

const DAILY_LIMIT = 6; // Max real-time summaries per day
let usageStats: AIUsageStats = {
  perplexityCallsToday: 0,
  geminiCallsToday: 0,
  lastResetDate: new Date().toISOString().split('T')[0],
  dailyLimit: DAILY_LIMIT
};

export function getAIUsageStatus(): AIUsageStats {
  const today = new Date().toISOString().split('T')[0];
  
  // Reset counters if new day
  if (usageStats.lastResetDate !== today) {
    usageStats = {
      perplexityCallsToday: 0,
      geminiCallsToday: 0,
      lastResetDate: today,
      dailyLimit: DAILY_LIMIT
    };
  }
  
  return { ...usageStats };
}

export function incrementPerplexityUsage(): boolean {
  const today = new Date().toISOString().split('T')[0];
  
  // Reset if new day
  if (usageStats.lastResetDate !== today) {
    usageStats = {
      perplexityCallsToday: 0,
      geminiCallsToday: 0,
      lastResetDate: today,
      dailyLimit: DAILY_LIMIT
    };
  }
  
  if (usageStats.perplexityCallsToday >= DAILY_LIMIT) {
    return false; // Rate limit exceeded
  }
  
  usageStats.perplexityCallsToday++;
  return true;
}

export function incrementGeminiUsage(): boolean {
  const today = new Date().toISOString().split('T')[0];
  
  // Reset if new day
  if (usageStats.lastResetDate !== today) {
    usageStats = {
      perplexityCallsToday: 0,
      geminiCallsToday: 0,
      lastResetDate: today,
      dailyLimit: DAILY_LIMIT
    };
  }
  
  usageStats.geminiCallsToday++;
  return true;
}

export function canMakeAISummary(): boolean {
  const status = getAIUsageStatus();
  return status.perplexityCallsToday < status.dailyLimit;
}

export function getRemainingCalls(): number {
  const status = getAIUsageStatus();
  return Math.max(0, status.dailyLimit - status.perplexityCallsToday);
}