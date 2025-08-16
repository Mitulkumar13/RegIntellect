import { apiRequest } from "@/lib/queryClient";
import type { Event, SystemStatus } from "@/types";

export const api = {
  // Events
  getEvents: async (params?: { limit?: number; category?: string; source?: string }): Promise<Event[]> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.category && params.category !== 'all') searchParams.set('category', params.category);
    if (params?.source && params.source !== 'all') searchParams.set('source', params.source);
    
    const response = await apiRequest('GET', `/api/events?${searchParams}`);
    return response.json();
  },

  // Data collection
  fetchRecalls: async () => {
    const response = await apiRequest('GET', '/api/recalls');
    return response.json();
  },

  fetchCMSPFS: async () => {
    const response = await apiRequest('GET', '/api/cms-pfs');
    return response.json();
  },

  fetchFedReg: async () => {
    const response = await apiRequest('GET', '/api/fedreg');
    return response.json();
  },

  fetchDrugRecalls: async () => {
    const response = await apiRequest('GET', '/api/drug-recalls');
    return response.json();
  },

  fetchMAUDE: async () => {
    const response = await apiRequest('GET', '/api/maude');
    return response.json();
  },

  fetchAuditDeadlines: async () => {
    const response = await apiRequest('GET', '/api/audit-deadlines');
    return response.json();
  },

  fetchStateDOH: async () => {
    const response = await apiRequest('GET', '/api/state-doh');
    return response.json();
  },

  // California-specific endpoints
  fetchCaliforniaCDPH: async () => {
    const response = await apiRequest('GET', '/api/california/cdph');
    return response.json();
  },

  fetchCaliforniaRHB: async () => {
    const response = await apiRequest('GET', '/api/california/rhb');
    return response.json();
  },

  fetchCaliforniaMBC: async () => {
    const response = await apiRequest('GET', '/api/california/mbc');
    return response.json();
  },

  // Feedback
  submitFeedback: async (eventId: string, helpful: boolean) => {
    const response = await apiRequest('POST', '/api/feedback', { eventId, helpful });
    return response.json();
  },

  // Delivery
  sendEmail: async (alertIds: string[], recipients: string[]) => {
    const response = await apiRequest('POST', '/api/send-email', { alertIds, recipients });
    return response.json();
  },

  sendSMS: async (alertId: string, phoneNumbers: string[]) => {
    const response = await apiRequest('POST', '/api/send-sms', { alertId, phoneNumbers });
    return response.json();
  },

  // System status
  getStatus: async (): Promise<SystemStatus> => {
    const response = await apiRequest('GET', '/api/status');
    return response.json();
  },
};
