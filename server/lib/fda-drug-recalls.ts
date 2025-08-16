import { withRetry } from './retry';

const RADIOLOGY_DRUGS = [
  'contrast', 'gadolinium', 'iodine', 'barium',
  'lidocaine', 'propofol', 'midazolam', 'fentanyl',
  'omnipaque', 'visipaque', 'isovue', 'optiray',
  'gadavist', 'dotarem', 'prohance', 'multihance'
];

export async function fetchFDADrugRecalls() {
  try {
    // Build search query for radiology-relevant drugs
    const searchTerms = RADIOLOGY_DRUGS.map(drug => `product_description:"${drug}"`).join('+OR+');
    
    const response = await withRetry(async () => {
      const fdaResponse = await fetch(
        `https://api.fda.gov/drug/enforcement.json?search=(${searchTerms})&limit=100`
      );
      if (!fdaResponse.ok) {
        throw new Error(`FDA API error: ${fdaResponse.status}`);
      }
      return fdaResponse.json();
    });

    const results = response.results || [];
    
    return results.map((recall: any) => ({
      id: recall.recall_number || Math.random().toString(36),
      type: 'drug_recall',
      title: recall.product_description || 'Unknown Drug Recall',
      reason: recall.reason_for_recall,
      classification: recall.classification,
      status: recall.status,
      distribution: recall.distribution_pattern,
      reportDate: recall.report_date || new Date().toISOString(),
      source: 'FDA Drug Enforcement',
      confidence: 60, // High confidence for FDA
      raw: recall
    }));
  } catch (error) {
    console.error('Error fetching FDA drug recalls:', error);
    return [];
  }
}

export async function fetchFDADrugShortages() {
  try {
    const response = await withRetry(async () => {
      const fdaResponse = await fetch(
        'https://api.fda.gov/drug/shortages.json?limit=100'
      );
      if (!fdaResponse.ok) {
        throw new Error(`FDA API error: ${fdaResponse.status}`);
      }
      return fdaResponse.json();
    });

    const results = response.results || [];
    
    // Filter for radiology-relevant drugs
    const radiologyShortages = results.filter((shortage: any) => {
      const name = (shortage.generic_name || '').toLowerCase();
      return RADIOLOGY_DRUGS.some(drug => name.includes(drug));
    });

    return radiologyShortages.map((shortage: any) => ({
      id: `shortage-${shortage.application_number || Math.random().toString(36)}`,
      type: 'drug_shortage',
      title: shortage.generic_name || 'Unknown Drug Shortage',
      reason: shortage.shortage_reason,
      status: shortage.shortage_status,
      reportDate: shortage.created_date || new Date().toISOString(),
      source: 'FDA Drug Shortages',
      confidence: 60, // High confidence for FDA
      raw: shortage
    }));
  } catch (error) {
    console.error('Error fetching FDA drug shortages:', error);
    return [];
  }
}

export async function fetchASHPShortages() {
  // ASHP doesn't have a public API, so we'd need to scrape or use their RSS feed
  // For MVP, returning empty array but structure is in place
  return [];
}