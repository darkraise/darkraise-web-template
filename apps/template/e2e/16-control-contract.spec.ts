import { test, expect, type Locator, type Page } from "@playwright/test"
import { DENSITIES, PRESETS } from "./fixtures/theme"
import { boxOf, gotoApp, seedApp, watchConsole } from "./helpers/app"
import {
  computed,
  contrast,
  minContrastOver,
  pixel,
  rgbOf,
  settle,
} from "./helpers/measure"

/**
 * The control contract: every button and field sits at --control-height, at
 * every density and font size, in both modes and under both presets; on a
 * coarse pointer they floor at --control-height-xl; and a field's bottom edge
 * reaches 3:1 against what it sits on (WCAG 1.4.11).
 *
 * Heights are compared against probe elements sized with the tokens rather
 * than hard-coded pixels, because --control-scale moves them with the
 * font-size axis.
 */

const FIXTURE = "/e2e/fixtures/control-contract.html"
const MODES = ["light", "dark"] as const
const FONT_SIZES = ["medium", "extra-large"] as const

const SIZED = [
  '[data-probe="buttons"] .dr-btn',
  '[data-probe="toggles"] .dr-toggle',
  '[data-probe="input"] .dr-input',
  '[data-probe="select"] .dr-select-trigger',
  '[data-probe="combobox"] .dr-combobox-control',
  '[data-probe="multi-select"] .dr-multi-select-control',
  '[data-probe="date-input"] .dr-date-input',
  '[data-probe="number-input"] .dr-number-input-control',
  '[data-probe="otp"] .dr-input-otp-slot',
  '[data-probe="segment"] .dr-segment-group-item',
]

async function openFixture(page: Page) {
  await page.goto(FIXTURE)
  await page.getByTestId("control-height").waitFor({ state: "attached" })
  await page
    .locator('[data-probe="segment"] .dr-segment-group-item')
    .first()
    .waitFor()
  // The fixture paints the light fallback before ThemeProvider applies the
  // seeded theme, so colours are still transitioning when the controls first
  // appear; a pixel sampled then is a blend of the two themes. Wait for the
  // theme, give its transitions a frame to start, then let them finish (a
  // transition cut short by a later style change rejects, which is fine).
  await expect(page.locator("html")).toHaveAttribute("data-preset", /.+/)
  await page.evaluate(async () => {
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    )
    await Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation instanceof CSSTransition)
        .map((animation) => animation.finished.catch(() => undefined)),
    )
  })
}

async function measuredHeights(page: Page) {
  const rows: { selector: string; index: number; height: number }[] = []
  for (const selector of SIZED) {
    const all = await page.locator(selector).all()
    expect(all.length, `${selector} rendered`).toBeGreaterThan(0)
    for (const [index, locator] of all.entries()) {
      rows.push({ selector, index, height: (await boxOf(locator)).height })
    }
  }
  return rows
}

/** Left edge of the first non-empty text run inside an element. */
async function textLeft(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent?.trim()) continue
      const range = document.createRange()
      range.selectNodeContents(node)
      return range.getBoundingClientRect().left
    }
    throw new Error("no text in element")
  })
}

for (const preset of PRESETS) {
  for (const mode of MODES) {
    for (const density of DENSITIES) {
      for (const fontSize of FONT_SIZES) {
        test(`heights · ${preset} · ${mode} · ${density} · ${fontSize}`, async ({
          page,
        }) => {
          const consoleWatch = watchConsole(page)
          await seedApp(page, { preset, mode, density, fontSize })
          await openFixture(page)
          const expected = (await boxOf(page.getByTestId("control-height")))
            .height
          for (const row of await measuredHeights(page)) {
            expect(row.height, `${row.selector} #${row.index}`).toBeCloseTo(
              expected,
              0,
            )
          }
          consoleWatch.assertClean()
        })
      }
    }
  }
}

test.describe("coarse pointer", () => {
  test.use({ hasTouch: true })

  for (const density of ["compact", "cozy"] as const) {
    test(`floors controls at --control-height-xl · ${density}`, async ({
      page,
    }) => {
      await seedApp(page, { preset: "default", mode: "light", density })
      await openFixture(page)
      expect(
        await page.evaluate(() => matchMedia("(pointer: coarse)").matches),
        "hasTouch must make Chromium match (pointer: coarse)",
      ).toBe(true)
      const floor = (await boxOf(page.getByTestId("control-height-xl"))).height
      for (const row of await measuredHeights(page)) {
        expect(
          row.height,
          `${row.selector} #${row.index}`,
        ).toBeGreaterThanOrEqual(floor - 0.5)
      }
      // Calendar days are buttons but must not take the floor: they would
      // overflow their density-sized cells (Task 3, Step 7).
      const cell = page
        .locator('[data-probe="calendar"] .dr-calendar-day')
        .nth(10)
      const day = cell.locator(".dr-calendar-day-btn")
      expect((await boxOf(day)).width).toBeCloseTo((await boxOf(cell)).width, 0)
    })
  }

  test("floors the collapsed sidebar rail at --control-height-xl", async ({
    page,
  }) => {
    await seedApp(page, { preset: "default", mode: "light", density: "cozy" })
    await gotoApp(page, "/")
    await page.getByRole("button", { name: /collapse sidebar/i }).click()
    const aside = page.locator(".dr-sidebar-layout-aside")
    await expect(aside).toHaveAttribute("data-collapsed", "true")
    const floor = await page.evaluate(() => {
      const probe = document.createElement("div")
      probe.style.height = "var(--control-height-xl)"
      document.body.append(probe)
      const height = probe.getBoundingClientRect().height
      probe.remove()
      return height
    })
    const rail = [
      ".dr-sidebar-layout-brand-slot",
      ".dr-sidebar-layout-toggle",
      '.dr-search-command-trigger[data-collapsed="true"]',
      ".dr-sidebar-nav-link",
      ".dr-sidebar-nav-popover-trigger",
    ]
    for (const selector of rail) {
      const all = await aside.locator(selector).all()
      expect(all.length, `${selector} rendered`).toBeGreaterThan(0)
      for (const [index, locator] of all.entries()) {
        const box = await boxOf(locator)
        const label = `${selector} #${index}`
        expect(box.width, label).toBeGreaterThanOrEqual(floor - 0.5)
        expect(box.height, label).toBeGreaterThanOrEqual(floor - 0.5)
      }
    }
  })
})

for (const preset of PRESETS) {
  for (const mode of MODES) {
    for (const density of DENSITIES) {
      test(`table rows and headers · ${preset} · ${mode} · ${density}`, async ({
        page,
      }) => {
        await seedApp(page, { preset, mode, density })
        await openFixture(page)
        await page.mouse.move(0, 0)
        const expected =
          (await boxOf(page.getByTestId("control-height"))).height + 8
        const table = page.locator('[data-probe="table"]')
        const rows = table.locator("tbody tr")
        await expect(rows).toHaveCount(3)
        for (const row of await rows.all()) {
          const height = (await boxOf(row)).height
          expect(
            Math.abs(height - expected),
            `row ${height}px`,
          ).toBeLessThanOrEqual(1)
        }
        const sortable = table.locator(".dr-data-table-column-header-btn")
        const firstCell = rows.first().locator("td").first()
        expect(
          Math.abs((await textLeft(sortable)) - (await textLeft(firstCell))),
          "sortable header label on the cell text edge",
        ).toBeLessThanOrEqual(1)
        const plain = table.locator("th").filter({ hasText: "Total" })
        for (const property of ["font-size", "font-weight", "color"]) {
          expect(await computed(sortable, property), property).toBe(
            await computed(plain, property),
          )
        }
      })
    }
  }
}

// Strong glass is the most see-through card, so the most canvas shows under
// the field; the engine's glass margin is sized for it.
const EDGE_THEMES = [
  ...PRESETS.map((preset) => ({ name: preset, seed: { preset } })),
  {
    name: "glass strong",
    seed: { preset: "glass", presetAxes: { glass: { opacity: "strong" } } },
  },
  {
    name: "glass vivid fuchsia",
    seed: { preset: "glass", accent: "fuchsia", accentIntensity: "vivid" },
  },
  { name: "glass sand surface", seed: { preset: "glass", surface: "sand" } },
  {
    name: "glass intense gradient",
    seed: {
      preset: "glass",
      backgroundStyle: "gradient",
      backgroundIntensity: "intense",
    },
  },
]

for (const { name, seed } of EDGE_THEMES) {
  for (const mode of MODES) {
    test(`field bottom edge reaches 3:1 · ${name} · ${mode}`, async ({
      page,
    }) => {
      await seedApp(page, { ...seed, mode })
      await openFixture(page)
      await page.mouse.move(0, 0)
      for (const probe of ["edge-page", "edge-card"]) {
        const field = page.locator(`[data-probe="${probe}"] .dr-input`)
        const box = await boxOf(field)
        const x = Math.round(box.x + box.width / 2)
        const bottom = Math.floor(box.y + box.height)
        const edge = await pixel(page, x, bottom - 1)
        const ground = await pixel(page, x, bottom + 4)
        const ratio = contrast(edge, ground)
        console.log(
          `edge contrast ${name} · ${mode} · ${probe}: ${ratio.toFixed(2)}:1`,
        )
        expect(
          ratio,
          `${probe}: edge rgb(${edge.join(",")}) on rgb(${ground.join(",")})`,
        ).toBeGreaterThanOrEqual(3)
      }
    })
  }
}

test("glass switch thumb sits evenly in its track", async ({ page }) => {
  await seedApp(page, { preset: "glass", mode: "light" })
  await openFixture(page)
  const track = page.locator('[data-probe="switch"] .dr-switch')
  const thumb = page.locator('[data-probe="switch"] .dr-switch-thumb')
  const trackBox = await boxOf(track)
  const offGap = (await boxOf(thumb)).x - trackBox.x
  await track.click()
  await expect(track).toHaveAttribute("data-state", "checked")
  await expect
    .poll(async () => {
      const box = await boxOf(thumb)
      return (
        Math.round((trackBox.x + trackBox.width - (box.x + box.width)) * 10) /
        10
      )
    })
    .toBeCloseTo(offGap, 0)
})

/**
 * Under the default preset a gradient background repaints its canvas over the
 * top 300px of the content area, where page titles, toolbars and the first
 * fields sit. Every token read there must clear its floor against the
 * strip's loudest pixel.
 */
const STRIP_TOKENS = [
  ["--field-edge-color", 3],
  ["--primary", 3],
  ["--focus-ring", 3],
  ["--muted-foreground", 4.5],
  ["--primary-text", 4.5],
] as const

const STRIP_CASES = [
  ...(["slate", "violet"] as const).flatMap((surface) =>
    MODES.flatMap((mode) =>
      (["balanced", "intense"] as const).map((intensity) => ({
        surface,
        mode,
        intensity,
        pattern: "blobs",
      })),
    ),
  ),
  ...MODES.map((mode) => ({
    surface: "slate",
    mode,
    intensity: "intense",
    pattern: "aurora",
  })),
]

test.describe("gradient strip", () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  for (const { surface, mode, intensity, pattern } of STRIP_CASES) {
    test(`tokens clear their floor on the strip · ${surface} · ${mode} · ${intensity} · ${pattern}`, async ({
      page,
    }) => {
      await seedApp(page, {
        preset: "default",
        accent: "blue",
        surface,
        mode,
        backgroundStyle: "gradient",
        backgroundIntensity: intensity,
        gradientPattern: pattern,
      })
      await gotoApp(page, "/components/buttons")
      await page.addStyleTag({
        content: "main[data-content] > * { visibility: hidden !important; }",
      })
      await settle(page)
      const main = await boxOf(page.locator("main[data-content]"))
      const colours = await page.evaluate(
        (names) =>
          names.map((name) => {
            const probe = document.createElement("span")
            probe.style.color = `hsl(var(${name}))`
            document.body.append(probe)
            const value = getComputedStyle(probe).color
            probe.remove()
            return value
          }),
        STRIP_TOKENS.map(([name]) => name),
      )
      const ratios = await minContrastOver(
        page,
        { x: main.x, y: main.y, width: main.width, height: 300 },
        colours.map(rgbOf),
      )
      for (const [index, [name, floor]] of STRIP_TOKENS.entries()) {
        const ratio = ratios[index] ?? 0
        console.log(
          `strip ${surface} ${mode} ${intensity} ${pattern} ${name}: ${ratio.toFixed(2)}:1`,
        )
        expect(ratio, name).toBeGreaterThanOrEqual(floor)
      }
    })
  }
})
