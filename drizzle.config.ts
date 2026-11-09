import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";
import { z } from "zod";
import { credentialsFrom } from "./src/lib/db/credentials";

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
