import type { CPTVolume } from "@/types";

const CPT_VOLUMES_KEY = 'radintel_cpt_volumes';
const USER_PREFERENCES_KEY = 'radintel_preferences';

export interface UserPreferences {
  emailAlerts: boolean;
  smsAlerts: boolean;
  email?: string;
  phone?: string;
  digestFrequency: 'daily' | 'weekly';
}

export const localStorage = {
  // CPT Volumes
  getCPTVolumes: (): CPTVolume[] => {
    try {
      const data = window.localStorage.getItem(CPT_VOLUMES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setCPTVolumes: (volumes: CPTVolume[]): void => {
    try {
      window.localStorage.setItem(CPT_VOLUMES_KEY, JSON.stringify(volumes));
    } catch (error) {
      console.error('Failed to save CPT volumes:', error);
    }
  },

  addCPTVolume: (volume: CPTVolume): void => {
    const volumes = localStorage.getCPTVolumes();
    const existingIndex = volumes.findIndex(v => v.code === volume.code);
    
    if (existingIndex >= 0) {
      volumes[existingIndex] = volume;
    } else {
      volumes.push(volume);
    }
    
    localStorage.setCPTVolumes(volumes);
  },

  removeCPTVolume: (code: string): void => {
    const volumes = localStorage.getCPTVolumes().filter(v => v.code !== code);
    localStorage.setCPTVolumes(volumes);
  },

  // User Preferences
  getPreferences: (): UserPreferences => {
    try {
      const data = window.localStorage.getItem(USER_PREFERENCES_KEY);
      return data ? JSON.parse(data) : {
        emailAlerts: true,
        smsAlerts: false,
        digestFrequency: 'daily'
      };
    } catch {
      return {
        emailAlerts: true,
        smsAlerts: false,
        digestFrequency: 'daily'
      };
    }
  },

  setPreferences: (preferences: UserPreferences): void => {
    try {
      window.localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  },

  // Export/Import
  exportData: (): string => {
    const data = {
      cptVolumes: localStorage.getCPTVolumes(),
      preferences: localStorage.getPreferences(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  },

  importData: (jsonData: string): void => {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.cptVolumes) {
        localStorage.setCPTVolumes(data.cptVolumes);
      }
      
      if (data.preferences) {
        localStorage.setPreferences(data.preferences);
      }
    } catch (error) {
      throw new Error('Invalid import data format');
    }
  },

  clearAll: (): void => {
    try {
      window.localStorage.removeItem(CPT_VOLUMES_KEY);
      window.localStorage.removeItem(USER_PREFERENCES_KEY);
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  },
};
