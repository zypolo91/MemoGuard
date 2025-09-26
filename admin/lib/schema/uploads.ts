import { bigint, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const uploadRecords = pgTable("upload_records", {
  id: varchar("id", { length: 36 }).primaryKey(),
  bucket: varchar("bucket", { length: 64 }).notNull(),
  path: text("path").notNull(),
  url: text("url").notNull(),
  mimeType: varchar("mime_type", { length: 128 }).notNull(),
  size: bigint("size", { mode: "number" }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
