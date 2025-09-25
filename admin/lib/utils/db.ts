import { db } from "../db";

export function getDb() {
  if (!db) {
    throw new Error("Database connection is not initialized. Set DATABASE_URL before invoking DB operations.");
  }
  return db;
}
