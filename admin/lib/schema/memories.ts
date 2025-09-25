import { date, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const memories = pgTable("memories", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 120 }).notNull(),
  content: text("content").notNull(),
  richText: text("rich_text"),
  coverMediaId: varchar("cover_media_id", { length: 36 }),
  eventDate: date("event_date").notNull(),
  mood: varchar("mood", { length: 32 }),
  location: varchar("location", { length: 120 }),
  tags: text("tags").array().default([]).notNull(),
  people: text("people").array().default([]).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const memoryMedia = pgTable("memory_media", {
  id: varchar("id", { length: 36 }).primaryKey(),
  memoryId: varchar("memory_id", { length: 36 }).notNull().references(() => memories.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 16 }).notNull(),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  altText: varchar("alt_text", { length: 160 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const memoryAnnotations = pgTable("memory_annotations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  memoryId: varchar("memory_id", { length: 36 }).notNull().references(() => memories.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 24 }).notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const memoryInsights = pgTable("memory_insights", {
  id: varchar("id", { length: 36 }).primaryKey(),
  memoryId: varchar("memory_id", { length: 36 }).notNull().references(() => memories.id, { onDelete: "cascade" }),
  summary: text("summary").notNull(),
  highlights: text("highlights").array().default([]).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const memoriesRelations = relations(memories, ({ many }) => ({
  media: many(memoryMedia),
  annotations: many(memoryAnnotations),
  insights: many(memoryInsights)
}));

export const memoryMediaRelations = relations(memoryMedia, ({ one }) => ({
  memory: one(memories, {
    fields: [memoryMedia.memoryId],
    references: [memories.id]
  })
}));

export const memoryAnnotationsRelations = relations(memoryAnnotations, ({ one }) => ({
  memory: one(memories, {
    fields: [memoryAnnotations.memoryId],
    references: [memories.id]
  })
}));

export const memoryInsightsRelations = relations(memoryInsights, ({ one }) => ({
  memory: one(memories, {
    fields: [memoryInsights.memoryId],
    references: [memories.id]
  })
}));
