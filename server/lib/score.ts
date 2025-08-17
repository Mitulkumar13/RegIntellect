// Deterministic scoring system for regulatory events

export interface ScoringFactors {
  sourceReliability: number; // 0-30 points
  deviceRelevance: number; // 0-25 points
  riskLevel: number; // 0-25 points
  californiaRelevance: number; // 0-10 points
  financialImpact: number; // 0-10 points
}

export function scoreEvent(event: any): { score: number; factors: ScoringFactors } {
  let sourceReliability = 0;
  let deviceRelevance = 0;
  let riskLevel = 0;
  let californiaRelevance = 0;
  let financialImpact = 0;

  // Source reliability scoring (0-30 points)
  switch (event.source?.toLowerCase()) {
    case 'openfda':
    case 'fda':
      sourceReliability = 30; // Highest reliability
      break;
    case 'cms':
      sourceReliability = 28;
      break;
    case 'fedreg':
      sourceReliability = 25;
      break;
    case 'cdph':
    case 'rhb':
      sourceReliability = 22;
      break;
    case 'mbc':
      sourceReliability = 20;
      break;
    default:
      sourceReliability = 15;
  }

  // Device relevance scoring (0-25 points)
  const deviceKeywords = [
    'ct', 'mri', 'x-ray', 'ultrasound', 'mammograph', 'fluoroscop',
    'radiograph', 'imaging', 'scanner', 'contrast', 'nuclear medicine',
    'pet', 'spect', 'angiograph', 'interventional'
  ];
  
  const description = (event.product_description || event.device_name || event.title || '').toLowerCase();
  const matchedKeywords = deviceKeywords.filter(keyword => description.includes(keyword));
  
  if (matchedKeywords.length >= 3) deviceRelevance = 25;
  else if (matchedKeywords.length >= 2) deviceRelevance = 20;
  else if (matchedKeywords.length >= 1) deviceRelevance = 15;
  else if (description.includes('medical') || description.includes('hospital')) deviceRelevance = 8;
  else deviceRelevance = 0;

  // Risk level scoring (0-25 points)
  const riskIndicators = (event.classification || event.reason_for_recall || event.reason || '').toLowerCase();
  
  if (riskIndicators.includes('class i') || riskIndicators.includes('death') || riskIndicators.includes('serious injury')) {
    riskLevel = 25;
  } else if (riskIndicators.includes('class ii') || riskIndicators.includes('injury') || riskIndicators.includes('malfunction')) {
    riskLevel = 18;
  } else if (riskIndicators.includes('class iii') || riskIndicators.includes('labeling')) {
    riskLevel = 10;
  } else if (riskIndicators.includes('recall') || riskIndicators.includes('safety')) {
    riskLevel = 12;
  } else {
    riskLevel = 5;
  }

  // California relevance (0-10 points)
  const location = (event.state || event.distribution_pattern || '').toLowerCase();
  if (location.includes('ca') || location.includes('california')) {
    californiaRelevance = 10;
  } else if (location.includes('nationwide') || location.includes('us')) {
    californiaRelevance = 8;
  } else if (location.includes('west') || location.includes('pacific')) {
    californiaRelevance = 6;
  } else {
    californiaRelevance = 3;
  }

  // Financial impact (0-10 points)
  const hasCptImpact = event.cpt_codes && event.cpt_codes.length > 0;
  const hasPaymentChange = event.delta && (event.delta.old || event.delta.new);
  
  if (hasPaymentChange) {
    const changePercent = Math.abs(((event.delta.new - event.delta.old) / event.delta.old) * 100);
    if (changePercent >= 10) financialImpact = 10;
    else if (changePercent >= 5) financialImpact = 7;
    else financialImpact = 4;
  } else if (hasCptImpact) {
    financialImpact = 6;
  } else {
    financialImpact = 2;
  }

  const totalScore = sourceReliability + deviceRelevance + riskLevel + californiaRelevance + financialImpact;

  return {
    score: totalScore,
    factors: {
      sourceReliability,
      deviceRelevance,
      riskLevel,
      californiaRelevance,
      financialImpact
    }
  };
}

export function categorizeByScore(score: number): string {
  if (score >= 85) return 'Urgent';
  if (score >= 75) return 'Informational';
  if (score >= 50) return 'Digest';
  return 'Suppressed';
}

export function shouldSummarize(score: number): boolean {
  return score >= 75; // Only summarize Urgent and Informational alerts
}

export function getPriorityLevel(score: number): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  if (score >= 90) return 'CRITICAL';
  if (score >= 75) return 'HIGH';
  if (score >= 60) return 'MEDIUM';
  return 'LOW';
}