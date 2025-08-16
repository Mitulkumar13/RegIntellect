export interface ScoringResult {
  score: number;
  reasons: string[];
}

export interface EventForScoring {
  sources: string[];
  flags?: {
    manufacturer_notice?: boolean;
    maude_signal?: boolean;
    california_mandate?: boolean;
    radiation_safety?: boolean;
  };
  match?: {
    exact_model?: boolean;
    fuzzy_model?: boolean;
  };
  delta?: {
    old: number;
    new: number;
  } | null;
  modalityType?: string;
  californiaRegion?: string;
  radiologyImpact?: string;
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

  // California state source scoring
  if (event.sources.includes('cdph')) {
    score += 65;
    reasons.push('California Department of Public Health alert');
  }

  if (event.sources.includes('rhb')) {
    score += 70;
    reasons.push('California Radiologic Health Branch requirement');
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

  if (event.flags?.california_mandate) {
    score += 25;
    reasons.push('California state mandate');
  }

  if (event.flags?.radiation_safety) {
    score += 30;
    reasons.push('Radiation safety requirement');
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

  // Radiology modality-specific scoring
  const criticalModalities = ["CT", "MRI", "Nuclear Medicine", "Mammography"];
  if (event.modalityType && criticalModalities.includes(event.modalityType)) {
    score += 15;
    reasons.push(`Critical radiology modality: ${event.modalityType}`);
  }

  // California region boost for major areas
  const majorCaliforniaRegions = ["Bay Area", "Greater LA", "San Diego"];
  if (event.californiaRegion && majorCaliforniaRegions.includes(event.californiaRegion)) {
    score += 5;
    reasons.push(`Major California market: ${event.californiaRegion}`);
  }

  // Financial impact boost
  if (event.delta && Math.abs(event.delta.new - event.delta.old) > 50) {
    score += 15;
    reasons.push('Significant financial impact');
  }

  // Radiology impact scoring
  if (event.radiologyImpact === "High") {
    score += 10;
    reasons.push('High radiology impact');
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
