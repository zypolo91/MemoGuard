import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/schema",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://user:password@localhost:5432/memoguard"
  }
});

