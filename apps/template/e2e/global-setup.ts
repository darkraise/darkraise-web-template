import { chromium, type FullConfig, type Page } from "@playwright/test"
import { COMPONENT_ROUTES } from "./fixtures/component-routes"
import { collectGarbage, seedApp } from "./helpers/app"

const GUEST_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]

const APP_ROUTES = [
  "/",
  "/analytics",
  "/products",
  "/products/new",
  "/products/prod-1/edit",
  "/categories",
  "/orders",
  "/orders/ord-1",
  "/customers",
  "/customers/cust-1",
  "/settings",
  "/inbox",
  "/components",
]

const FIXTURES = [
  "baseline-overlays",
  "control-contract",
  "controls-behaviour",
  "forced-colors",
  "overlay-geometry",
  "rtl",
  "selection-overlays",
  "split-panel",
  "virtual-table",
].map((name) => `/e2e/fixtures/${name}.html`)

async function visit(page: Page, path: string) {
  // A failed load only costs the warm-up of that route, and global setup has
  // no retry, so one dropped request must not stop the whole run.
  try {
    await collectGarbage(page)
    await page.goto(path, { waitUntil: "networkidle", timeout: 45_000 })
  } catch (error) {
    const reason = error instanceof Error ? error.message.split("\n")[0] : error
    console.warn(`globalSetup: warm-up of ${path} failed: ${reason}`)
  }
}

/**
 * Vite transforms a route chunk only when the router first imports it, so a
 * cold dev server spends the first tests compiling instead of rendering.
 * Plain HTTP requests would not help: every route serves the same index.html.
 * One browser page walks every route once instead.
 */
export default async function globalSetup(config: FullConfig) {
  if (process.env.E2E_WARM !== "1") return
  const baseURL = config.projects[0]?.use.baseURL
  if (!baseURL) throw new Error("globalSetup: no baseURL in the config")
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ baseURL })
    for (const path of GUEST_ROUTES) await visit(page, path)
    // Guest routes redirect a signed-in user, so auth is seeded after them.
    await seedApp(page)
    for (const path of [
      ...APP_ROUTES,
      ...COMPONENT_ROUTES.map((route) => route.path),
      ...FIXTURES,
    ]) {
      await visit(page, path)
    }
  } finally {
    await browser.close()
  }
}
