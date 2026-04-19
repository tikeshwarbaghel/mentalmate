import { pgTable, text, integer, boolean, serial, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const moodEnum = ["happy", "sad", "stressed", "anxious", "calm", "tired"] as const;

export const moodLogsTable = pgTable("mood_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  mood: text("mood").notNull(),
  note: text("note"),
  stressLevel: integer("stress_level"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMoodLogSchema = createInsertSchema(moodLogsTable).omit({ id: true, createdAt: true });
export type InsertMoodLog = z.infer<typeof insertMoodLogSchema>;
export type MoodLog = typeof moodLogsTable.$inferSelect;

export const chatMessagesTable = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  isCrisis: boolean("is_crisis").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessagesTable).omit({ id: true, createdAt: true });
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;

export const wellnessDataTable = pgTable("wellness_data", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  stressLevel: integer("stress_level"),
  bloodPressureSystolic: integer("blood_pressure_systolic"),
  bloodPressureDiastolic: integer("blood_pressure_diastolic"),
  mentalHealthScore: integer("mental_health_score"),
  lastUpdated: timestamp("last_updated"),
});

export const insertWellnessDataSchema = createInsertSchema(wellnessDataTable).omit({ id: true });
export type InsertWellnessData = z.infer<typeof insertWellnessDataSchema>;
export type WellnessData = typeof wellnessDataTable.$inferSelect;

export const activityLogTable = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogTable).omit({ id: true, createdAt: true });
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogTable.$inferSelect;

export const doctorsTable = pgTable("doctors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  specialization: text("specialization").notNull(),
  rating: integer("rating").notNull(),
  reviewCount: integer("review_count").notNull(),
  availability: text("availability").notNull(),
  location: text("location").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  imageUrl: text("image_url"),
  bio: text("bio").notNull(),
  acceptingPatients: boolean("accepting_patients").default(true).notNull(),
});

export type Doctor = typeof doctorsTable.$inferSelect;
