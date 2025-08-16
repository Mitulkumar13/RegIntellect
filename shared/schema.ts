import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Events table for storing all regulatory alerts
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  source: text("source").notNull(), // "openFDA", "CMS", "FedReg"
  sourceId: text("source_id").notNull(), // Original ID from source
  title: text("title").notNull(),
  summary: text("summary"), // AI-generated summary
  category: text("category").notNull(), // "Urgent", "Informational", "Digest", "Suppressed"
  score: integer("score").notNull(),
  reasons: jsonb("reasons").$type<string[]>().notNull(),
  
  // Source-specific fields
  deviceName: text("device_name"),
  model: text("model"),
  manufacturer: text("manufacturer"),
  classification: text("classification"),
  reason: text("reason"),
  firm: text("firm"),
  state: text("state"),
  status: text("status"),
  cptCodes: jsonb("cpt_codes").$type<string[]>(),
  delta: jsonb("delta").$type<{ old: number; new: number }>(),
  
  // Metadata
  originalData: jsonb("original_data").notNull(),
  archivedAt: timestamp("archived_at").defaultNow(),
  sourceDate: timestamp("source_date"),
});

// Feedback table for storing user feedback
export const feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull(),
  helpful: boolean("helpful").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// System status table
export const systemStatus = pgTable("system_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  source: text("source").notNull(), // "recalls", "cms_pfs", "fedreg"
  lastSuccess: timestamp("last_success"),
  lastError: timestamp("last_error"),
  errorCount24h: integer("error_count_24h").default(0),
  lastDigestSent: timestamp("last_digest_sent"),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  archivedAt: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
});

export const insertSystemStatusSchema = createInsertSchema(systemStatus).omit({
  id: true,
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;
export type InsertSystemStatus = z.infer<typeof insertSystemStatusSchema>;
export type SystemStatus = typeof systemStatus.$inferSelect;

// Response types for API endpoints
export const AlertResponse = z.object({
  source: z.string(),
  count: z.number(),
  fetchedAt: z.string(),
  events: z.array(z.any()),
});

export type AlertResponse = z.infer<typeof AlertResponse>;
