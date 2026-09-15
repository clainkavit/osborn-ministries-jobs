import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// M10 seed-driver-only Playwright config. Does NOT replace or modify
// playwright.config.ts (which stays untouched, scoped to tests/e2e/ and
// used by every M1-M9 regression run). This file exists solely so
// scripts/seed/seed-members.spec.ts and seed-applications.spec.ts --
// deliberately kept OUTSIDE tests/e2e/ so neither can ever be swept into
// a regression run -- can still be invoked directly:
//
//   npx playwright test --config=scripts/seed/playwright.seed.config.ts
//   npx playwright test --config=scripts/seed/playwright.seed.config.ts --grep "app-seed"
//
// Same .env.local loading and APP_URL resolution as the main config.

try {
  const envText = readFileSync(join(__dirname, "../../.env.local"), "utf8");
  for (const line of envText.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  // no .env.local
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./",
  testMatch: ["seed-members.spec.ts", "seed-applications.spec.ts"],
  fullyParallel: false,
  timeout: 240000,
  expect: { timeout: 90000 },
  reporter: "list",
  use: {
    baseURL: APP_URL,
    trace: "on-first-retry",
    navigationTimeout: 60000,
    proxy: process.env.HTTP_PROXY
      ? { server: process.env.HTTP_PROXY, bypass: "localhost,127.0.0.1,<-loopback>" }
      : undefined,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
