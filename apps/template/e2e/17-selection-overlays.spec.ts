import { test, expect, type Locator, type Page } from "@playwright/test"
import { PRESETS } from "./fixtures/theme"
import { boxOf, seedApp, watchConsole, type Box } from "./helpers/app"

/**
 * Selection and overlays: the geometry and computed colours the stylesheet
 * scans in packages/ui cannot see. The AlertDialog's stacked buttons sit one
 * footer gap apart on a phone; grouped glass OTP slots share one seam; the
 * glass combobox draws one border; a right sheet squares its viewport edge;
 * the default Tabs pill is not the accent; and a hovered idle sidebar link
 * never matches the active one.
 */

const FIXTURE = "/e2e/fixtures/selection-overlays.html"
const MODES = ["light", "dark"] as const

/**
 * Wait two frames, then for every finite animation and transition to end.
 * The fixture paints the light fallback before ThemeProvider applies the
 * seeded theme, and overlays animate in, so a value read before this is a
 * blend of two states.
 */
async function settle(page: Page) {
  await page.evaluate(async () => {
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    )
    await Promise.all(
      document
        .getAnimations()
        .filter(
          (animation) =>
            animation.effect?.getComputedTiming().iterations !== Infinity,
        )
        .map((animation) => animation.finished.catch(() => undefined)),
    )
  })
}

async function openFixture(page: Page) {
  await page.goto(FIXTURE)
  await page.getByTestId("primary-fill").waitFor({ state: "attached" })
  await page
    .locator('[data-probe="sidebar"] .dr-sidebar-nav-item')
    .first()
    .waitFor()
  await expect(page.locator("html")).toHaveAttribute("data-preset", /.+/)
  await settle(page)
}

type Rgb = [number, number, number]

function rgbOf(value: string): Rgb {
  const match = /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(value)
  if (!match) throw new Error(`expected an rgb() colour, got "${value}"`)
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function luminance([r, g, b]: Rgb): number {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * The rendered colour of one device pixel. Computed style cannot answer this
 * under glass, where the pill is a translucent gradient over the track.
 */
async function pixel(page: Page, x: number, y: number): Promise<Rgb> {
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
    return [r, g, b] as Rgb
  }, png.toString("base64"))
}

function computed(locator: Locator, property: string): Promise<string> {
  return locator.evaluate(
    (el, name) => getComputedStyle(el).getPropertyValue(name),
    property,
  )
}

for (const preset of PRESETS) {
  test(`alert dialog buttons sit one 8px gap apart at 375px · ${preset}`, async ({
    page,
  }) => {
    const consoleWatch = watchConsole(page)
    await page.setViewportSize({ width: 375, height: 740 })
    await seedApp(page, { preset, mode: "light" })
    await openFixture(page)
    await page.getByRole("button", { name: "Open alert" }).click()
    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toBeVisible()
    await settle(page)
    const [upper, lower] = [
      await boxOf(dialog.getByRole("button", { name: "Cancel" })),
      await boxOf(dialog.getByRole("button", { name: "Continue" })),
    ].sort((a, b) => a.y - b.y) as [Box, Box]
    expect(lower.y - (upper.y + upper.height)).toBeCloseTo(8, 0)
    consoleWatch.assertClean()
  })

  test(`a right sheet squares its viewport edge · ${preset}`, async ({
    page,
  }) => {
    await seedApp(page, { preset, mode: "light" })
    await openFixture(page)
    await page.getByRole("button", { name: "Open sheet" }).click()
    const sheet = page.getByRole("dialog")
    await expect(sheet).toBeVisible()
    await settle(page)
    expect(await computed(sheet, "border-top-right-radius")).toBe("0px")
    expect(await computed(sheet, "border-bottom-right-radius")).toBe("0px")
    expect(await computed(sheet, "border-right-width")).toBe("0px")
    expect(await computed(sheet, "border-left-width")).toBe("1px")
  })

  test(`the selected default tab is not the accent fill · ${preset}`, async ({
    page,
  }) => {
    await seedApp(page, { preset, mode: "light" })
    await openFixture(page)
    const indicator = page.locator('[data-probe="tabs"] .dr-tabs-indicator')
    const background = await computed(indicator, "background-color")
    expect(background).not.toBe(
      await computed(page.getByTestId("primary-fill"), "background-color"),
    )
    expect(background).toBe(
      await computed(page.getByTestId("view-bg"), "background-color"),
    )
  })
}

test("grouped glass OTP slots share one 1px seam", async ({ page }) => {
  await seedApp(page, { preset: "glass", mode: "light" })
  await openFixture(page)
  const slots = page.locator('[data-probe="otp"] .dr-input-otp-slot')
  await expect(slots).toHaveCount(3)
  const width = async (slot: Locator, side: string) =>
    parseFloat(await computed(slot, `border-${side}-width`))
  expect(await width(slots.nth(0), "left")).toBe(1)
  expect(
    (await width(slots.nth(0), "right")) + (await width(slots.nth(1), "left")),
  ).toBe(1)
  const first = await boxOf(slots.nth(0))
  const second = await boxOf(slots.nth(1))
  expect(second.x).toBeCloseTo(first.x + first.width, 0)
})

test("the glass combobox draws one border, on its control", async ({
  page,
}) => {
  await seedApp(page, { preset: "glass", mode: "light" })
  await openFixture(page)
  const input = page.locator('[data-probe="combobox"] .dr-combobox-input')
  for (const side of ["top", "right", "bottom", "left"]) {
    expect(await computed(input, `border-${side}-width`), side).toBe("0px")
  }
  const control = page.locator('[data-probe="combobox"] .dr-combobox-control')
  expect(await computed(control, "border-top-width")).toBe("1px")
})

// The glass default pill is the view pill under the glass selected tint.
// Yellow and lime are the lightest accents, the hardest case for a
// foreground label on an accent tint.
for (const mode of MODES) {
  for (const accent of ["blue", "yellow", "lime"]) {
    test(`the glass default tab label reads on its pill · ${mode} · ${accent}`, async ({
      page,
    }) => {
      await seedApp(page, { preset: "glass", mode, accent })
      await openFixture(page)
      await page.mouse.move(0, 0)
      const label = rgbOf(
        await computed(
          page.locator(
            '[data-probe="tabs"] .dr-tabs-trigger[data-state="active"]',
          ),
          "color",
        ),
      )
      const pill = await boxOf(
        page.locator('[data-probe="tabs"] .dr-tabs-indicator'),
      )
      const ground = await pixel(
        page,
        Math.round(pill.x + 6),
        Math.round(pill.y + pill.height / 2),
      )
      expect(
        contrast(label, ground),
        `label rgb(${label.join(",")}) on rgb(${ground.join(",")})`,
      ).toBeGreaterThanOrEqual(4.5)
    })
  }
}

for (const mode of MODES) {
  test(`a hovered idle sidebar link differs from the active one · ${mode}`, async ({
    page,
  }) => {
    await seedApp(page, { preset: "default", mode })
    await openFixture(page)
    const items = page.locator('[data-probe="sidebar"] .dr-sidebar-nav-item')
    const active = page.locator(
      '[data-probe="sidebar"] .dr-sidebar-nav-item:is(.active, [data-status="active"])',
    )
    await expect(active).toHaveCount(1)
    const idle = items.filter({ hasText: "Settings" })
    await idle.hover()
    await settle(page)
    const hovered = await computed(idle, "background-color")
    expect(hovered).not.toBe("rgba(0, 0, 0, 0)")
    expect(hovered).not.toBe(await computed(active, "background-color"))
  })
}
