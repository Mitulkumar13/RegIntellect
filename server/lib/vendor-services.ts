// Vendor advisory and regulatory body integration services

export interface VendorAdvisory {
  id: string;
  vendor: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedProducts: string[];
  recommendedAction: string;
  publishedDate: Date;
  expirationDate?: Date;
  url?: string;
}

export interface RegulatoryAlert {
  id: string;
  source: 'CDPH' | 'RHB' | 'MBC';
  title: string;
  description: string;
  category: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedLicenseTypes: string[];
  complianceDeadline?: Date;
  publishedDate: Date;
  url?: string;
}

export async function checkVendorAdvisories(deviceManufacturers: string[]): Promise<VendorAdvisory[]> {
  try {
    console.log(`Checking vendor advisories for ${deviceManufacturers.length} manufacturers`);
    
    // Mock implementation - replace with actual vendor API integrations
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const mockAdvisories: VendorAdvisory[] = [
      {
        id: 'GE-2024-008',
        vendor: 'GE Healthcare',
        title: 'Revolution CT Software Update Required',
        description: 'Critical software update to address image reconstruction artifacts in certain scan protocols.',
        severity: 'HIGH',
        affectedProducts: ['Revolution CT', 'Revolution Apex', 'Revolution Maxima'],
        recommendedAction: 'Schedule software update during next maintenance window. Contact GE service.',
        publishedDate: new Date('2024-08-15'),
        expirationDate: new Date('2024-10-15'),
        url: 'https://gehealthcare.com/service-advisory-2024-008'
      },
      {
        id: 'SIEMENS-2024-012',
        vendor: 'Siemens Healthineers',
        title: 'MAGNETOM MRI Coil Inspection Notice',
        description: 'Recommended inspection of receive coils for potential connection issues affecting image quality.',
        severity: 'MEDIUM',
        affectedProducts: ['MAGNETOM Vida', 'MAGNETOM Sola', 'MAGNETOM Altea'],
        recommendedAction: 'Perform visual inspection of all receive coils. Document findings and report to service.',
        publishedDate: new Date('2024-08-12'),
        url: 'https://siemens-healthineers.com/service-bulletin-2024-012'
      },
      {
        id: 'PHILIPS-2024-005',
        vendor: 'Philips Healthcare',
        title: 'DigitalDiagnost C90 Calibration Update',
        description: 'Updated calibration procedure to ensure optimal image quality and dose efficiency.',
        severity: 'LOW',
        affectedProducts: ['DigitalDiagnost C90'],
        recommendedAction: 'Apply calibration update during next scheduled QC. No immediate action required.',
        publishedDate: new Date('2024-08-10'),
        url: 'https://philips.com/healthcare/service-notice-2024-005'
      }
    ];
    
    // Filter advisories based on provided manufacturers
    const relevantAdvisories = mockAdvisories.filter(advisory => 
      deviceManufacturers.some(manufacturer => 
        advisory.vendor.toLowerCase().includes(manufacturer.toLowerCase()) ||
        manufacturer.toLowerCase().includes(advisory.vendor.toLowerCase())
      )
    );
    
    return relevantAdvisories;
    
  } catch (error) {
    console.error('Vendor advisory check failed:', error);
    return [];
  }
}

export async function fetchCDPHAlerts(): Promise<RegulatoryAlert[]> {
  try {
    console.log('Fetching California Department of Public Health alerts...');
    
    // Mock implementation - replace with actual CDPH data scraping/API
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const mockAlerts: RegulatoryAlert[] = [
      {
        id: 'CDPH-2024-RAD-003',
        source: 'CDPH',
        title: 'Updated Radiation Safety Requirements for CT Facilities',
        description: 'New guidelines for radiation dose optimization and patient protection protocols in CT imaging.',
        category: 'Radiation Safety',
        urgency: 'HIGH',
        affectedLicenseTypes: ['CT Facility', 'Hospital Radiology'],
        complianceDeadline: new Date('2024-12-31'),
        publishedDate: new Date('2024-08-14'),
        url: 'https://cdph.ca.gov/radiation-safety-2024-003'
      },
      {
        id: 'CDPH-2024-RAD-004',
        source: 'CDPH',
        title: 'Annual Inspection Requirements Reminder',
        description: 'Reminder of annual inspection requirements for diagnostic X-ray facilities.',
        category: 'Facility Licensing',
        urgency: 'MEDIUM',
        affectedLicenseTypes: ['X-Ray Facility', 'Mammography Facility'],
        publishedDate: new Date('2024-08-10'),
        url: 'https://cdph.ca.gov/facility-licensing-reminder-2024'
      }
    ];
    
    return mockAlerts;
    
  } catch (error) {
    console.error('CDPH alerts fetch failed:', error);
    return [];
  }
}

export async function fetchRHBAlerts(): Promise<RegulatoryAlert[]> {
  try {
    console.log('Fetching Radiologic Health Branch alerts...');
    
    // Mock implementation - replace with actual RHB data scraping
    await new Promise(resolve => setTimeout(resolve, 350));
    
    const mockAlerts: RegulatoryAlert[] = [
      {
        id: 'RHB-2024-015',
        source: 'RHB',
        title: 'Equipment Registration Update Required',
        description: 'All diagnostic X-ray equipment must be re-registered with updated technical specifications.',
        category: 'Equipment Registration',
        urgency: 'HIGH',
        affectedLicenseTypes: ['All Radiology Licenses'],
        complianceDeadline: new Date('2024-09-30'),
        publishedDate: new Date('2024-08-13'),
        url: 'https://cdph.ca.gov/rhb-equipment-registration-2024'
      },
      {
        id: 'RHB-2024-016',
        source: 'RHB',
        title: 'Quality Assurance Program Updates',
        description: 'Updated quality assurance testing protocols for mammography facilities.',
        category: 'Quality Assurance',
        urgency: 'MEDIUM',
        affectedLicenseTypes: ['Mammography Facility'],
        complianceDeadline: new Date('2024-11-01'),
        publishedDate: new Date('2024-08-08'),
        url: 'https://cdph.ca.gov/rhb-qa-program-2024'
      }
    ];
    
    return mockAlerts;
    
  } catch (error) {
    console.error('RHB alerts fetch failed:', error);
    return [];
  }
}

export async function fetchMBCAlerts(): Promise<RegulatoryAlert[]> {
  try {
    console.log('Fetching Medical Board of California alerts...');
    
    // Mock implementation - replace with actual MBC data scraping
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockAlerts: RegulatoryAlert[] = [
      {
        id: 'MBC-2024-009',
        source: 'MBC',
        title: 'Physician Supervision Requirements for Imaging',
        description: 'Updated guidelines for physician supervision of diagnostic imaging procedures.',
        category: 'Physician Practice',
        urgency: 'MEDIUM',
        affectedLicenseTypes: ['Physician License'],
        publishedDate: new Date('2024-08-11'),
        url: 'https://mbc.ca.gov/supervision-guidelines-2024-009'
      },
      {
        id: 'MBC-2024-010',
        source: 'MBC',
        title: 'Continuing Education Requirements Update',
        description: 'New continuing education requirements for physicians practicing radiology in California.',
        category: 'Continuing Education',
        urgency: 'LOW',
        affectedLicenseTypes: ['Radiologist License', 'Physician License'],
        complianceDeadline: new Date('2025-01-01'),
        publishedDate: new Date('2024-08-05'),
        url: 'https://mbc.ca.gov/ce-requirements-2024-010'
      }
    ];
    
    return mockAlerts;
    
  } catch (error) {
    console.error('MBC alerts fetch failed:', error);
    return [];
  }
}

export async function fetchAllRegulatoryAlerts(): Promise<RegulatoryAlert[]> {
  try {
    const [cdphAlerts, rhbAlerts, mbcAlerts] = await Promise.allSettled([
      fetchCDPHAlerts(),
      fetchRHBAlerts(),
      fetchMBCAlerts()
    ]);
    
    const allAlerts: RegulatoryAlert[] = [];
    
    if (cdphAlerts.status === 'fulfilled') {
      allAlerts.push(...cdphAlerts.value);
    }
    
    if (rhbAlerts.status === 'fulfilled') {
      allAlerts.push(...rhbAlerts.value);
    }
    
    if (mbcAlerts.status === 'fulfilled') {
      allAlerts.push(...mbcAlerts.value);
    }
    
    // Sort by urgency and published date
    return allAlerts.sort((a, b) => {
      const urgencyOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      
      if (urgencyDiff !== 0) return urgencyDiff;
      
      return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
    });
    
  } catch (error) {
    console.error('Failed to fetch regulatory alerts:', error);
    return [];
  }
}

export function categorizeVendorAdvisory(advisory: VendorAdvisory): 'Urgent' | 'Informational' | 'Digest' {
  switch (advisory.severity) {
    case 'CRITICAL':
      return 'Urgent';
    case 'HIGH':
      return 'Informational';
    case 'MEDIUM':
    case 'LOW':
      return 'Digest';
    default:
      return 'Digest';
  }
}

export function categorizeRegulatoryAlert(alert: RegulatoryAlert): 'Urgent' | 'Informational' | 'Digest' {
  if (alert.urgency === 'CRITICAL') return 'Urgent';
  
  // Check if compliance deadline is soon
  if (alert.complianceDeadline) {
    const daysUntilDeadline = Math.ceil(
      (alert.complianceDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilDeadline <= 30) return 'Urgent';
    if (daysUntilDeadline <= 90) return 'Informational';
  }
  
  if (alert.urgency === 'HIGH') return 'Informational';
  
  return 'Digest';
}