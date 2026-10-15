import { defineConfig, devices } from "@playwright/test"

const baselineIgnore = process.env.BASELINE ? [] : ["**/18-baseline.spec.ts"]
const mobileSpec = "**/21-mobile-layout.spec.ts"
/* The control anatomy specs also run on touch, where only their 24px
   hit-area cases differ: the mobile project keeps those, tagged @touch. */
const anatomySpecs = [
  "**/61-button-anatomy.spec.ts",
  "**/62-switch-anatomy.spec.ts",
  "**/63-check-anatomy.spec.ts",
  "**/66-slider-anatomy.spec.ts",
]
/* A flake that passes on retry leaves no trace under on-first-retry, so its
   cause is lost. E2E_TRACE=1 (and CI) keep the trace of the first failed
   attempt instead; local runs stay cheap by default. */
const traceFirstFailure = process.env.E2E_TRACE === "1" || !!process.env.CI
/* E2E_PORT lets runs from several worktrees each own a dev server; the
   default matches vite.config.ts, so a server started by hand is reused. */
const port = Number(process.env.E2E_PORT ?? 5176)
const origin = `http://localhost:${port}`

export default defineConfig({
  testDir: "./e2e",
  /* The visual baseline records committed screenshots; it runs only when
     asked (`pnpm test:e2e:visual`). */
  testIgnore: baselineIgnore,
  /* With E2E_WARM=1 (the test:e2e script) one page visits every route first,
     so Vite has compiled each route before the tests time their loads. */
  globalSetup: "./e2e/global-setup.ts",
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
    baseURL: origin,
    trace: traceFirstFailure ? "retain-on-first-failure" : "on-first-retry",
    screenshot: "only-on-failure",
  },
  /* A project's testIgnore replaces the top-level one, so the baseline
     exclusion is repeated here. */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: [...baselineIgnore, mobileSpec],
    },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
      testMatch: [mobileSpec, ...anatomySpecs],
      grep: [/21-mobile-layout/, /@touch/],
    },
  ],
  webServer: {
    command: `pnpm dev --port ${port} --strictPort`,
    url: origin,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
