import { test, expect, type Page } from "@playwright/test"
import { boxOf, seedApp } from "./helpers/app"
import { computed, settle } from "./helpers/measure"

/**
 * Kit components inside a right-to-left document, read from layout, computed
 * style and the keyboard. The fixture's <html> carries dir="rtl", so nothing
 * here passes a dir prop.
 */

const FIXTURE = "/e2e/fixtures/rtl.html"

async function openFixture(page: Page): Promise<void> {
  await seedApp(page, { style: "quiet", mode: "light" })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto(FIXTURE)
  await page.getByTestId("rtl").waitFor()
  await expect(page.locator("html")).toHaveAttribute("data-style", "quiet")
  await page.mouse.move(0, 0)
  await settle(page)
}

test.describe("fixture", () => {
  test("renders right to left", async ({ page }) => {
    await openFixture(page)
    expect(await computed(page.getByTestId("rtl"), "direction")).toBe("rtl")
  })
})

test.describe("inline icons", () => {
  test("mirror under a right-to-left document", async ({ page }) => {
    await openFixture(page)
    const icon = page.locator('[data-probe="icon-inline"] svg')
    expect(await computed(icon, "scale")).toBe("-1 1")
  })
})

test.describe("tabs", () => {
  test("inherit the document direction and mirror their arrow keys", async ({
    page,
  }) => {
    await openFixture(page)
    const probe = page.locator('[data-probe="tabs"]')
    await expect(probe.locator(".dr-tabs")).not.toHaveAttribute("dir")
    expect(await computed(probe.getByRole("tablist"), "direction")).toBe("rtl")
    const first = probe.getByRole("tab", { name: "Tab 1" })
    const second = probe.getByRole("tab", { name: "Tab 2" })
    await first.focus()
    await page.keyboard.press("ArrowLeft")
    await expect(second).toBeFocused()
    expect((await boxOf(second)).x).toBeLessThan((await boxOf(first)).x)
  })

  test("keep the indicator on the active tab after scrolling", async ({
    page,
  }) => {
    await openFixture(page)
    const probe = page.locator('[data-probe="tabs"]')
    const list = probe.getByRole("tablist")
    await probe.getByRole("tab", { name: "Tab 1" }).focus()
    for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowLeft")
    const last = probe.getByRole("tab", { name: "Tab 6" })
    await expect(last).toHaveAttribute("data-state", "active")
    await settle(page)
    expect(await list.evaluate((el) => el.scrollLeft)).toBeLessThan(0)
    const tab = await boxOf(last)
    const indicator = await boxOf(list.locator(".dr-tabs-indicator"))
    expect(Math.abs(indicator.x - tab.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(indicator.width - tab.width)).toBeLessThanOrEqual(1)
  })
})

test.describe("scroll area", () => {
  test("puts the vertical bar on the left edge", async ({ page }) => {
    await openFixture(page)
    const probe = page.locator('[data-probe="scroll-area"]')
    const root = await boxOf(probe.locator(".dr-scroll-area"))
    const bar = await boxOf(
      probe.locator('.dr-scroll-bar[data-orientation="vertical"]'),
    )
    expect(Math.abs(bar.x - root.x)).toBeLessThanOrEqual(1)
  })

  test("moves the horizontal thumb left as content scrolls", async ({
    page,
  }) => {
    await openFixture(page)
    const probe = page.locator('[data-probe="scroll-area"]')
    const bar = probe.locator('.dr-scroll-bar[data-orientation="horizontal"]')
    const thumb = bar.locator(".dr-scroll-thumb")
    const track = await boxOf(bar)
    const start = await boxOf(thumb)
    expect(
      Math.abs(start.x + start.width - (track.x + track.width)),
    ).toBeLessThanOrEqual(2)
    await probe
      .locator("[data-darkraise-scroll-viewport]")
      .evaluate((el) => el.scrollTo({ left: -200 }))
    await settle(page)
    expect((await boxOf(thumb)).x).toBeLessThan(start.x - 10)
  })
})
