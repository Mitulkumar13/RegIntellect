import { 
  type Event, 
  type InsertEvent, 
  type Feedback, 
  type InsertFeedback, 
  type SystemStatus, 
  type InsertSystemStatus,
  type Clinic,
  type InsertClinic,
  type Device,
  type InsertDevice,
  type CptProfile,
  type InsertCptProfile,
  type Alert,
  type InsertAlert,
  type ComplianceItem,
  type InsertComplianceItem,
  type NewsItem,
  type InsertNewsItem,
  events, 
  feedback, 
  systemStatus,
  clinics,
  devices,
  cptProfiles,
  clinicAlerts,
  complianceItems,
  newsItems,
  maudeEvents,
  openfdaEvents,
  cmsPfsChanges
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte, lte, isNull, or } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IRadIntelStorage {
  // Legacy Events (maintain compatibility)
  getEvents(limit?: number, category?: string): Promise<Event[]>;
  getEventById(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  getEventsBySource(source: string, limit?: number): Promise<Event[]>;
  
  // Feedback
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getFeedbackByEventId(eventId: string): Promise<Feedback[]>;
  
  // System Status
  getSystemStatus(): Promise<SystemStatus[]>;
  updateSystemStatus(source: string, status: Partial<InsertSystemStatus>): Promise<SystemStatus>;
  
  // Clinics Management
  getClinics(limit?: number): Promise<Clinic[]>;
  getClinicById(id: string): Promise<Clinic | undefined>;
  createClinic(clinic: InsertClinic): Promise<Clinic>;
  updateClinic(id: string, updates: Partial<InsertClinic>): Promise<Clinic>;
  getClinicsByOnboardingStatus(status: string): Promise<Clinic[]>;
  
  // Device Management
  getDevicesByClinic(clinicId: string): Promise<Device[]>;
  getDeviceById(id: string): Promise<Device | undefined>;
  createDevice(device: InsertDevice): Promise<Device>;
  updateDevice(id: string, updates: Partial<InsertDevice>): Promise<Device>;
  getDevicesByModality(modalityType: string): Promise<Device[]>;
  
  // CPT Profile Management
  getCptProfilesByClinic(clinicId: string): Promise<CptProfile[]>;
  getCptProfileById(id: string): Promise<CptProfile | undefined>;
  createCptProfile(profile: InsertCptProfile): Promise<CptProfile>;
  updateCptProfile(id: string, updates: Partial<InsertCptProfile>): Promise<CptProfile>;
  getCptProfilesByCptCode(cptCode: string): Promise<CptProfile[]>;
  
  // Alert Management
  getAlertsByClinic(clinicId: string, limit?: number): Promise<Alert[]>;
  getSystemWideAlerts(limit?: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  acknowledgeAlert(id: string, acknowledgedBy: string): Promise<Alert>;
  getUnacknowledgedAlerts(clinicId?: string): Promise<Alert[]>;
  getAlertsByPriority(priority: string): Promise<Alert[]>;
  
  // Compliance Management
  getComplianceItemsByClinic(clinicId: string): Promise<ComplianceItem[]>;
  getOverdueComplianceItems(clinicId?: string): Promise<ComplianceItem[]>;
  createComplianceItem(item: InsertComplianceItem): Promise<ComplianceItem>;
  updateComplianceItem(id: string, updates: Partial<InsertComplianceItem>): Promise<ComplianceItem>;
  getComplianceItemsByType(type: string): Promise<ComplianceItem[]>;
  
  // News Management
  getNewsItems(limit?: number, urgency?: string): Promise<NewsItem[]>;
  createNewsItem(newsItem: InsertNewsItem): Promise<NewsItem>;
  getNewsItemsBySource(source: string): Promise<NewsItem[]>;
  getNewsItemsByTags(tags: string[]): Promise<NewsItem[]>;
  
  // Reporting and Analytics
  getClinicDashboardData(clinicId: string): Promise<{
    activeAlerts: number;
    overdueCompliance: number;
    devicesCount: number;
    cptProfilesCount: number;
    recentAlerts: Alert[];
    upcomingCompliance: ComplianceItem[];
  }>;
  
  // Bulk Operations
  bulkCreateDevices(devices: InsertDevice[]): Promise<Device[]>;
  bulkCreateCptProfiles(profiles: InsertCptProfile[]): Promise<CptProfile[]>;
  bulkCreateAlerts(alerts: InsertAlert[]): Promise<Alert[]>;
}

export class DatabaseStorage implements IRadIntelStorage {
  
  // Legacy Events Methods (maintain compatibility)
  async getEvents(limit = 50, category?: string): Promise<Event[]> {
    let query = db.select().from(events);
    
    if (category) {
      query = query.where(eq(events.category, category));
    }
    
    return await query.orderBy(desc(events.archivedAt)).limit(limit);
  }

  async getEventById(id: string): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
    return result[0];
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values({
        ...insertEvent,
        deviceName: insertEvent.deviceName ?? null,
        model: insertEvent.model ?? null,
        manufacturer: insertEvent.manufacturer ?? null,
        classification: insertEvent.classification ?? null,
        reason: insertEvent.reason ?? null,
        firm: insertEvent.firm ?? null,
        state: insertEvent.state ?? null,
        status: insertEvent.status ?? null,
        cptCodes: insertEvent.cptCodes ?? null,
        delta: insertEvent.delta ?? null,
        modalityType: insertEvent.modalityType ?? null,
        radiologyImpact: insertEvent.radiologyImpact ?? null,
        californiaRegion: insertEvent.californiaRegion ?? null,
      })
      .returning();
    return event;
  }

  async getEventsBySource(source: string, limit = 50): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(eq(events.source, source))
      .orderBy(desc(events.archivedAt))
      .limit(limit);
  }

  // Feedback Methods
  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const [feedbackRecord] = await db.insert(feedback).values(insertFeedback).returning();
    return feedbackRecord;
  }

  async getFeedbackByEventId(eventId: string): Promise<Feedback[]> {
    return await db.select().from(feedback).where(eq(feedback.eventId, eventId));
  }

  // System Status Methods
  async getSystemStatus(): Promise<SystemStatus[]> {
    return await db.select().from(systemStatus);
  }

  async updateSystemStatus(source: string, status: Partial<InsertSystemStatus>): Promise<SystemStatus> {
    const existing = await db.select().from(systemStatus).where(eq(systemStatus.source, source)).limit(1);
    
    if (existing.length > 0) {
      const [updated] = await db
        .update(systemStatus)
        .set(status)
        .where(eq(systemStatus.source, source))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(systemStatus)
        .values({ source, ...status } as InsertSystemStatus)
        .returning();
      return created;
    }
  }

  // Clinic Management Methods
  async getClinics(limit = 50): Promise<Clinic[]> {
    return await db.select().from(clinics).orderBy(desc(clinics.createdAt)).limit(limit);
  }

  async getClinicById(id: string): Promise<Clinic | undefined> {
    const result = await db.select().from(clinics).where(eq(clinics.id, id)).limit(1);
    return result[0];
  }

  async createClinic(insertClinic: InsertClinic): Promise<Clinic> {
    const [clinic] = await db.insert(clinics).values(insertClinic).returning();
    return clinic;
  }

  async updateClinic(id: string, updates: Partial<InsertClinic>): Promise<Clinic> {
    const [clinic] = await db
      .update(clinics)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clinics.id, id))
      .returning();
    return clinic;
  }

  async getClinicsByOnboardingStatus(status: string): Promise<Clinic[]> {
    return await db
      .select()
      .from(clinics)
      .where(eq(clinics.onboardingStatus, status))
      .orderBy(desc(clinics.createdAt));
  }

  // Device Management Methods
  async getDevicesByClinic(clinicId: string): Promise<Device[]> {
    return await db
      .select()
      .from(devices)
      .where(and(eq(devices.clinicId, clinicId), eq(devices.isActive, true)))
      .orderBy(desc(devices.createdAt));
  }

  async getDeviceById(id: string): Promise<Device | undefined> {
    const result = await db.select().from(devices).where(eq(devices.id, id)).limit(1);
    return result[0];
  }

  async createDevice(insertDevice: InsertDevice): Promise<Device> {
    const [device] = await db.insert(devices).values(insertDevice).returning();
    return device;
  }

  async updateDevice(id: string, updates: Partial<InsertDevice>): Promise<Device> {
    const [device] = await db
      .update(devices)
      .set(updates)
      .where(eq(devices.id, id))
      .returning();
    return device;
  }

  async getDevicesByModality(modalityType: string): Promise<Device[]> {
    return await db
      .select()
      .from(devices)
      .where(and(eq(devices.modalityType, modalityType), eq(devices.isActive, true)));
  }

  // CPT Profile Management Methods
  async getCptProfilesByClinic(clinicId: string): Promise<CptProfile[]> {
    return await db
      .select()
      .from(cptProfiles)
      .where(and(eq(cptProfiles.clinicId, clinicId), eq(cptProfiles.isActive, true)))
      .orderBy(desc(cptProfiles.yearlyVolume));
  }

  async getCptProfileById(id: string): Promise<CptProfile | undefined> {
    const result = await db.select().from(cptProfiles).where(eq(cptProfiles.id, id)).limit(1);
    return result[0];
  }

  async createCptProfile(insertProfile: InsertCptProfile): Promise<CptProfile> {
    const [profile] = await db.insert(cptProfiles).values(insertProfile).returning();
    return profile;
  }

  async updateCptProfile(id: string, updates: Partial<InsertCptProfile>): Promise<CptProfile> {
    const [profile] = await db
      .update(cptProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cptProfiles.id, id))
      .returning();
    return profile;
  }

  async getCptProfilesByCptCode(cptCode: string): Promise<CptProfile[]> {
    return await db
      .select()
      .from(cptProfiles)
      .where(and(eq(cptProfiles.cptCode, cptCode), eq(cptProfiles.isActive, true)));
  }

  // Alert Management Methods
  async getAlertsByClinic(clinicId: string, limit = 50): Promise<Alert[]> {
    return await db
      .select()
      .from(clinicAlerts)
      .where(eq(clinicAlerts.clinicId, clinicId))
      .orderBy(desc(clinicAlerts.createdAt))
      .limit(limit);
  }

  async getSystemWideAlerts(limit = 50): Promise<Alert[]> {
    return await db
      .select()
      .from(clinicAlerts)
      .where(isNull(clinicAlerts.clinicId))
      .orderBy(desc(clinicAlerts.createdAt))
      .limit(limit);
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const [alert] = await db.insert(clinicAlerts).values(insertAlert).returning();
    return alert;
  }

  async acknowledgeAlert(id: string, acknowledgedBy: string): Promise<Alert> {
    const [alert] = await db
      .update(clinicAlerts)
      .set({
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy
      })
      .where(eq(clinicAlerts.id, id))
      .returning();
    return alert;
  }

  async getUnacknowledgedAlerts(clinicId?: string): Promise<Alert[]> {
    let whereCondition = eq(clinicAlerts.acknowledged, false);
    
    if (clinicId) {
      whereCondition = and(whereCondition, or(eq(clinicAlerts.clinicId, clinicId), isNull(clinicAlerts.clinicId)));
    }
    
    return await db
      .select()
      .from(clinicAlerts)
      .where(whereCondition)
      .orderBy(desc(clinicAlerts.createdAt));
  }

  async getAlertsByPriority(priority: string): Promise<Alert[]> {
    return await db
      .select()
      .from(clinicAlerts)
      .where(eq(clinicAlerts.priority, priority))
      .orderBy(desc(clinicAlerts.createdAt));
  }

  // Compliance Management Methods
  async getComplianceItemsByClinic(clinicId: string): Promise<ComplianceItem[]> {
    return await db
      .select()
      .from(complianceItems)
      .where(eq(complianceItems.clinicId, clinicId))
      .orderBy(complianceItems.dueDate);
  }

  async getOverdueComplianceItems(clinicId?: string): Promise<ComplianceItem[]> {
    let whereCondition = lte(complianceItems.dueDate, sql`CURRENT_DATE`);
    
    if (clinicId) {
      whereCondition = and(whereCondition, eq(complianceItems.clinicId, clinicId));
    }
    
    return await db
      .select()
      .from(complianceItems)
      .where(whereCondition)
      .orderBy(complianceItems.dueDate);
  }

  async createComplianceItem(insertItem: InsertComplianceItem): Promise<ComplianceItem> {
    const [item] = await db.insert(complianceItems).values(insertItem).returning();
    return item;
  }

  async updateComplianceItem(id: string, updates: Partial<InsertComplianceItem>): Promise<ComplianceItem> {
    const [item] = await db
      .update(complianceItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(complianceItems.id, id))
      .returning();
    return item;
  }

  async getComplianceItemsByType(type: string): Promise<ComplianceItem[]> {
    return await db
      .select()
      .from(complianceItems)
      .where(eq(complianceItems.type, type))
      .orderBy(complianceItems.dueDate);
  }

  // News Management Methods
  async getNewsItems(limit = 50, urgency?: string): Promise<NewsItem[]> {
    let query = db.select().from(newsItems);
    
    if (urgency) {
      query = query.where(eq(newsItems.urgency, urgency));
    }
    
    return await query.orderBy(desc(newsItems.publishedAt)).limit(limit);
  }

  async createNewsItem(insertNewsItem: InsertNewsItem): Promise<NewsItem> {
    const [newsItem] = await db.insert(newsItems).values(insertNewsItem).returning();
    return newsItem;
  }

  async getNewsItemsBySource(source: string): Promise<NewsItem[]> {
    return await db
      .select()
      .from(newsItems)
      .where(eq(newsItems.source, source))
      .orderBy(desc(newsItems.publishedAt));
  }

  async getNewsItemsByTags(tags: string[]): Promise<NewsItem[]> {
    return await db
      .select()
      .from(newsItems)
      .where(sql`${newsItems.tags} && ${tags}`)
      .orderBy(desc(newsItems.publishedAt));
  }

  // Reporting and Analytics
  async getClinicDashboardData(clinicId: string): Promise<{
    activeAlerts: number;
    overdueCompliance: number;
    devicesCount: number;
    cptProfilesCount: number;
    recentAlerts: Alert[];
    upcomingCompliance: ComplianceItem[];
  }> {
    const [
      activeAlerts,
      overdueCompliance,
      devicesCount,
      cptProfilesCount,
      recentAlerts,
      upcomingCompliance
    ] = await Promise.all([
      this.getUnacknowledgedAlerts(clinicId).then(alerts => alerts.length),
      this.getOverdueComplianceItems(clinicId).then(items => items.length),
      this.getDevicesByClinic(clinicId).then(devices => devices.length),
      this.getCptProfilesByClinic(clinicId).then(profiles => profiles.length),
      this.getAlertsByClinic(clinicId, 5),
      db.select()
        .from(complianceItems)
        .where(and(
          eq(complianceItems.clinicId, clinicId),
          gte(complianceItems.dueDate, sql`CURRENT_DATE`),
          lte(complianceItems.dueDate, sql`CURRENT_DATE + INTERVAL '30 days'`)
        ))
        .orderBy(complianceItems.dueDate)
        .limit(5)
    ]);

    return {
      activeAlerts,
      overdueCompliance,
      devicesCount,
      cptProfilesCount,
      recentAlerts,
      upcomingCompliance
    };
  }

  // Bulk Operations
  async bulkCreateDevices(insertDevices: InsertDevice[]): Promise<Device[]> {
    return await db.insert(devices).values(insertDevices).returning();
  }

  async bulkCreateCptProfiles(insertProfiles: InsertCptProfile[]): Promise<CptProfile[]> {
    return await db.insert(cptProfiles).values(insertProfiles).returning();
  }

  async bulkCreateAlerts(insertAlerts: InsertAlert[]): Promise<Alert[]> {
    return await db.insert(clinicAlerts).values(insertAlerts).returning();
  }
}

// Export storage instance
export const storage = new DatabaseStorage();