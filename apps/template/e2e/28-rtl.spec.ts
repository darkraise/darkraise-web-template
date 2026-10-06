import { test, expect, type Page } from "@playwright/test"
import { seedApp } from "./helpers/app"
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
