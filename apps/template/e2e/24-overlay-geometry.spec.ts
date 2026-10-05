import { test, expect } from "@playwright/test"
import { boxOf, seedApp } from "./helpers/app"
import { settle } from "./helpers/measure"
import { openOverlayCase } from "./helpers/overlays"

/**
 * Overlay geometry: popups stay attached to their trigger and inside the
 * viewport, floating panels stay under modal layers, long sheets scroll, and
 * every floating surface paints the overlay fill. Each case is its own page
 * load of the overlay-geometry fixture.
 */

test.describe("popups follow their trigger", () => {
  test("a popover keeps its offset when its box scrolls or the viewport resizes", async ({
    page,
  }) => {
    await seedApp(page, { style: "quiet", mode: "light" })
    await openOverlayCase(page, "follow")
    const trigger = page.getByRole("button", { name: "Anchor" })
    await trigger.click()
    const content = page.getByTestId("follow-popover")
    await expect(content).toBeVisible()
    await settle(page)
    const offset = async () => {
      const [anchor, popup] = [await boxOf(trigger), await boxOf(content)]
      return { x: popup.x - anchor.x, y: popup.y - anchor.y }
    }
    const initial = await offset()
    const drift = async () => {
      const now = await offset()
      return Math.max(Math.abs(now.x - initial.x), Math.abs(now.y - initial.y))
    }
    await page.getByTestId("scroll-box").evaluate((element) => {
      element.scrollTop = 50
    })
    await expect.poll(drift).toBeLessThanOrEqual(1)
    await page.setViewportSize({ width: 1080, height: 720 })
    await expect.poll(drift).toBeLessThanOrEqual(1)
  })
})
