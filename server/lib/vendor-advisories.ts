import { withRetry } from './retry';

interface VendorAdvisory {
  id: string;
  vendor: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedProducts: string[];
  publishedDate: string;
  url?: string;
}

// Mock vendor advisory sources - in production would fetch from actual vendor APIs/pages
const VENDOR_SOURCES = {
  GE: 'https://www.gehealthcare.com/support/security',
  Siemens: 'https://www.siemens-healthineers.com/support/cybersecurity',
  Philips: 'https://www.philips.com/healthcare/solutions/customer-service-solutions/cybersecurity',
  Canon: 'https://us.medical.canon/support/security-advisories',
  Fujifilm: 'https://www.fujifilmhealthcare.com/support/security',
  Hologic: 'https://www.hologic.com/support/security'
};

export async function fetchVendorAdvisories(): Promise<VendorAdvisory[]> {
  // For MVP, returning mock data structure
  // In production, would scrape/fetch from actual vendor pages
  const mockAdvisories: VendorAdvisory[] = [
    {
      id: 'ge-2025-001',
      vendor: 'GE Healthcare',
      title: 'Security Update for Optima CT660',
      description: 'Critical firmware update addressing network vulnerability in CT scanning systems',
      severity: 'high',
      affectedProducts: ['Optima CT660', 'Optima CT540'],
      publishedDate: new Date().toISOString(),
      url: VENDOR_SOURCES.GE
    },
    {
      id: 'siemens-2025-002',
      vendor: 'Siemens Healthineers',
      title: 'MAGNETOM Software Patch',
      description: 'Software update for MAGNETOM MRI systems to address image reconstruction issue',
      severity: 'medium',
      affectedProducts: ['MAGNETOM Vida', 'MAGNETOM Sola'],
      publishedDate: new Date().toISOString(),
      url: VENDOR_SOURCES.Siemens
    }
  ];

  return mockAdvisories;
}

export async function checkVendorAdvisories(): Promise<any[]> {
  try {
    const advisories = await fetchVendorAdvisories();
    
    return advisories.map(advisory => ({
      id: advisory.id,
      source: 'Vendor Advisory',
      sourceId: advisory.id,
      title: `${advisory.vendor}: ${advisory.title}`,
      summary: advisory.description,
      category: 'Important', // As specified in brief
      score: 55, // Medium baseline for vendor advisories
      vendor: advisory.vendor,
      severity: advisory.severity,
      affectedProducts: advisory.affectedProducts,
      url: advisory.url,
      sourceDate: new Date(advisory.publishedDate),
      type: 'vendor_advisory'
    }));
  } catch (error) {
    console.error('Error fetching vendor advisories:', error);
    return [];
  }
}