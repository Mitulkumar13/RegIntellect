// Google Gemini AI integration for data normalization and pattern detection

export interface NormalizedData {
  title: string;
  source: string;
  classification?: string;
  device_name?: string;
  manufacturer?: string;
  model?: string;
  reason_for_recall?: string;
  distribution_pattern?: string;
  state?: string;
  cpt_codes?: string[];
  modality_type?: string;
  normalized: boolean;
}

export async function normalizeData(rawData: any[]): Promise<NormalizedData[]> {
  try {
    // Mock implementation for MVP - replace with actual Gemini API call
    console.log(`Normalizing ${rawData.length} data items with Gemini AI`);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return rawData.map((item, index) => ({
      title: item.title || item.product_description || `Event ${index + 1}`,
      source: item.source || 'Unknown',
      classification: item.classification || extractClassification(item),
      device_name: item.device_name || item.product_description || extractDeviceName(item),
      manufacturer: item.manufacturer || item.recalling_firm || extractManufacturer(item),
      model: item.model || extractModel(item),
      reason_for_recall: item.reason_for_recall || item.reason || extractReason(item),
      distribution_pattern: item.distribution_pattern || extractDistribution(item),
      state: item.state || extractState(item),
      cpt_codes: extractCptCodes(item),
      modality_type: classifyModalityType(item.device_name || item.product_description || ''),
      normalized: true
    }));
  } catch (error) {
    console.error('Gemini AI normalization failed:', error);
    // Fallback to basic normalization
    return rawData.map((item, index) => ({
      title: item.title || item.product_description || `Event ${index + 1}`,
      source: item.source || 'Unknown',
      normalized: false
    }));
  }
}

export async function detectPatterns(events: any[]): Promise<{ patterns: string[], insights: string[] }> {
  try {
    console.log(`Detecting patterns in ${events.length} events with Gemini AI`);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock pattern detection - replace with actual Gemini API call
    const patterns = [];
    const insights = [];
    
    // Detect manufacturer patterns
    const manufacturers = events.map(e => e.manufacturer).filter(Boolean);
    const manufacturerCounts = manufacturers.reduce((acc, mfg) => {
      acc[mfg] = (acc[mfg] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(manufacturerCounts).forEach(([mfg, count]) => {
      if (count >= 3) {
        patterns.push(`Multiple recalls from ${mfg}`);
        insights.push(`${mfg} has ${count} recent recalls - consider enhanced monitoring`);
      }
    });
    
    // Detect modality patterns
    const modalities = events.map(e => e.modality_type).filter(Boolean);
    const modalityCounts = modalities.reduce((acc, mod) => {
      acc[mod] = (acc[mod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(modalityCounts).forEach(([mod, count]) => {
      if (count >= 2) {
        patterns.push(`${mod} device issues trending`);
        insights.push(`${count} ${mod} related events - review ${mod} equipment protocols`);
      }
    });
    
    return { patterns, insights };
  } catch (error) {
    console.error('Gemini AI pattern detection failed:', error);
    return { patterns: [], insights: [] };
  }
}

// Helper functions for data extraction
function extractClassification(item: any): string | undefined {
  const text = JSON.stringify(item).toLowerCase();
  if (text.includes('class i')) return 'Class I';
  if (text.includes('class ii')) return 'Class II';
  if (text.includes('class iii')) return 'Class III';
  return undefined;
}

function extractDeviceName(item: any): string | undefined {
  return item.product_description || item.device_name || undefined;
}

function extractManufacturer(item: any): string | undefined {
  return item.recalling_firm || item.manufacturer || undefined;
}

function extractModel(item: any): string | undefined {
  return item.model || undefined;
}

function extractReason(item: any): string | undefined {
  return item.reason_for_recall || item.reason || undefined;
}

function extractDistribution(item: any): string | undefined {
  return item.distribution_pattern || undefined;
}

function extractState(item: any): string | undefined {
  return item.state || undefined;
}

function extractCptCodes(item: any): string[] {
  // Look for CPT code patterns in text
  const text = JSON.stringify(item);
  const cptPattern = /\b\d{5}\b/g;
  const matches = text.match(cptPattern) || [];
  return matches.filter(code => parseInt(code) >= 70000 && parseInt(code) <= 79999); // Radiology range
}

function classifyModalityType(description: string): string | undefined {
  if (!description) return undefined;
  
  const desc = description.toLowerCase();
  if (desc.includes('ct') || desc.includes('computed tomography')) return 'CT';
  if (desc.includes('mri') || desc.includes('magnetic resonance')) return 'MRI';
  if (desc.includes('x-ray') || desc.includes('radiograph')) return 'X-Ray';
  if (desc.includes('ultrasound') || desc.includes('sonograph')) return 'Ultrasound';
  if (desc.includes('mammograph') || desc.includes('mammogram')) return 'Mammography';
  if (desc.includes('fluoroscop')) return 'Fluoroscopy';
  if (desc.includes('nuclear') || desc.includes('pet') || desc.includes('spect')) return 'Nuclear Medicine';
  if (desc.includes('angiograph')) return 'Angiography';
  
  return 'Other Imaging';
}