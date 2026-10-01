import { test, expect, type Locator, type Page } from "@playwright/test"
import { PRESETS } from "./fixtures/theme"
import { boxOf, seedApp, watchConsole, type Box } from "./helpers/app"
import { computed, contrast, pixel, rgbOf, settle } from "./helpers/measure"

/**
 * Selection and overlays: the geometry and computed colours the stylesheet
 * scans in packages/ui cannot see. The AlertDialog's stacked buttons sit one
 * footer gap apart on a phone; grouped glass OTP slots share one seam; the
 * glass combobox draws one border; a right sheet squares its viewport edge;
 * the default Tabs pill is not the accent; and a hovered idle sidebar link
 * never matches the active one; a CascadeSelect column scrolled by the
 * keyboard keeps focus on the keyboard row under a resting pointer.
 */

const FIXTURE = "/e2e/fixtures/selection-overlays.html"
const MODES = ["light", "dark"] as const

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

test("a resting pointer leaves keyboard focus on a scrolled cascade column", async ({
  page,
}) => {
  await seedApp(page, { preset: "default", mode: "light" })
  await openFixture(page)
  await page.getByRole("button", { name: "Pick an item" }).click()
  const item = (n: number) =>
    page.getByRole("option", { name: `Item ${String(n).padStart(2, "0")}` })
  await expect(item(1)).toBeFocused()
  await item(3).hover()
  await expect(item(3)).toBeFocused()
  for (let i = 0; i < 15; i++) await page.keyboard.press("ArrowDown")
  await settle(page)
  // Chromium refreshes hover after a scroll on a timer, not in the same
  // frame, so a stray pointerenter arrives after the keys have settled.
  await page.waitForTimeout(300)
  expect(await page.evaluate(() => document.activeElement?.textContent)).toBe(
    "Item 18",
  )
})
