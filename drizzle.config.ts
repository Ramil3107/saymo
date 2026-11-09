import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";
import { z } from "zod";
import { sslFor } from "./src/lib/db/ssl";

if (existsSync(".env")) {
  process.loadEnvFile();
}

const url = z.url().parse(process.env.DATABASE_URL);

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  casing: "snake_case",
  dbCredentials: { url, ssl: sslFor(url) },
});
