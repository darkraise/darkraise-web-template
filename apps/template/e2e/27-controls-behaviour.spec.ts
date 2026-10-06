import { test, expect, type Page } from "@playwright/test"
import { seedApp } from "./helpers/app"
import { settle } from "./helpers/measure"

/**
 * Component behaviour on the controls-behaviour fixture: row geometry and
 * the outline variants' selection marks, read from layout and rendered
 * pixels.
 */

const FIXTURE = "/e2e/fixtures/controls-behaviour.html"
const MODES = ["light", "dark"] as const

async function openInMode(
  page: Page,
  mode: (typeof MODES)[number],
): Promise<void> {
  await seedApp(page, { style: "quiet", mode })
  await page.goto(FIXTURE)
  await page.getByTestId("controls-behaviour").waitFor()
  await expect(page.locator("html")).toHaveAttribute("data-style", "quiet")
  await page.mouse.move(0, 0)
  await settle(page)
}

test.describe("fixture", () => {
  for (const mode of MODES) {
    test(`opens in the seeded mode · ${mode}`, async ({ page }) => {
      await openInMode(page, mode)
      await expect(page.locator("html")).toHaveAttribute("data-mode", mode)
    })
  }
})
