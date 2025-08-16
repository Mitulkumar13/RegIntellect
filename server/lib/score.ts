export interface ScoringResult {
  score: number;
  reasons: string[];
}

export interface EventForScoring {
  sources: string[];
  flags?: {
    manufacturer_notice?: boolean;
    maude_signal?: boolean;
  };
  match?: {
    exact_model?: boolean;
    fuzzy_model?: boolean;
  };
  delta?: {
    old: number;
    new: number;
  } | null;
}

export function scoreEvent(event: EventForScoring): ScoringResult {
  let score = 0;
  const reasons: string[] = [];

  // Source-based scoring
  if (event.sources.includes('openfda:enforcement')) {
    score += 60;
    reasons.push('FDA enforcement action');
  }

  if (event.sources.includes('cms:pfs_change')) {
    score += 70;
    reasons.push('Official CMS payment change');
  }

  // Flag-based scoring
  if (event.flags?.manufacturer_notice) {
    score += 20;
    reasons.push('Manufacturer notice present');
  }

  if (event.flags?.maude_signal) {
    score += 10;
    reasons.push('MAUDE signal detected');
  }

  // Match-based scoring
  if (event.match?.exact_model) {
    score += 20;
    reasons.push('Exact device model match');
  }

  if (event.match?.fuzzy_model) {
    score += 10;
    reasons.push('Fuzzy device model match');
  }

  // Financial impact boost
  if (event.delta && Math.abs(event.delta.new - event.delta.old) > 50) {
    score += 15;
    reasons.push('Significant financial impact');
  }

  return { score, reasons };
}

export function categorizeByScore(score: number): string {
  if (score >= 85) return 'Urgent';
  if (score >= 75) return 'Informational';
  if (score >= 50) return 'Digest';
  return 'Suppressed';
}

export function shouldSummarize(category: string): boolean {
  return category === 'Urgent' || category === 'Informational';
}
