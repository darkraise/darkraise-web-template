import { readdirSync, statfsSync } from "node:fs"
import { tmpdir } from "node:os"
import { chromium, type FullConfig, type Page } from "@playwright/test"
import { APP_ROUTES, GUEST_ROUTES } from "./fixtures/app-routes"
import { COMPONENT_ROUTES } from "./fixtures/component-routes"
import { collectGarbage, seedApp } from "./helpers/app"

/** Every standalone fixture page, so a new one is warmed without a list edit. */
const FIXTURES = readdirSync(new URL("./fixtures/", import.meta.url))
  .filter((name) => name.endsWith(".html"))
  .sort()
  .map((name) => `/e2e/fixtures/${name}`)

/**
 * Chromium writes its temporary files under TMPDIR and crashes on every
 * navigation once that fills, which surfaces as pages whose app never mounts.
 * Failing here names the cause instead.
 */
function assertTempSpace() {
  const dir = tmpdir()
  const { bavail, bsize } = statfsSync(dir)
  const free = bavail * bsize
  if (free < 1024 ** 3) {
    throw new Error(
      `globalSetup: ${dir} has ${Math.floor(free / 1024 ** 2)} MiB free, under 1 GiB. ` +
        'Point TMPDIR at a directory on disk; see "Keep temporary files on disk" in e2e/README.md.',
    )
  }
}

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
  assertTempSpace()
  if (process.env.E2E_WARM !== "1") return
  const baseURL = config.projects[0]?.use.baseURL
  if (!baseURL) throw new Error("globalSetup: no baseURL in the config")
  console.log(`globalSetup: warming fixtures ${FIXTURES.join(", ")}`)
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
