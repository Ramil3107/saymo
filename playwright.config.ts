import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://localhost:3000";
const SERVER_START_TIMEOUT_MS = 120_000;

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: SERVER_START_TIMEOUT_MS,
  },
});
