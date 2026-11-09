import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Schema } from "./client";
import * as schema from "./schema";

const MIGRATIONS_FOLDER = fileURLToPath(new URL("../../../drizzle", import.meta.url));

export async function createTestDb(): Promise<{ db: PgliteDatabase<Schema>; close(): Promise<void> }> {
  const client = new PGlite();
  const db = drizzle({ client, schema, casing: "snake_case" });

  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });

  return { db, close: () => client.close() };
}
