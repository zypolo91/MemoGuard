import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __memoGuardPgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __memoGuardDb: NodePgDatabase<typeof schema> | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL is not set. Database connections will fail until it is configured.");
}

function createPool() {
  if (!connectionString) return undefined;
  const pool = new Pool({ connectionString });
  pool.on("error", (error) => {
    console.error("Postgres connection error", error);
  });
  return pool;
}

const pool = globalThis.__memoGuardPgPool ?? createPool();
if (pool && !globalThis.__memoGuardPgPool) {
  globalThis.__memoGuardPgPool = pool;
}

const database = globalThis.__memoGuardDb ?? (pool ? drizzle(pool, { schema }) : undefined);
if (database && !globalThis.__memoGuardDb) {
  globalThis.__memoGuardDb = database;
}

export const db = database;
