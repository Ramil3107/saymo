import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import { Pool } from "pg";
import { appEnv } from "../appEnv";
import * as schema from "./schema";
import { sslFor } from "./ssl";

const MAX_CONNECTIONS = 10;

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
  const { DATABASE_URL } = appEnv();
  return new Pool({ connectionString: DATABASE_URL, ssl: sslFor(DATABASE_URL), max: MAX_CONNECTIONS });
}
