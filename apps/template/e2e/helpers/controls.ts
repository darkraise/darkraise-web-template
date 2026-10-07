import { expect, type Page } from "@playwright/test"
import { collectGarbage } from "./app"
import { settle } from "./measure"

export const CONTROL_FIXTURE = "/e2e/fixtures/control-contract.html"

export async function openControlFixture(page: Page): Promise<void> {
  await collectGarbage(page)
  await page.goto(CONTROL_FIXTURE)
  await page.getByTestId("control-height").waitFor({ state: "attached" })
  await page
    .locator('[data-probe="segment"] .dr-segment-group-item')
    .first()
    .waitFor()
  // The fixture paints the light fallback before ThemeProvider applies the
  // seeded theme, so colours are still transitioning when the controls first
  // appear; a pixel sampled then is a blend of the two themes. Wait for the
  // theme, then settle(), which re-reads replacement transitions and fails by
  // name at its deadline.
  await expect(page.locator("html")).toHaveAttribute("data-style", /.+/)
  await settle(page)
}
