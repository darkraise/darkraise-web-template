import { test, expect, type Page } from "@playwright/test"
import { BASELINE_STYLES, STYLES } from "./fixtures/theme"
import { collectGarbage, gotoApp, seedApp } from "./helpers/app"
import { openControlFixture } from "./helpers/controls"
import { settle } from "./helpers/measure"

/**
 * The screenshot baseline that style and layout changes are compared against:
 * the app and overlay pages under each baseline style, the showcase pages to
 * full height and the kitchen sink with three accent and surface pairs under
 * every style.
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
  ["analytics", "/analytics", [PIE, AREA, BAR]],
] as const

/** Showcase pages, captured to full height under every style. */
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

const KITCHEN_SINK = "/components/kitchen-sink"

/** Captured to full height, in the default style only. */
const SHELL_STYLES_PAGE = "/components/shell-styles"

const SPLIT_PANEL = "/e2e/fixtures/split-panel.html"

/** Accent on surface: the default pair, a warm pair and the neutral accent. */
const SAMPLE_PAIRS = [
  { name: "blue-zinc", accent: "blue", surface: "zinc" },
  { name: "green-neutral", accent: "green", surface: "neutral" },
  { name: "neutral-stone", accent: "neutral", surface: "stone" },
] as const

const VIEWPORT = { width: 1440, height: 900 }
/** The largest screenshot dimension in Chromium. */
const MAX_HEIGHT = 16384

test.use({
  viewport: VIEWPORT,
  timezoneId: "UTC",
  locale: "en-US",
})

// The font poll waits up to 30s after a page load, so a test needs more than
// the suite's 45s for the poll's own message to fire.
test.describe.configure({ timeout: 90_000 })

/** The faces the app text and code samples use, as `fonts.load` specs. */
const FACES = [
  '400 1em "Inter Variable"',
  '500 1em "Inter Variable"',
  '600 1em "Inter Variable"',
  '700 1em "Inter Variable"',
  '400 1em "JetBrains Mono Variable"',
  '500 1em "JetBrains Mono Variable"',
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
async function fitContent(page: Page, path: string) {
  const main = page.locator("#main-content")
  const overflow = await main.evaluate(
    (el) => el.scrollHeight - el.clientHeight,
  )
  const height = VIEWPORT.height + overflow
  if (height > MAX_HEIGHT) {
    throw new Error(
      `${path} is ${height}px tall, above the ${MAX_HEIGHT}px capture cap`,
    )
  }
  if (overflow > 0) {
    await page.setViewportSize({ width: VIEWPORT.width, height })
  }
  // A clipped page would record without failing.
  await expect
    .poll(() => main.evaluate((el) => el.scrollHeight - el.clientHeight), {
      message: `${path} main region overflow in px`,
    })
    .toBeLessThanOrEqual(0)
}

/**
 * `threshold` is the per-pixel colour distance (0 to 1) below which two pixels
 * count as equal; Playwright defaults it to 0.2 when it is left out.
 */
async function capture(page: Page, name: string, threshold?: number) {
  await waitForFonts(page)
  await expect(page.locator(".dr-skeleton")).toHaveCount(0)
  await page.mouse.move(0, 0)
  await settle(page)
  await expect(page).toHaveScreenshot(`${name}.png`, {
    animations: "disabled",
    caret: "hide",
    ...(threshold === undefined ? {} : { threshold }),
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
    const page = await context.newPage()
    await seedApp(page, { style: "quiet", mode: "light" })
    const paths = [
      ...APP_PAGES.map(([, path]) => path),
      ...SHOWCASE_PAGES.map(([, path]) => path),
      KITCHEN_SINK,
      SHELL_STYLES_PAGE,
      SPLIT_PANEL,
      "/e2e/fixtures/baseline-overlays.html?show=dialog",
    ]
    // Uncollected garbage from earlier routes fails a later navigation with
    // ERR_INSUFFICIENT_RESOURCES, as gotoApp guards against.
    for (const path of paths) {
      await collectGarbage(page)
      await page.goto(path, { waitUntil: "networkidle", timeout: 45_000 })
    }
  } finally {
    await context.close()
  }
})

for (const style of BASELINE_STYLES) {
  for (const mode of MODES) {
    test.describe(`${style} · ${mode}`, () => {
      test.beforeEach(async ({ page }) => {
        await seedApp(page, { style, mode })
      })

      for (const [name, path, ready] of APP_PAGES) {
        test(name, async ({ page }) => {
          await gotoApp(page, path)
          await expect(page.locator(".dr-page-header-title")).toBeVisible()
          for (const marker of ready) {
            await expect(page.locator(marker).first()).toBeVisible()
          }
          await expect(page.getByText("Loading order…")).toHaveCount(0)
          await expect(page.locator(".dr-skeleton")).toHaveCount(0)
          await waitForFonts(page)
          await fitContent(page, path)
          await capture(page, `${style}-${mode}-${name}`)
        })
      }

      // The split panel is its own scrollport, so its fill has to stay put
      // while the panel scrolls.
      test("split panel scrolled", async ({ page }) => {
        await page.goto(SPLIT_PANEL)
        await expect(page.locator("html")).toHaveAttribute("data-style", style)
        const panel = page.locator('.dr-shell > [data-region="panel"]')
        await expect(panel.getByText("Thread 40")).toBeAttached()
        const overflow = await panel.evaluate(
          (el) => el.scrollHeight - el.clientHeight,
        )
        expect(overflow, "panel overflow in px").toBeGreaterThan(0)
        await panel.evaluate((el) => {
          el.scrollTop = el.scrollHeight
        })
        await capture(page, `${style}-${mode}-split-panel-scrolled`)
      })

      for (const [name, selector] of OVERLAYS) {
        test(`overlay ${name}`, async ({ page }) => {
          await page.goto(`/e2e/fixtures/baseline-overlays.html?show=${name}`)
          await expect(page.locator("html")).toHaveAttribute(
            "data-style",
            style,
          )
          await expect(page.locator(selector).first()).toBeVisible()
          await capture(page, `${style}-${mode}-overlay-${name}`)
        })
      }
    })
  }
}

// Flat and Tactile restyle controls the showcase pages hold, so these run
// under every style, not only the baseline ones.
for (const style of STYLES) {
  for (const mode of MODES) {
    test.describe(`showcase · ${style} · ${mode}`, () => {
      test.beforeEach(async ({ page }) => {
        await seedApp(page, { style, mode })
      })

      for (const [name, path] of SHOWCASE_PAGES) {
        test(name, async ({ page }) => {
          await gotoApp(page, path)
          // Routes are code-split: the shell paints before the page module.
          await expect(page.locator(".dr-page-header-title")).toBeVisible()
          await expect(page.locator(".dr-skeleton")).toHaveCount(0)
          await waitForFonts(page)
          await fitContent(page, path)
          await capture(page, `${style}-${mode}-${name}`)
        })
      }
    })
  }
}

for (const mode of MODES) {
  test(`shell styles · quiet · ${mode}`, async ({ page }) => {
    await seedApp(page, { style: "quiet", mode })
    await gotoApp(page, SHELL_STYLES_PAGE)
    await expect(page.locator(".dr-page-header-title")).toBeVisible()
    await waitForFonts(page)
    await fitContent(page, SHELL_STYLES_PAGE)
    // The placeholder lines sit about 0.11 from their ground in either mode,
    // under the default threshold, so a moved or missing line would pass.
    await capture(page, `quiet-${mode}-shell-styles`, 0.05)
  })
}

for (const style of STYLES) {
  for (const mode of MODES) {
    for (const pair of SAMPLE_PAIRS) {
      test(`kitchen sink · ${style} · ${mode} · ${pair.name}`, async ({
        page,
      }) => {
        await seedApp(page, {
          style,
          mode,
          accent: pair.accent,
          surface: pair.surface,
        })
        await gotoApp(page, KITCHEN_SINK)
        await expect(page.locator(".dr-page-header-title")).toBeVisible()
        await expect(page.getByLabel("Focused field")).toBeFocused()
        // A clipped page would record without failing, so check the fit first.
        const overflow = await page
          .locator("#main-content")
          .evaluate((main) => main.scrollHeight - main.clientHeight)
        expect(overflow, "main region overflow in px").toBeLessThanOrEqual(0)
        await capture(page, `kitchen-sink-${style}-${mode}-${pair.name}`)
      })
    }
  }
}

/**
 * The sidebar's active row: Auto under every style in both modes, and each
 * explicit look on Quiet light.
 */
const SIDEBAR_CASES = [
  ...STYLES.flatMap((style) =>
    MODES.map((mode) => ({ style, mode, look: "auto" as const })),
  ),
  ...(["chip", "pill", "tile", "frosted"] as const).map((look) => ({
    style: "quiet" as const,
    mode: "light" as const,
    look,
  })),
]

for (const { style, mode, look } of SIDEBAR_CASES) {
  test(`sidebar selection · ${look} · ${style} · ${mode}`, async ({ page }) => {
    await seedApp(page, { style, mode, sidebarSelection: look })
    await gotoApp(page, "/orders")
    const rail = page.locator(".dr-sidebar-layout-aside")
    await expect(
      rail.locator(".dr-sidebar-nav[data-indicator='ready']"),
    ).toHaveCount(1)
    // The file's own guard: a crop must not record fallback fonts.
    await waitForFonts(page)
    await page.mouse.move(0, 0)
    await settle(page)
    await expect(rail).toHaveScreenshot(
      `sidebar-selection-${look}-${style}-${mode}.png`,
    )
  })
}

/** The angle slider's round knob on its dial, at 45°. */
for (const style of BASELINE_STYLES) {
  for (const mode of MODES) {
    test(`angle slider knob · ${style} · ${mode}`, async ({ page }) => {
      await seedApp(page, { style, mode })
      await openControlFixture(page)
      await page.mouse.move(0, 0)
      await settle(page)
      await expect(
        page.locator('[data-probe="angle"] .dr-angle-slider'),
      ).toHaveScreenshot(`angle-slider-knob-${style}-${mode}.png`, {
        animations: "disabled",
      })
    })
  }
}

/**
 * The Kbd keycap on the page canvas. The computed-style test proves the
 * bottom edge's colour; only a picture shows the key still reads as a key.
 */
for (const style of BASELINE_STYLES) {
  for (const mode of MODES) {
    test(`kbd keycap · ${style} · ${mode}`, async ({ page }) => {
      await seedApp(page, { style, mode })
      await openControlFixture(page)
      await waitForFonts(page)
      await page.mouse.move(0, 0)
      await settle(page)
      await expect(page.locator('[data-probe="kbd"]')).toHaveScreenshot(
        `kbd-${style}-${mode}.png`,
        { animations: "disabled" },
      )
    })
  }
}

test.describe("login decoration", () => {
  test("glass · dark", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await seedApp(
      page,
      { style: "glass", mode: "dark" },
      { authenticated: false },
    )
    await gotoApp(page, "/login")
    const decor = page.locator("[data-auth-decor]")
    await expect(decor).toBeVisible()
    await settle(page)
    await expect(decor).toHaveScreenshot("glass-dark-login-decor.png", {
      animations: "disabled",
    })
  })
})
