import { boolean, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const insightArticles = pgTable("insight_articles", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  source: varchar("source", { length: 120 }),
  summary: text("summary"),
  topic: varchar("topic", { length: 64 }),
  contentUrl: text("content_url"),
  isBookmarked: boolean("is_bookmarked").default(false).notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
