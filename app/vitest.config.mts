import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Stage 20 section 33: Vitest for unit tests -- matching logic, validation,
// state transitions, permission helpers. Playwright (separate config) owns
// browser/e2e. This config keeps them apart: only tests/unit/**.
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    globals: true,
    setupFiles: ["tests/unit/setup.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
