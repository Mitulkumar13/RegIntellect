// Deterministic scoring system for RadIntel alerts

export interface ScoringFactors {
  source: string;
  hasRecall?: boolean;
  hasMaudeSignal?: boolean;
  hasSpike?: boolean;
  zScore?: number;
  cptDeltaPercent?: number;
  isExactDeviceMatch?: boolean;
  isDrugDependency?: boolean;
  vendorAdvisory?: boolean;
}

export interface ScoredEvent {
  baseScore: number;
  adjustedScore: number;
  category: 'Urgent' | 'Informational' | 'Digest' | 'Important' | 'Suppressed';
  confidence: 'High' | 'Medium' | 'Low';
  factors: string[];
}

// Base confidence scores by source
const SOURCE_SCORES: Record<string, number> = {
  'fda-device-recall': 60,
  'fda-drug-recall': 60,
  'fda-drug-shortage': 60,
  'ashp-shortage': 50,
  'cms-pfs': 70,
  'federal-register': 65,
  'cdph': 60,
  'rhb': 60,
  'mbc': 55,
  'vendor-advisory': 55,
  'payer-bulletin': 50,
};

// Calculate z-score for spike detection
export function calculateZScore(
  currentCount: number,
  historicalMean: number,
  historicalStdDev: number
): number {
  if (historicalStdDev === 0) return 0;
  return (currentCount - historicalMean) / historicalStdDev;
}

// Main scoring function
export function scoreEvent(factors: ScoringFactors): ScoredEvent {
  let baseScore = SOURCE_SCORES[factors.source] || 50;
  let adjustedScore = baseScore;
  const scoringFactors: string[] = [`Source: ${factors.source} (${baseScore})`];
  
  // MAUDE support signal (+10)
  if (factors.hasMaudeSignal) {
    adjustedScore += 10;
    scoringFactors.push('MAUDE signal (+10)');
  }
  
  // Spike detection with recall escalation
  if (factors.zScore && factors.zScore >= 2.0) {
    scoringFactors.push(`Z-score spike: ${factors.zScore.toFixed(2)}`);
    if (factors.hasRecall) {
      adjustedScore += 15; // Escalate if spike + recall
      scoringFactors.push('Spike + recall escalation (+15)');
    }
  }
  
  // CPT routing thresholds
  if (factors.cptDeltaPercent !== undefined) {
    const absDelta = Math.abs(factors.cptDeltaPercent);
    if (absDelta >= 10) {
      adjustedScore += 20;
      scoringFactors.push(`CPT Δ${factors.cptDeltaPercent.toFixed(1)}% (+20)`);
    } else if (absDelta >= 5) {
      adjustedScore += 10;
      scoringFactors.push(`CPT Δ${factors.cptDeltaPercent.toFixed(1)}% (+10)`);
    }
  }
  
  // Personalization bumps
  if (factors.isExactDeviceMatch) {
    adjustedScore += 15;
    scoringFactors.push('Exact device match (+15)');
  }
  
  if (factors.isDrugDependency) {
    adjustedScore += 15;
    scoringFactors.push('Drug dependency match (+15)');
  }
  
  // Vendor advisory handling
  if (factors.vendorAdvisory) {
    // Vendor advisories are always "Important" regardless of score
    return {
      baseScore,
      adjustedScore,
      category: 'Important',
      confidence: getConfidence(adjustedScore),
      factors: scoringFactors
    };
  }
  
  // Determine category based on adjusted score
  let category: ScoredEvent['category'];
  if (adjustedScore >= 85) {
    category = 'Urgent';
  } else if (adjustedScore >= 75) {
    category = 'Informational';
  } else if (adjustedScore >= 50) {
    category = 'Digest';
  } else {
    category = 'Suppressed';
  }
  
  // Special case: ASHP-only shortage upgraded if FDA corroborates
  if (factors.source === 'ashp-shortage' && factors.hasRecall) {
    adjustedScore = 60; // Upgrade to High confidence
    scoringFactors.push('FDA corroboration upgrade');
  }
  
  return {
    baseScore,
    adjustedScore,
    category,
    confidence: getConfidence(adjustedScore),
    factors: scoringFactors
  };
}

// Determine confidence level
function getConfidence(score: number): 'High' | 'Medium' | 'Low' {
  if (score >= 60) return 'High';
  if (score >= 50) return 'Medium';
  return 'Low';
}

// Category ranking for sorting
export function getCategoryRank(category: string): number {
  const ranks: Record<string, number> = {
    'Urgent': 1,
    'Informational': 2,
    'Digest': 3,
    'Important': 4,
    'Suppressed': 5
  };
  return ranks[category] || 999;
}

// Check if event should be summarized
export function shouldSummarize(category: string): boolean {
  return category === 'Urgent' || category === 'Informational';
}

// Generate event signature for deduplication
export function generateEventSignature(
  manufacturer: string,
  model: string,
  classification: string,
  reason: string
): string {
  const normalized = [
    manufacturer.toLowerCase().trim(),
    model.toLowerCase().trim(),
    classification.toLowerCase().trim(),
    reason.toLowerCase().replace(/\W+/g, ' ').trim().split(' ').slice(0, 5).join(' ')
  ].join('|');
  
  return Buffer.from(normalized).toString('base64');
}

// Check if duplicate within time window (14 days)
export function isDuplicate(
  signature: string,
  existingSignatures: Map<string, Date>,
  windowDays: number = 14
): boolean {
  const existing = existingSignatures.get(signature);
  if (!existing) return false;
  
  const daysSince = (Date.now() - existing.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince <= windowDays;
}