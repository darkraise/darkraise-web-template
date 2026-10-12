import { test, expect, type Page } from "@playwright/test"
import { gotoApp, seedApp } from "./helpers/app"
import { settle } from "./helpers/measure"

/**
 * Every corner follows the radius axis: the Tailwind steps the kit binds,
 * the kit's floored defaults, and the capsules that square off under sharp.
 * Each class is measured on a bare element, which takes the kit's rule for
 * it whatever page it stands on. Chromium reports huge radii in exponent
 * form, so every value is parsed rather than compared as text.
 */

const RADII = ["sharp", "subtle", "rounded", "pill"] as const

/** Class, then its corner as a function of --radius in px. */
const STEPS: [string, (r: number) => number][] = [
  // rounded-sm
  ["dr-file-upload-item-preview", (r) => Math.max(r - 4, r / 2)],
  // rounded-md
  ["dr-skeleton", (r) => Math.max(r - 2, r * 0.75)],
  // --check-radius, the kit default with the sm floor
  ["dr-checkbox", (r) => Math.max(r - 4, r / 2)],
  // the template's dashboard uses rounded-xl
  ["rounded-xl", (r) => r + 4],
  // the auth layout uses rounded-2xl
  ["rounded-2xl", (r) => r + 8],
]

const CAPSULES = [
  "dr-slider-track",
  "dr-slider-thumb",
  "dr-progress",
  "dr-scroll-thumb",
  "dr-sidebar-nav-badge",
  "dr-notification-bell-badge",
  "dr-carousel-previous",
  "dr-carousel-next",
  "dr-carousel-indicator",
  "dr-empty-state-icon",
  "dr-drawer-handle",
  "dr-switch",
  "dr-switch-thumb",
]

/** The corner and height of a bare 40×20 element carrying `className`. */
function cornerOf(page: Page, className: string) {
  return page.evaluate((name) => {
    const el = document.createElement("div")
    el.className = name
    el.style.cssText =
      "position: fixed; top: 0; left: 0; width: 40px; height: 20px"
    document.body.append(el)
    const corner = Number.parseFloat(getComputedStyle(el).borderTopLeftRadius)
    const height = el.getBoundingClientRect().height
    el.remove()
    return { corner, height }
  }, className)
}

/** --radius in px, as a width resolves it. */
function radiusPx(page: Page) {
  return page.evaluate(() => {
    const el = document.createElement("div")
    el.style.width = "var(--radius)"
    document.body.append(el)
    const width = el.getBoundingClientRect().width
    el.remove()
    return width
  })
}

for (const radius of RADII) {
  test(`corners follow the ${radius} radius`, async ({ page }) => {
    await seedApp(page, { radius, style: "quiet" })
    await gotoApp(page, "/")
    await settle(page)
    const r = await radiusPx(page)
    if (radius === "sharp") expect(r).toBe(0)
    else expect(r).toBeGreaterThan(0)

    for (const [className, step] of STEPS) {
      const { corner } = await cornerOf(page, className)
      expect(corner, className).toBeCloseTo(radius === "sharp" ? 0 : step(r), 1)
      if (radius === "subtle") expect(corner, className).toBeGreaterThan(0)
    }

    for (const className of CAPSULES) {
      const { corner, height } = await cornerOf(page, className)
      if (radius === "sharp") expect(corner, className).toBe(0)
      else expect(corner, className).toBeGreaterThanOrEqual(height / 2)
    }
  })
}
