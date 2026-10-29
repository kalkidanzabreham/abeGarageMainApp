// Regression tests for the bugs found in the Phase 1 browser walkthrough,
// plus the role, login, Demo and tampered-token checks.
// Runs against a PRODUCTION build (vite build + vite preview), because some
// bugs (deep-link reload with relative asset URLs) only exist there.
//
// Locally:  npm --prefix ../frontend run build && npm test
//   (backend on :5000 with CORS_ORIGINS including http://localhost:4173;
//    set PW_CHANNEL=chrome to use an installed Chrome instead of
//    Playwright's Chromium)
const { defineConfig } = require("@playwright/test");

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:4173";

module.exports = defineConfig({
  testDir: "./tests",
  // tests share one database and change it, so run them one at a time
  workers: 1,
  fullyParallel: false,
  // no automatic retries: a flaky test should be visible, not hidden
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  globalSetup: require.resolve("./global-setup.js"),
  use: {
    baseURL: BASE_URL,
    channel: process.env.PW_CHANNEL || undefined,
    viewport: { width: 1400, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      // the backend must already be configured through env vars / .env
      command: "npm --prefix ../backend start",
      // 401 without a token counts as "up" (Playwright accepts 2xx-3xx, 400-403)
      url: "http://localhost:5000/api/services",
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: "npm --prefix ../frontend run preview -- --port 4173 --strictPort",
      url: BASE_URL,
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
