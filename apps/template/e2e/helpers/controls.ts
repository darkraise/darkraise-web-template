import { expect, type Page } from "@playwright/test"

export const CONTROL_FIXTURE = "/e2e/fixtures/control-contract.html"

export async function openControlFixture(page: Page): Promise<void> {
  await page.goto(CONTROL_FIXTURE)
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
  await expect(page.locator("html")).toHaveAttribute("data-style", /.+/)
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
