import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";
import { databaseUrl } from "./src/lib/appEnv";
import { credentialsFrom } from "./src/lib/db/credentials";

if (existsSync(".env")) {
  process.loadEnvFile();
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  casing: "snake_case",
  dbCredentials: credentialsFrom(databaseUrl()),
});
