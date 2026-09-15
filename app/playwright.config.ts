import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Stage 20 section 33 / Stage 21 section 30. Browser acceptance tests for the
// M1 journeys. These require:
//   1. A real Supabase project connected via .env.local (Stage 21 section 5)
//   2. Migration 001 applied to that project
//   3. `npm run build && npm run start` (or dev) serving on APP_URL
// They are the FINAL AUTHORITY on whether M1 is done (Stage 21 section 30).

// Playwright (unlike Next.js) does not auto-load .env.local. Load it here so
// the spec's HAS_SUPABASE guard and any *_ADMIN_* vars are visible.
// (This config is loaded as CommonJS by Playwright -- __dirname is available.)
try {
  const envText = readFileSync(join(__dirname, ".env.local"), "utf8");
  for (const line of envText.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  // no .env.local -- the spec's HAS_SUPABASE guard will skip the suite
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  // Cold Supabase connections + RSC renders that touch several tables can
  // take a few seconds; give navigation assertions headroom over the 5s
  // default. This environment's network path to Supabase runs slower than
  // typical (confirmed by the user directly, not just automated timing), so
  // these are generous rather than tuned to a fast connection. A single
  // overall test timeout (90s) bounds the worst case per test.
  expect: { timeout: 90000 },
  timeout: 240000,
  use: {
    baseURL: APP_URL,
    trace: "on-first-retry",
    navigationTimeout: 60000,
    // This sandbox exports HTTP_PROXY/HTTPS_PROXY globally. Routing the
    // local app's own traffic through that proxy adds overhead and appears
    // to trigger aborted/retried Server Action streams ("the destination
    // stream closed early"). The app itself is fast (a direct curl to
    // /register resolves in ~6ms); bypass the proxy for loopback explicitly.
    proxy: process.env.HTTP_PROXY
      ? { server: process.env.HTTP_PROXY, bypass: "localhost,127.0.0.1,<-loopback>" }
      : undefined,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    // Stage 21 section 30 responsive targets.
    { name: "mobile-360", use: { ...devices["Pixel 5"], viewport: { width: 360, height: 800 } } },
    { name: "mobile-390", use: { ...devices["iPhone 12"] } },
  ],
});
