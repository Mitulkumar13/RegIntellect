import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, decimal, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Events table for storing radiology regulatory alerts
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  source: text("source").notNull(), // "openFDA", "CMS", "FedReg", "CDPH", "MBC", "RHB"
  sourceId: text("source_id").notNull(), // Original ID from source
  title: text("title").notNull(),
  summary: text("summary"), // AI-generated summary
  category: text("category").notNull(), // "Urgent", "Informational", "Digest", "Suppressed"
  score: integer("score").notNull(),
  reasons: jsonb("reasons").$type<string[]>().notNull(),
  
  // Radiology-specific fields
  deviceName: text("device_name"), // X-ray, CT, MRI, Ultrasound, etc.
  model: text("model"),
  manufacturer: text("manufacturer"),
  classification: text("classification"),
  reason: text("reason"),
  firm: text("firm"),
  state: text("state"), // Focus on California
  status: text("status"),
  cptCodes: jsonb("cpt_codes").$type<string[]>(), // Radiology CPT codes
  delta: jsonb("delta").$type<{ old: number; new: number }>(),
  modalityType: text("modality_type"), // CT, MRI, X-Ray, Ultrasound, Nuclear Medicine
  radiologyImpact: text("radiology_impact"), // High, Medium, Low
  californiaRegion: text("california_region"), // NorCal, SoCal, Central Valley, etc.
  
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
  source: text("source").notNull(), // "recalls", "cms_pfs", "fedreg", "cdph", "mbc", "rhb"
  lastSuccess: timestamp("last_success"),
  lastError: timestamp("last_error"),
  errorCount24h: integer("error_count_24h").default(0),
  lastDigestSent: timestamp("last_digest_sent"),
});

// Clinics table for onboarding and profile management
export const clinics = pgTable("clinics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull().default('CA'),
  zipCode: text("zip_code").notNull(),
  contactEmails: jsonb("contact_emails").$type<string[]>().notNull(),
  timezone: text("timezone").default('America/Los_Angeles'),
  onboardingStatus: text("onboarding_status").default('pending'), // pending, devices_added, cpt_configured, completed
  payerList: jsonb("payer_list").$type<string[]>(),
  californiaRegion: text("california_region"), // NorCal, SoCal, Central Valley, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Devices table for tracking clinic equipment
export const devices = pgTable("devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").notNull().references(() => clinics.id),
  manufacturer: text("manufacturer").notNull(),
  model: text("model").notNull(),
  serialNumber: text("serial_number"),
  catalogCode: text("catalog_code"),
  modalityType: text("modality_type"), // CT, MRI, X-Ray, Ultrasound, Nuclear Medicine, etc.
  dateInstalled: date("date_installed"),
  warrantyExpiration: date("warranty_expiration"),
  lastMaintenance: date("last_maintenance"),
  mqsaNumber: text("mqsa_number"), // For mammography units
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CPT Profiles table for tracking procedure volumes and reimbursements
export const cptProfiles = pgTable("cpt_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").notNull().references(() => clinics.id),
  cptCode: text("cpt_code").notNull(),
  description: text("description").notNull(),
  yearlyVolume: integer("yearly_volume").notNull(),
  avgReimbursement: decimal("avg_reimbursement", { precision: 10, scale: 2 }),
  modalityType: text("modality_type"), // Link to device modality
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Enhanced alerts table with clinic targeting
export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").references(() => clinics.id), // null = applies to all clinics
  type: text("type").notNull(), // device_recall, drug_shortage, cms_update, compliance_due, news
  priority: text("priority").notNull(), // CRITICAL, HIGH, MEDIUM, LOW
  source: text("source").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  matchedDeviceId: varchar("matched_device_id").references(() => devices.id),
  cptCodes: jsonb("cpt_codes").$type<string[]>(),
  payload: jsonb("payload").notNull(), // Raw event data
  acknowledged: boolean("acknowledged").default(false),
  acknowledgedAt: timestamp("acknowledged_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Compliance tracking table
export const complianceItems = pgTable("compliance_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").notNull().references(() => clinics.id),
  type: text("type").notNull(), // MQSA, RHB, HIPAA, OSHA, FDA
  title: text("title").notNull(),
  description: text("description"),
  dueDate: date("due_date").notNull(),
  lastAction: text("last_action"),
  status: text("status").default('pending'), // pending, in_progress, completed, overdue
  reminderWindows: jsonb("reminder_windows").$type<number[]>().default([90, 30, 7]), // Days before due date
  deviceId: varchar("device_id").references(() => devices.id), // Link to specific device if applicable
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// News items table for regulatory news feed
export const newsItems = pgTable("news_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  body: text("body").notNull(),
  source: text("source").notNull(),
  url: text("url"),
  tags: jsonb("tags").$type<string[]>(),
  urgency: text("urgency").notNull(), // CRITICAL, HIGH, MEDIUM, LOW
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// MAUDE events tracking
export const maudeEvents = pgTable("maude_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: text("source_id").notNull(),
  deviceName: text("device_name").notNull(),
  manufacturer: text("manufacturer"),
  model: text("model"),
  eventType: text("event_type"), // malfunction, injury, death
  eventDescription: text("event_description"),
  dateReceived: date("date_received"),
  severity: integer("severity").default(1), // 1-5 scale
  originalData: jsonb("original_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// openFDA events tracking
export const openfdaEvents = pgTable("openfda_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: text("source_id").notNull(),
  type: text("type").notNull(), // enforcement, recall, shortage
  deviceName: text("device_name"),
  drugName: text("drug_name"),
  manufacturer: text("manufacturer"),
  classification: text("classification"),
  reason: text("reason"),
  status: text("status"),
  reportDate: date("report_date"),
  originalData: jsonb("original_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// CMS PFS changes tracking
export const cmsPfsChanges = pgTable("cms_pfs_changes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cptCode: text("cpt_code").notNull(),
  description: text("description"),
  oldRate: decimal("old_rate", { precision: 10, scale: 2 }),
  newRate: decimal("new_rate", { precision: 10, scale: 2 }),
  changePercent: decimal("change_percent", { precision: 5, scale: 2 }),
  effectiveDate: date("effective_date"),
  originalData: jsonb("original_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
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

// New tables for comprehensive RadIntel CA functionality

// Clinics table - core onboarding data
export const clinics = pgTable("clinics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull().default('CA'),
  zipCode: text("zip_code").notNull(),
  contactEmails: jsonb("contact_emails").$type<string[]>().notNull(),
  timezone: text("timezone").notNull().default('America/Los_Angeles'),
  onboardingStatus: text("onboarding_status").notNull().default('pending'), // pending, devices_added, cpt_added, completed
  payerList: jsonb("payer_list").$type<string[]>(),
  licenseNumbers: jsonb("license_numbers").$type<Record<string, string>>(), // e.g., {"DEA": "123", "CA_LICENSE": "456"}
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Devices table - clinic equipment inventory
export const devices = pgTable("devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").notNull(),
  manufacturer: text("manufacturer").notNull(),
  model: text("model").notNull(),
  serial: text("serial"), // Optional
  catalogCode: text("catalog_code"), // Manufacturer catalog/part number
  modalityType: text("modality_type").notNull(), // CT, MRI, X-Ray, etc.
  dateInstalled: date("date_installed"),
  warrantyExpiry: date("warranty_expiry"),
  lastServiceDate: date("last_service_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// CPT Profiles table - clinic procedure volumes and reimbursements
export const cptProfiles = pgTable("cpt_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").notNull(),
  cptCode: text("cpt_code").notNull(),
  description: text("description").notNull(),
  yearlyVolume: integer("yearly_volume").notNull(),
  avgReimbursement: decimal("avg_reimbursement", { precision: 10, scale: 2 }).notNull(),
  payerMix: jsonb("payer_mix").$type<Record<string, number>>(), // e.g., {"Medicare": 60, "Commercial": 30, "Cash": 10}
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Alerts table - enhanced version of events for clinic-specific alerts
export const clinicAlerts = pgTable("clinic_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id"), // Nullable for system-wide alerts
  type: text("type").notNull(), // device_recall, drug_recall, cms_pfs, regulatory, compliance
  priority: text("priority").notNull(), // CRITICAL, HIGH, MEDIUM, LOW
  source: text("source").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  matchedDeviceId: varchar("matched_device_id"), // Link to specific clinic device
  cptCodes: jsonb("cpt_codes").$type<string[]>(),
  payload: jsonb("payload").notNull(), // Full alert data
  acknowledged: boolean("acknowledged").notNull().default(false),
  acknowledgedAt: timestamp("acknowledged_at"),
  acknowledgedBy: text("acknowledged_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Compliance Items table - track regulatory deadlines and requirements
export const complianceItems = pgTable("compliance_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").notNull(),
  type: text("type").notNull(), // MQSA, RHB, HIPAA, OSHA, DEA, CA_LICENSE
  title: text("title").notNull(),
  description: text("description"),
  dueDate: date("due_date").notNull(),
  lastAction: date("last_action"),
  reminderWindows: jsonb("reminder_windows").$type<number[]>().default([90, 30, 7]), // Days before due date
  status: text("status").notNull().default('pending'), // pending, in_progress, completed, overdue
  relatedDeviceId: varchar("related_device_id"), // If tied to specific equipment
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// News Items table - regulatory news feed
export const newsItems = pgTable("news_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  body: text("body").notNull(),
  source: text("source").notNull(), // FDA, CMS, CA_DOH, ACR, RadBusiness
  url: text("url"),
  tags: jsonb("tags").$type<string[]>().notNull(),
  urgency: text("urgency").notNull(), // CRITICAL, HIGH, MEDIUM, LOW, FYI
  publishedAt: timestamp("published_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// MAUDE Events table - device adverse event reports
export const maudeEvents = pgTable("maude_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mdrReportKey: text("mdr_report_key").notNull().unique(),
  deviceName: text("device_name").notNull(),
  manufacturer: text("manufacturer"),
  model: text("model"),
  eventType: text("event_type"), // malfunction, injury, death
  eventDescription: text("event_description"),
  dateReceived: date("date_received"),
  severity: text("severity"), // HIGH, MEDIUM, LOW
  californiaRelevant: boolean("california_relevant").notNull().default(false),
  processed: boolean("processed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// OpenFDA Events table - FDA enforcement and device data
export const openfdaEvents = pgTable("openfda_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recallNumber: text("recall_number").notNull().unique(),
  productDescription: text("product_description").notNull(),
  recallingFirm: text("recalling_firm"),
  classification: text("classification"), // Class I, II, III
  reasonForRecall: text("reason_for_recall"),
  distributionPattern: text("distribution_pattern"),
  state: text("state"),
  reportDate: date("report_date"),
  processed: boolean("processed").notNull().default(false),
  californiaRelevant: boolean("california_relevant").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// CMS PFS Changes table - track Medicare payment schedule updates
export const cmsPfsChanges = pgTable("cms_pfs_changes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cptCode: text("cpt_code").notNull(),
  description: text("description").notNull(),
  oldRate: decimal("old_rate", { precision: 10, scale: 2 }),
  newRate: decimal("new_rate", { precision: 10, scale: 2 }).notNull(),
  changePercent: decimal("change_percent", { precision: 5, scale: 2 }),
  effectiveDate: date("effective_date").notNull(),
  year: integer("year").notNull(),
  locality: text("locality").default('National'),
  processed: boolean("processed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for new tables
export const insertClinicSchema = createInsertSchema(clinics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeviceSchema = createInsertSchema(devices).omit({
  id: true,
  createdAt: true,
});

export const insertCptProfileSchema = createInsertSchema(cptProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlertSchema = createInsertSchema(clinicAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertComplianceItemSchema = createInsertSchema(complianceItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNewsItemSchema = createInsertSchema(newsItems).omit({
  id: true,
  createdAt: true,
});

// Types for new tables
export type Clinic = typeof clinics.$inferSelect;
export type InsertClinic = z.infer<typeof insertClinicSchema>;

export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;

export type CptProfile = typeof cptProfiles.$inferSelect;
export type InsertCptProfile = z.infer<typeof insertCptProfileSchema>;

export type Alert = typeof clinicAlerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type ComplianceItem = typeof complianceItems.$inferSelect;
export type InsertComplianceItem = z.infer<typeof insertComplianceItemSchema>;

export type NewsItem = typeof newsItems.$inferSelect;
export type InsertNewsItem = z.infer<typeof insertNewsItemSchema>;

export type MaudeEvent = typeof maudeEvents.$inferSelect;
export type OpenfdaEvent = typeof openfdaEvents.$inferSelect;
export type CmsPfsChange = typeof cmsPfsChanges.$inferSelect;
