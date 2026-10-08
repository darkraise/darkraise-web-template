import { test, expect } from "@playwright/test"
import { boxOf, seedApp } from "./helpers/app"
import { settle } from "./helpers/measure"
import { openOverlayCase } from "./helpers/overlays"

/**
 * Scroll lock: opening a modal dialog or drawer hides the document scrollbar
 * and pads the body by its width on the side it was on, so in-flow content
 * does not move. Headless Chromium hides scrollbars by default, so this file
 * shows classic ones.
 */

test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } })

for (const [name, dir] of [
  ["scroll-lock", "ltr"],
  ["scroll-lock-rtl", "rtl"],
] as const) {
  for (const overlay of ["dialog", "drawer"] as const) {
    test(`opening a ${overlay} keeps the header in place · ${dir}`, async ({
      page,
    }) => {
      await seedApp(page, { style: "quiet", mode: "light" })
      await openOverlayCase(page, name)
      const width = await page.evaluate(
        () => window.innerWidth - document.documentElement.clientWidth,
      )
      expect(width).toBeGreaterThan(0)
      const controls = [
        page.getByRole("button", { name: "Open dialog" }),
        page.getByTestId("inline-end"),
      ]
      const inlinePositions = () =>
        Promise.all(controls.map(async (control) => (await boxOf(control)).x))
      const before = await inlinePositions()
      await page.getByRole("button", { name: `Open ${overlay}` }).click()
      await expect(page.getByRole("dialog")).toBeVisible()
      await expect
        .poll(() => page.evaluate(() => document.body.style.overflow))
        .toBe("hidden")
      await settle(page)
      const after = await inlinePositions()
      for (const [i, x] of after.entries()) {
        expect(Math.abs(x - (before[i] ?? Number.NaN))).toBeLessThanOrEqual(1)
      }
    })
  }
}
