import { test, expect, type Locator, type Page } from "@playwright/test"
import { STYLES } from "./fixtures/theme"
import { gotoApp, seedApp } from "./helpers/app"
import { contrast, pixel, rgbOf, settle, type Rgb } from "./helpers/measure"

/**
 * The sidebar selection in a real browser. Pixels rather than computed
 * styles, because Glass paints translucent layers over a gradient.
 */

const LOOKS = ["chip", "pill", "tile", "frosted"] as const
const MODES = ["light", "dark"] as const
/** Blue is the default accent; neutral is the faintest on a light rail. */
const ACCENTS = ["blue", "neutral"] as const
/** The surface or its edge against the rail. */
const SURFACE_FLOOR = 1.2
/** The icon, tile or pill against the surface. */
const CUE_FLOOR = 3

const nav = (page: Page) =>
  page.locator(".dr-sidebar-layout-nav-scroll .dr-sidebar-nav")
const current = (page: Page) => nav(page).locator(".dr-sidebar-nav-current")
const indicator = (page: Page) => nav(page).locator(".dr-sidebar-nav-indicator")

async function box(locator: Locator) {
  const found = await locator.boundingBox()
  if (!found) throw new Error("element is not rendered")
  return found
}

async function cue(page: Page, look: (typeof LOOKS)[number]): Promise<Rgb> {
  if (look === "tile") {
    return rgbOf(
      await current(page)
        .locator(".dr-sidebar-nav-icon")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    )
  }
  if (look === "pill") {
    return rgbOf(
      await indicator(page).evaluate(
        (el) => getComputedStyle(el, "::before").backgroundColor,
      ),
    )
  }
  return rgbOf(
    await current(page)
      .locator(".dr-sidebar-nav-icon-svg")
      .evaluate((el) => getComputedStyle(el).color),
  )
}

for (const style of STYLES) {
  for (const mode of MODES) {
    for (const accent of ACCENTS) {
      for (const look of LOOKS) {
        test(`${look} reads on the ${style} ${mode} rail · ${accent}`, async ({
          page,
        }) => {
          await seedApp(page, { style, mode, accent, sidebarSelection: look })
          await gotoApp(page, "/orders")
          await expect(nav(page)).toHaveAttribute("data-indicator", "ready")
          await settle(page)
          const row = await box(current(page))
          const x = Math.round(row.x + row.width - 8)
          const surface = await pixel(
            page,
            x,
            Math.round(row.y + row.height / 2),
          )
          const edge = await pixel(page, x, Math.floor(row.y) - 1)
          // The group label row above "Orders" is empty at the row's far end.
          const rail = await pixel(page, x, Math.round(row.y) - 14)
          expect(
            Math.max(contrast(surface, rail), contrast(edge, rail)),
            "surface or edge against the rail",
          ).toBeGreaterThanOrEqual(SURFACE_FLOOR)
          expect(
            contrast(await cue(page, look), surface),
            "cue against the surface",
          ).toBeGreaterThanOrEqual(CUE_FLOOR)
        })
      }
    }
  }
}
