import { scoreEvent } from './scoring';

export interface CaliforniaAlert {
  id: string;
  title: string;
  description: string;
  source: 'CDPH' | 'RHB';
  date: string;
  link?: string;
  category: string;
  score: number;
  confidence: string;
  region?: string;
  modality?: string[];
}

// California Department of Public Health alerts
export async function fetchCDPHAlerts(): Promise<CaliforniaAlert[]> {
  try {
    // In production, this would connect to CDPH's alert system
    // For MVP, returning structured mock data based on real alert patterns
    const alerts: CaliforniaAlert[] = [
      {
        id: `cdph-${Date.now()}-radiation-safety`,
        title: 'Updated Radiation Safety Requirements for Imaging Facilities',
        description: 'New requirements for radiation safety officer certification and equipment inspection protocols effective January 2025',
        source: 'CDPH',
        date: new Date().toISOString(),
        link: 'https://www.cdph.ca.gov/Programs/CEH/DRSEM/Pages/default.aspx',
        category: 'Informational',
        score: 75,
        confidence: 'High',
        region: 'Statewide',
        modality: ['CT', 'X-Ray', 'Mammography', 'Fluoroscopy']
      }
    ];

    return alerts;
  } catch (error) {
    console.error('Error fetching CDPH alerts:', error);
    return [];
  }
}

// California Radiologic Health Branch alerts
export async function fetchRHBAlerts(): Promise<CaliforniaAlert[]> {
  try {
    // In production, this would connect to RHB's notification system
    // For MVP, returning structured mock data based on real RHB alert patterns
    const alerts: CaliforniaAlert[] = [
      {
        id: `rhb-${Date.now()}-equipment-registration`,
        title: 'X-Ray Equipment Registration Renewal Deadline',
        description: 'Annual registration renewal for diagnostic X-ray equipment due by March 31, 2025. Late fees apply after deadline.',
        source: 'RHB',
        date: new Date().toISOString(),
        link: 'https://www.cdph.ca.gov/Programs/CEH/DRSEM/Pages/RHB.aspx',
        category: 'Urgent',
        score: 85,
        confidence: 'High',
        region: 'Statewide',
        modality: ['X-Ray', 'CT', 'Mammography']
      },
      {
        id: `rhb-${Date.now()}-inspection-notice`,
        title: 'Updated CT Scanner Inspection Requirements',
        description: 'New inspection protocols for CT scanners manufactured after 2018. Updated radiation output measurement standards.',
        source: 'RHB',
        date: new Date().toISOString(),
        link: 'https://www.cdph.ca.gov/Programs/CEH/DRSEM/Pages/RHB.aspx',
        category: 'Informational',
        score: 78,
        confidence: 'High',
        region: 'Statewide',
        modality: ['CT']
      }
    ];

    return alerts;
  } catch (error) {
    console.error('Error fetching RHB alerts:', error);
    return [];
  }
}

// Classify radiology modality from event text
export function classifyRadiologyModality(text: string): string[] {
  const modalities: string[] = [];
  const lowerText = text.toLowerCase();

  const modalityKeywords = {
    'MRI': ['mri', 'magnetic resonance', 'magnet', 'tesla', 'gradient'],
    'CT': ['ct', 'computed tomography', 'scanner', 'contrast', 'helical'],
    'X-Ray': ['x-ray', 'xray', 'radiograph', 'chest', 'bone', 'digital radiography'],
    'Mammography': ['mammography', 'mammo', 'breast', 'tomosynthesis', 'screening'],
    'Ultrasound': ['ultrasound', 'sonography', 'doppler', 'echo', 'transducer'],
    'Nuclear Medicine': ['nuclear', 'pet', 'spect', 'radiopharmaceutical', 'isotope'],
    'Fluoroscopy': ['fluoroscopy', 'fluoro', 'c-arm', 'angiography', 'cardiac cath'],
    'IR': ['interventional', 'angioplasty', 'embolization', 'stent', 'catheter']
  };

  for (const [modality, keywords] of Object.entries(modalityKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      modalities.push(modality);
    }
  }

  return modalities.length > 0 ? modalities : ['General'];
}

// Get California region based on facility or geographic indicators
export function getCaliforniaRegion(text: string): string {
  const lowerText = text.toLowerCase();
  
  const regions = {
    'Northern California': ['san francisco', 'oakland', 'san jose', 'sacramento', 'san mateo', 'alameda', 'contra costa', 'marin', 'sonoma', 'napa'],
    'Central Valley': ['fresno', 'stockton', 'modesto', 'visalia', 'bakersfield', 'merced', 'stanislaus', 'kern'],
    'Southern California': ['los angeles', 'san diego', 'orange county', 'riverside', 'san bernardino', 'ventura', 'santa barbara', 'imperial'],
    'Central Coast': ['monterey', 'santa cruz', 'san luis obispo', 'santa maria']
  };

  for (const [region, cities] of Object.entries(regions)) {
    if (cities.some(city => lowerText.includes(city))) {
      return region;
    }
  }

  return 'Statewide';
}

// Calculate radiology-specific financial impact
export function calculateRadiologyImpact(event: any): number {
  let impact = 0;

  // CPT code financial impact
  if (event.cptCode && event.deltaPercent) {
    const avgVolumes = {
      '70553': 50,  // MRI Brain w/contrast - monthly avg
      '70552': 40,  // MRI Brain w/o contrast
      '74150': 80,  // CT Abdomen
      '76700': 60,  // Ultrasound
      '77067': 200  // Mammography screening
    };

    const avgRate = 250; // Average reimbursement rate
    const volume = avgVolumes[event.cptCode as keyof typeof avgVolumes] || 30;
    impact = Math.abs((avgRate * event.deltaPercent / 100) * volume);
  }

  // Device recall impact based on modality prevalence
  if (event.modality && Array.isArray(event.modality)) {
    const modalityImpact = {
      'MRI': 5000,      // High impact - expensive equipment
      'CT': 4000,       // High impact - high volume
      'Mammography': 2000,  // Medium impact - specialized
      'X-Ray': 1000,    // Lower impact - widespread
      'Ultrasound': 800 // Lower impact - portable
    };

    event.modality.forEach((mod: string) => {
      impact += modalityImpact[mod as keyof typeof modalityImpact] || 500;
    });
  }

  return impact;
}