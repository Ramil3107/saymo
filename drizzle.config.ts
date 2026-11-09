import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";
import { z } from "zod";
import { sslFor } from "./src/lib/db/ssl";

if (existsSync(".env")) {
  process.loadEnvFile();
}

const url = z.object({ DATABASE_URL: z.url() }).parse(process.env).DATABASE_URL;

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  casing: "snake_case",
  dbCredentials: credentialsFrom(url),
});

// drizzle-kit drops `ssl` when given a bare url, so the parts are passed separately
function credentialsFrom(databaseUrl: string) {
  const parsed = new URL(databaseUrl);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || undefined,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.slice(1),
    ssl: sslFor(databaseUrl),
  };
}
