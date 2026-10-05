import { test, expect, type Locator, type Page } from "@playwright/test"
import { DENSITIES, MATRIX_STYLES, STYLES } from "./fixtures/theme"
import { boxOf, gotoApp, seedApp, watchConsole } from "./helpers/app"
import { openControlFixture } from "./helpers/controls"
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
 * every density and font size, in both modes and under every style, since a
 * style changes only shadows; on a coarse pointer they floor at
 * --control-height-xl; and a field's bottom edge reaches 3:1 against what it
 * sits on (WCAG 1.4.11).
 *
 * Heights are compared against probe elements sized with the tokens rather
 * than hard-coded pixels, because --control-scale moves them with the
 * font-size axis.
 */

const MODES = ["light", "dark"] as const
const FONT_SIZES = ["medium", "extra-large"] as const

const SIZED = [
  '[data-probe="buttons"] .dr-btn',
  '[data-probe="toggles"] .dr-toggle',
  '[data-probe="input"] .dr-input',
  '[data-probe="select"] .dr-select-trigger',
  '[data-probe="cascade"] .dr-cascade-trigger',
  '[data-probe="time-picker"] .dr-time-picker-trigger',
  '[data-probe="time-picker-empty"] .dr-time-picker-trigger',
  '[data-probe="combobox"] .dr-combobox-control',
  '[data-probe="multi-select"] .dr-multi-select-control',
  '[data-probe="date-input"] .dr-date-input',
  '[data-probe="number-input"] .dr-number-input-control',
  '[data-probe="otp"] .dr-input-otp-slot',
  '[data-probe="segment"] .dr-segment-group-item',
]

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

for (const style of STYLES) {
  for (const mode of MODES) {
    for (const density of DENSITIES) {
      for (const fontSize of FONT_SIZES) {
        test(`heights · ${style} · ${mode} · ${density} · ${fontSize}`, async ({
          page,
        }) => {
          const consoleWatch = watchConsole(page)
          await seedApp(page, { style, mode, density, fontSize })
          await openControlFixture(page)
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
      await seedApp(page, { style: "quiet", mode: "light", density })
      await openControlFixture(page)
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
    await seedApp(page, { style: "quiet", mode: "light", density: "cozy" })
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

for (const style of MATRIX_STYLES) {
  for (const mode of MODES) {
    for (const density of DENSITIES) {
      test(`table rows and headers · ${style} · ${mode} · ${density}`, async ({
        page,
      }) => {
        await seedApp(page, { style, mode, density })
        await openControlFixture(page)
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

// Fields are opaque under every style, so one 3:1 floor holds everywhere.
// The glass cases add the loudest grounds frosted chrome sits over: a vivid
// accent, a warm surface and an intense gradient.
const EDGE_THEMES = [
  ...STYLES.map((style) => ({ name: style, seed: { style } })),
  {
    name: "glass vivid fuchsia",
    seed: { style: "glass", accent: "fuchsia", darkAccentChroma: "vivid" },
  },
  { name: "glass sand surface", seed: { style: "glass", surface: "sand" } },
  {
    name: "glass intense gradient",
    seed: {
      style: "glass",
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
      await openControlFixture(page)
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

for (const style of STYLES) {
  test(`switch thumb sits evenly in its track · ${style}`, async ({ page }) => {
    await seedApp(page, { style, mode: "light" })
    await openControlFixture(page)
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
}

/**
 * Under a non-frosted style a gradient background repaints its canvas over the
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
        width: 1440,
      })),
    ),
  ),
  ...(["aurora", "mesh", "spotlight"] as const).flatMap((pattern) =>
    MODES.map((mode) => ({
      surface: "slate",
      mode,
      intensity: "intense",
      pattern,
      width: 1440,
    })),
  ),
  ...(["blobs", "mesh"] as const).flatMap((pattern) =>
    MODES.flatMap((mode) =>
      [390, 768].map((width) => ({
        surface: "slate",
        mode,
        intensity: "intense",
        pattern,
        width,
      })),
    ),
  ),
]

test.describe("gradient strip", () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  for (const { surface, mode, intensity, pattern, width } of STRIP_CASES) {
    test(`tokens clear their floor on the strip · ${surface} · ${mode} · ${intensity} · ${pattern} · ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await seedApp(page, {
        style: "quiet",
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

/**
 * Every style composes its control tokens with the glow layers rather than
 * replacing them. Each probe is set inline on <html>, which outranks every
 * stylesheet declaration of the same property there, and carries a colour no
 * real token uses, so a computed shadow contains it only if the rule reads
 * the token. A field reads no glow, so the focused field is probed through
 * its own family token, under its focus ring.
 */
const PROBES = {
  "--glow-outer": { value: "0 0 0 3px rgb(1, 2, 3)", colour: "rgb(1, 2, 3)" },
  "--glow-inner": {
    value: "inset 0 0 0 4px rgb(4, 5, 6)",
    colour: "rgb(4, 5, 6)",
  },
  "--affordance-glow": {
    value: "0 0 0 5px rgb(7, 8, 9)",
    colour: "rgb(7, 8, 9)",
  },
  "--field-shadow": {
    value: "inset 0 0 0 6px rgb(10, 11, 12)",
    colour: "rgb(10, 11, 12)",
  },
} as const

type Probe = keyof typeof PROBES

/** An outset 1px layer: the field focus ring and the destructive OTP ring. */
const OUTSET_RING = /0px 0px 0px 1px(?! inset)/

async function setProbes(page: Page) {
  const pairs = Object.entries(PROBES).map(
    ([name, { value }]) => [name, value] as [string, string],
  )
  await page.evaluate((entries) => {
    for (const [name, value] of entries) {
      document.documentElement.style.setProperty(name, value)
    }
  }, pairs)
}

for (const style of STYLES) {
  test(`controls compose the glow probes · ${style}`, async ({ page }) => {
    await seedApp(page, { style, mode: "light" })
    await gotoApp(page, "/components/kitchen-sink")
    await page.mouse.move(0, 0)
    const field = page.getByLabel("Focused field")
    await field.focus()
    await expect(field).toBeFocused()
    await setProbes(page)

    const cases: [string, Locator, Probe[]][] = [
      [
        "filled button",
        page.locator('main .dr-btn[data-variant="default"]').first(),
        ["--glow-outer", "--glow-inner"],
      ],
      [
        "checked checkbox",
        page.locator('main .dr-checkbox[data-state="checked"]').first(),
        ["--affordance-glow"],
      ],
      [
        "active tab",
        page.locator('main .dr-tabs-indicator[data-variant="default"]').first(),
        ["--affordance-glow"],
      ],
      ["focused field", field, ["--field-shadow"]],
    ]
    for (const [name, locator, probes] of cases) {
      for (const probe of probes) {
        await expect
          .poll(() => computed(locator, "box-shadow"), {
            message: `${name} reads ${probe}`,
          })
          .toContain(PROBES[probe].colour)
      }
    }
    expect(await computed(field, "box-shadow")).toMatch(OUTSET_RING)
  })
}

test("an invalid active OTP slot keeps the affordance glow", async ({
  page,
}) => {
  await seedApp(page, { style: "quiet", mode: "light" })
  await openControlFixture(page)
  await setProbes(page)
  await page.locator('[data-probe="otp-invalid"] input').first().focus()
  const slot = page.locator(
    '[data-probe="otp-invalid"] .dr-input-otp-slot[data-active]',
  )
  await expect(slot).toHaveCount(1)
  await expect
    .poll(() => computed(slot, "box-shadow"))
    .toContain(PROBES["--affordance-glow"].colour)
  expect(await computed(slot, "box-shadow")).toMatch(OUTSET_RING)
})
