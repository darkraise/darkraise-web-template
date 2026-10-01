import { test, expect, type Page } from "@playwright/test"
import { DENSITIES, PRESETS } from "./fixtures/theme"
import { boxOf, seedApp, watchConsole } from "./helpers/app"

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
  await page.locator('[data-probe="segment"] .dr-segment-group-item').first().waitFor()
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

function luminance([r, g, b]: [number, number, number]): number {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrast(a: [number, number, number], b: [number, number, number]) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * The rendered colour of one device pixel. Computed style cannot answer this
 * under glass, where the card is translucent over a gradient canvas.
 */
async function pixel(
  page: Page,
  x: number,
  y: number,
): Promise<[number, number, number]> {
  const png = await page.screenshot({ clip: { x, y, width: 1, height: 1 } })
  return page.evaluate(async (b64) => {
    const img = new Image()
    img.src = `data:image/png;base64,${b64}`
    await img.decode()
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const context = canvas.getContext("2d")
    if (!context) throw new Error("no 2d context")
    context.drawImage(img, 0, 0)
    const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data
    return [r, g, b] as [number, number, number]
  }, png.toString("base64"))
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
          const expected = (await boxOf(page.getByTestId("control-height"))).height
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
      const cell = page.locator('[data-probe="calendar"] .dr-calendar-day').nth(10)
      const day = cell.locator(".dr-calendar-day-btn")
      expect((await boxOf(day)).width).toBeCloseTo((await boxOf(cell)).width, 0)
    })
  }
})

// Strong glass is the most see-through card, so the most canvas shows under
// the field; the engine's glass margin is sized for it.
const EDGE_THEMES = [
  ...PRESETS.map((preset) => ({ name: preset, seed: { preset } })),
  {
    name: "glass strong",
    seed: { preset: "glass", presetAxes: { glass: { opacity: "strong" } } },
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
        expect(
          contrast(edge, ground),
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
      return Math.round((trackBox.x + trackBox.width - (box.x + box.width)) * 10) / 10
    })
    .toBeCloseTo(offGap, 0)
})
