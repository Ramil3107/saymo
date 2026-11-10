import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import { Pool } from "pg";
import { databaseUrl } from "../appEnv";
import * as schema from "./schema";
import { sslFor } from "./ssl";

const MAX_CONNECTIONS = 10;
const CONNECTION_TIMEOUT_MS = 10_000;

declare global {
  var saymoPool: Pool | undefined;
}

export type Schema = typeof schema;
export type Database = NodePgDatabase<Schema> | PgliteDatabase<Schema>;

export const db = drizzle({ client: sharedPool(), schema, casing: "snake_case" });

function sharedPool(): Pool {
  if (globalThis.saymoPool) {
    return globalThis.saymoPool;
  }
  const pool = createPool();
  if (process.env.NODE_ENV !== "production") {
    globalThis.saymoPool = pool;
  }
  return pool;
}

function createPool(): Pool {
  const url = databaseUrl();
  const pool = new Pool({
    connectionString: url,
    ssl: sslFor(url),
    max: MAX_CONNECTIONS,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
  });
  pool.on("error", (error) => console.error("Idle database connection failed:", error.message));
  return pool;
}
