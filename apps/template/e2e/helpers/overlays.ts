import { expect, type Locator, type Page } from "@playwright/test"
import { settle } from "./measure"

export const OVERLAY_FIXTURE = "/e2e/fixtures/overlay-geometry.html"

/** Opens one case of the overlay fixture once the stored theme is applied
 *  and every entrance animation has finished. */
export async function openOverlayCase(page: Page, name: string): Promise<void> {
  await page.goto(`${OVERLAY_FIXTURE}?case=${name}`)
  await page
    .locator(`[data-testid="overlay-case"][data-case="${name}"]`)
    .waitFor({ state: "attached" })
  await expect(page.locator("html")).toHaveAttribute("data-style", /.+/)
  await settle(page)
}

/** Fails unless the element's box lies inside the viewport, within 1px. */
export async function expectInViewport(
  page: Page,
  locator: Locator,
): Promise<void> {
  const viewport = page.viewportSize()
  if (!viewport) throw new Error("the page has no fixed viewport")
  const box = await locator.boundingBox()
  if (!box) throw new Error("element is not visible, so it has no box")
  expect(box.x).toBeGreaterThanOrEqual(-1)
  expect(box.y).toBeGreaterThanOrEqual(-1)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1)
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1)
}

/** True when the topmost element at the point sits inside `selector`. */
export async function hitsAt(
  page: Page,
  x: number,
  y: number,
  selector: string,
): Promise<boolean> {
  return page.evaluate(
    ([px, py, sel]) => document.elementFromPoint(px, py)?.closest(sel) != null,
    [x, y, selector] as const,
  )
}
