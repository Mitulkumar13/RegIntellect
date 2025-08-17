import { type Event, type InsertEvent, type Feedback, type InsertFeedback, type SystemStatus, type InsertSystemStatus, events, feedback, systemStatus } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export interface IStorage {
  // Events
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
  
  // File operations
  saveToFile(filename: string, data: any): Promise<void>;
  loadFromFile(filename: string): Promise<any>;
}

export class MemStorage implements IStorage {
  private events: Map<string, Event>;
  private feedback: Map<string, Feedback>;
  private systemStatus: Map<string, SystemStatus>;
  private dataDir: string;

  constructor() {
    this.events = new Map();
    this.feedback = new Map();
    this.systemStatus = new Map();
    this.dataDir = path.resolve(process.cwd(), 'server/data');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    this.loadData();
  }

  private async loadData() {
    try {
      const eventsData = await this.loadFromFile('events.json');
      if (eventsData && Array.isArray(eventsData)) {
        eventsData.forEach((event: Event) => {
          this.events.set(event.id, event);
        });
      }
    } catch (error) {
      console.log('No existing events data found');
    }
  }

  private async saveEvents() {
    const eventsArray = Array.from(this.events.values())
      .sort((a, b) => new Date(b.archivedAt!).getTime() - new Date(a.archivedAt!).getTime())
      .slice(0, 5000); // Keep last 5000 events
    
    await this.saveToFile('events.json', eventsArray);
  }

  async getEvents(limit = 50, category?: string): Promise<Event[]> {
    const allEvents = Array.from(this.events.values())
      .sort((a, b) => new Date(b.archivedAt!).getTime() - new Date(a.archivedAt!).getTime());
    
    let filtered = allEvents;
    if (category && category !== 'all') {
      filtered = allEvents.filter(event => event.category.toLowerCase() === category.toLowerCase());
    }
    
    return filtered.slice(0, limit);
  }

  async getEventById(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = randomUUID();
    const event: Event = {
      ...insertEvent,
      id,
      archivedAt: new Date(),
      summary: insertEvent.summary ?? null,
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
      reasons: insertEvent.reasons as string[],
      sourceDate: insertEvent.sourceDate ?? null,
    };
    
    this.events.set(id, event);
    await this.saveEvents();
    return event;
  }

  async getEventsBySource(source: string, limit = 50): Promise<Event[]> {
    const sourceEvents = Array.from(this.events.values())
      .filter(event => event.source === source)
      .sort((a, b) => new Date(b.archivedAt!).getTime() - new Date(a.archivedAt!).getTime());
    
    return sourceEvents.slice(0, limit);
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const id = randomUUID();
    const feedback: Feedback = {
      ...insertFeedback,
      id,
      createdAt: new Date(),
    };
    
    this.feedback.set(id, feedback);
    return feedback;
  }

  async getFeedbackByEventId(eventId: string): Promise<Feedback[]> {
    return Array.from(this.feedback.values())
      .filter(fb => fb.eventId === eventId);
  }

  async getSystemStatus(): Promise<SystemStatus[]> {
    return Array.from(this.systemStatus.values());
  }

  async updateSystemStatus(source: string, status: Partial<InsertSystemStatus>): Promise<SystemStatus> {
    const existing = Array.from(this.systemStatus.values()).find(s => s.source === source);
    
    if (existing) {
      const updated = { ...existing, ...status };
      this.systemStatus.set(existing.id, updated);
      return updated;
    } else {
      const id = randomUUID();
      const newStatus: SystemStatus = {
        id,
        source,
        lastSuccess: null,
        lastError: null,
        errorCount24h: 0,
        lastDigestSent: null,
        ...status,
      };
      this.systemStatus.set(id, newStatus);
      return newStatus;
    }
  }

  async saveToFile(filename: string, data: any): Promise<void> {
    const filePath = path.join(this.dataDir, filename);
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async loadFromFile(filename: string): Promise<any> {
    const filePath = path.join(this.dataDir, filename);
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  }
}

export class DatabaseStorage implements IStorage {
  async getEvents(limit = 50, category?: string): Promise<Event[]> {
    if (category && category !== 'all') {
      const result = await db
        .select()
        .from(events)
        .where(eq(events.category, category))
        .orderBy(desc(events.archivedAt))
        .limit(limit);
      return result;
    }
    
    const result = await db
      .select()
      .from(events)
      .orderBy(desc(events.archivedAt))
      .limit(limit);
    
    return result;
  }

  async getEventById(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
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
    const result = await db
      .select()
      .from(events)
      .where(eq(events.source, source))
      .orderBy(desc(events.archivedAt))
      .limit(limit);
    
    return result;
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const [feedbackRecord] = await db
      .insert(feedback)
      .values(insertFeedback)
      .returning();
    return feedbackRecord;
  }

  async getFeedbackByEventId(eventId: string): Promise<Feedback[]> {
    const result = await db
      .select()
      .from(feedback)
      .where(eq(feedback.eventId, eventId));
    
    return result;
  }

  async getSystemStatus(): Promise<SystemStatus[]> {
    const result = await db.select().from(systemStatus);
    return result;
  }

  async updateSystemStatus(source: string, status: Partial<InsertSystemStatus>): Promise<SystemStatus> {
    const [existing] = await db
      .select()
      .from(systemStatus)
      .where(eq(systemStatus.source, source));
    
    if (existing) {
      const [updated] = await db
        .update(systemStatus)
        .set(status)
        .where(eq(systemStatus.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newStatus] = await db
        .insert(systemStatus)
        .values({ source, ...status })
        .returning();
      return newStatus;
    }
  }

  async saveToFile(filename: string, data: any): Promise<void> {
    const dataDir = path.resolve(process.cwd(), 'server/data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const filePath = path.join(dataDir, filename);
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async loadFromFile(filename: string): Promise<any> {
    const dataDir = path.resolve(process.cwd(), 'server/data');
    const filePath = path.join(dataDir, filename);
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  }
}

export const storage = new DatabaseStorage();
