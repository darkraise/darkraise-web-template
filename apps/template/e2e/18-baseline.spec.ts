import { test, expect, type BrowserContext, type Page } from "@playwright/test"
import { PRESETS } from "./fixtures/theme"
import { gotoApp, seedApp } from "./helpers/app"
import { settle } from "./helpers/measure"

/**
 * The screenshot baseline the phase 3 and 4 restyles are compared against.
 * Runs only with BASELINE set (playwright.config.ts): compare with
 * `pnpm test:e2e:visual`, re-record with `--update-snapshots`. The images
 * are Linux Chromium renders from the pinned Playwright; a Playwright upgrade
 * re-records them.
 */

const MODES = ["light", "dark"] as const

/**
 * Drawn chart series, present only once the demo data behind them has
 * arrived. A page waits for every kind it renders: its data hooks resolve
 * after separate random delays, and one static series would otherwise mark
 * the page ready while the others are still empty.
 */
const AREA = ".recharts-area-area"
const BAR = ".recharts-bar-rectangle"
const LINE = ".recharts-line-curve"
const PIE = ".recharts-pie-sector"

/**
 * App pages, captured to the full height of their scrolling main region,
 * each with the elements that exist only once its data has loaded.
 */
const APP_PAGES = [
  ["dashboard", "/", [AREA, BAR]],
  ["orders", "/orders", ["tbody tr td"]],
  ["order-detail", "/orders/ord-1", [".dr-card-title"]],
  ["settings", "/settings", [".dr-card-title"]],
  ["analytics", "/analytics", [LINE, PIE, AREA, BAR]],
] as const

/** Showcase pages, captured at the viewport. */
const SHOWCASE_PAGES = [
  ["buttons", "/components/buttons"],
  ["inputs", "/components/inputs"],
  ["checkbox", "/components/checkbox"],
  ["tabs", "/components/tabs"],
  ["badges", "/components/badges"],
  ["data-table", "/components/data-table"],
] as const

const OVERLAYS = [
  ["dialog", '[role="dialog"]'],
  ["menu", '[role="menu"]'],
  ["popover", ".dr-popover-content"],
] as const

const VIEWPORT = { width: 1440, height: 900 }
const MAX_HEIGHT = 4000

test.use({
  viewport: VIEWPORT,
  timezoneId: "UTC",
  locale: "en-US",
  reducedMotion: "reduce",
})

interface CachedFont {
  headers: Record<string, string>
  body: Buffer
}

const FONT_HOSTS = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//
const fontCache = new Map<string, CachedFont>()

/**
 * Google Fonts is the only network the captured pages depend on. A slow
 * request holds the app's first paint and a failed one leaves a fallback face
 * in the image, so each font URL is fetched once, retried on failure, and
 * replayed from memory.
 */
async function serveFontsFromCache(context: BrowserContext) {
  await context.route(FONT_HOSTS, async (route) => {
    const url = route.request().url()
    let font = fontCache.get(url)
    for (let attempt = 0; !font && attempt < 3; attempt++) {
      const response = await route.fetch({ timeout: 15_000 }).catch(() => null)
      if (response?.ok()) {
        const headers = Object.fromEntries(
          Object.entries(response.headers()).filter(
            ([name]) =>
              name !== "content-encoding" && name !== "content-length",
          ),
        )
        font = { headers, body: await response.body() }
      }
    }
    if (!font) return route.abort()
    fontCache.set(url, font)
    return route.fulfill({
      status: 200,
      headers: font.headers,
      body: font.body,
    })
  })
}

/** The faces the app text and code samples use, as `fonts.load` specs. */
const FACES = [
  "400 1em Inter",
  "500 1em Inter",
  "600 1em Inter",
  "700 1em Inter",
  '400 1em "JetBrains Mono"',
]

/**
 * True once every face in FACES has loaded. `document.fonts.check` alone
 * answers true when the stylesheet never arrived, which would record a
 * fallback font. A face loads on first use and `fonts.ready` can resolve
 * before that starts, so each is requested here rather than waited for.
 */
async function fontsLoaded(page: Page): Promise<boolean> {
  return page.evaluate(async (faces) => {
    const loaded = await Promise.all(
      faces.map(async (face) => {
        const found = await document.fonts.load(face).catch(() => [])
        return found.length > 0 && found.every((f) => f.status === "loaded")
      }),
    )
    return loaded.every(Boolean)
  }, FACES)
}

/** Fails, rather than records, a page drawn in a fallback face. */
async function waitForFonts(page: Page) {
  await expect
    .poll(() => fontsLoaded(page), {
      message: "Inter and JetBrains Mono must load before recording",
      timeout: 30_000,
    })
    .toBe(true)
}

/** Grows the viewport so the app shell's scrolling region shows whole. */
async function fitContent(page: Page) {
  const overflow = await page
    .locator("#main-content")
    .evaluate((main) => main.scrollHeight - main.clientHeight)
  if (VIEWPORT.height + overflow > MAX_HEIGHT) {
    throw new Error(`main region needs ${VIEWPORT.height + overflow}px`)
  }
  if (overflow > 0) {
    await page.setViewportSize({
      width: VIEWPORT.width,
      height: VIEWPORT.height + overflow,
    })
  }
}

async function capture(page: Page, name: string) {
  await waitForFonts(page)
  await expect(page.locator(".dr-skeleton")).toHaveCount(0)
  await page.mouse.move(0, 0)
  await settle(page)
  await expect(page).toHaveScreenshot(`${name}.png`, {
    animations: "disabled",
    caret: "hide",
  })
}

/**
 * Vite compiles a route on its first request, which can outlast gotoApp's
 * wait for the app shell. Visiting every captured route once first keeps that
 * cost out of the captures.
 */
test.beforeAll(async ({ browser }) => {
  test.setTimeout(600_000)
  const context = await browser.newContext({ viewport: VIEWPORT })
  try {
    await serveFontsFromCache(context)
    const page = await context.newPage()
    await seedApp(page, { preset: "default", mode: "light" })
    const paths = [
      ...APP_PAGES.map(([, path]) => path),
      ...SHOWCASE_PAGES.map(([, path]) => path),
      "/e2e/fixtures/baseline-overlays.html?show=dialog",
    ]
    for (const path of paths) {
      await page.goto(path, { waitUntil: "networkidle", timeout: 60_000 })
    }
  } finally {
    await context.close()
  }
})

for (const preset of PRESETS) {
  for (const mode of MODES) {
    test.describe(`${preset} · ${mode}`, () => {
      test.beforeEach(async ({ page }) => {
        await serveFontsFromCache(page.context())
        await seedApp(page, { preset, mode })
      })

      for (const [name, path, ready] of APP_PAGES) {
        test(name, async ({ page }) => {
          await gotoApp(page, path)
          await expect(page.locator(".dr-page-header-title")).toBeVisible()
          for (const marker of ready) {
            await expect(page.locator(marker).first()).toBeVisible()
          }
          await expect(page.getByText("Loading order...")).toHaveCount(0)
          await expect(page.locator(".dr-skeleton")).toHaveCount(0)
          await waitForFonts(page)
          await fitContent(page)
          await capture(page, `${preset}-${mode}-${name}`)
        })
      }

      for (const [name, path] of SHOWCASE_PAGES) {
        test(name, async ({ page }) => {
          await gotoApp(page, path)
          // Routes are code-split: the shell paints before the page module.
          await expect(page.locator(".dr-page-header-title")).toBeVisible()
          await capture(page, `${preset}-${mode}-${name}`)
        })
      }

      for (const [name, selector] of OVERLAYS) {
        test(`overlay ${name}`, async ({ page }) => {
          await page.goto(`/e2e/fixtures/baseline-overlays.html?show=${name}`)
          await expect(page.locator("html")).toHaveAttribute(
            "data-preset",
            preset,
          )
          await expect(page.locator(selector).first()).toBeVisible()
          await capture(page, `${preset}-${mode}-overlay-${name}`)
        })
      }
    })
  }
}
