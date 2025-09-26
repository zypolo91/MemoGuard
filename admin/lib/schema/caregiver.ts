import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const caregiverProfile = pgTable("caregiver_profile", {
  id: varchar("id", { length: 36 }).primaryKey(),
  fullName: varchar("full_name", { length: 120 }).notNull(),
  avatarUrl: text("avatar_url"),
  streak: varchar("streak", { length: 32 }),
  bio: text("bio"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const caregiverPreferences = pgTable("caregiver_preferences", {
  id: varchar("id", { length: 36 }).primaryKey(),
  caregiverId: varchar("caregiver_id", { length: 36 }).notNull().references(() => caregiverProfile.id, { onDelete: "cascade" }),
  notificationDailyDigest: boolean("notification_daily_digest").default(true).notNull(),
  notificationNews: boolean("notification_news").default(true).notNull(),
  notificationTasks: boolean("notification_tasks").default(true).notNull(),
  language: varchar("language", { length: 16 }).default("zh-CN").notNull(),
  theme: varchar("theme", { length: 16 }).default("auto").notNull(),
  followedTopics: text("followed_topics").array().default([]).notNull()
});
export const caregiverProfileRelations = relations(caregiverProfile, ({ many }) => ({
  preferences: many(caregiverPreferences)
}));

export const caregiverPreferencesRelations = relations(caregiverPreferences, ({ one }) => ({
  caregiver: one(caregiverProfile, {
    fields: [caregiverPreferences.caregiverId],
    references: [caregiverProfile.id]
  })
}));
