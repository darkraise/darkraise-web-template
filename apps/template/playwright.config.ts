import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  /* The visual baseline records committed screenshots; it runs only when
     asked (`pnpm test:e2e:visual`). */
  testIgnore: process.env.BASELINE ? [] : ["**/18-baseline.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  /* One local retry: on a host where Docker containers come and go, each
     veth change makes Chromium abort in-flight requests with
     net::ERR_NETWORK_CHANGED, and a page whose module load was cut never
     renders. Retried passes are still reported as flaky. */
  retries: process.env.CI ? 2 : 1,
  /* The suite drives a single Vite dev server; past ~4 workers its module
     transform queue becomes the bottleneck and tests time out on cold routes
     rather than on real defects. */
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? [["github"], ["html"]] : "html",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:5176",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5176",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
