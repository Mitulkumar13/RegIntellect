export interface Event {
  id: string;
  source: string;
  sourceId: string;
  title: string;
  summary: string | null;
  category: 'Urgent' | 'Informational' | 'Digest' | 'Suppressed';
  score: number;
  reasons: string[];
  deviceName: string | null;
  model: string | null;
  manufacturer: string | null;
  classification: string | null;
  reason: string | null;
  firm: string | null;
  state: string | null;
  status: string | null;
  cptCodes: string[] | null;
  delta: { old: number; new: number } | null;
  originalData: any;
  archivedAt: Date;
  sourceDate: Date | null;
}

export interface SystemStatus {
  lastSuccess: Record<string, Date | null>;
  lastError: Record<string, Date | null>;
  errorCounts24h: Record<string, number>;
  lastDigestSent: Date | null;
  uptime: number;
  timestamp: string;
}

export interface CPTVolume {
  code: string;
  volume: number;
  description?: string;
}

export interface ImpactCalculation {
  cptCode: string;
  volume: number;
  oldRate: number;
  newRate: number;
  monthlyImpact: number;
  annualImpact: number;
}

export interface FilterState {
  category: 'all' | 'urgent' | 'informational' | 'digest';
  source: 'all' | 'openFDA' | 'CMS' | 'Federal Register';
  dateRange: 'today' | 'week' | 'month' | 'all';
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  digest: {
    frequency: 'daily' | 'weekly' | 'disabled';
    time: string;
  };
  contacts: {
    email: string[];
    phone: string[];
  };
  thresholds: {
    urgent: number;
    informational: number;
  };
  sources: {
    fda: boolean;
    cms: boolean;
    fedreg: boolean;
  };
}
