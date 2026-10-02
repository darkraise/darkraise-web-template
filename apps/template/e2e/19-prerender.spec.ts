import { test, expect } from "@playwright/test"
import { gotoApp, seedApp } from "./helpers/app"

// Every registry axis that carries an attribute; add a row when the registry
// gains one. With the app bundle blocked, an attribute present after reload
// can only come from the pre-render script, so a default value such as
// `theme-preset: default` proves the restore as well as any other.
const SEED: [storageKey: string, attribute: string, value: string][] = [
  ["mode", "data-mode", "dark"],
  ["theme-density", "data-density", "spacious"],
  ["theme-radius", "data-radius", "pill"],
  ["theme-accent", "data-accent", "violet"],
  ["theme-surface-color", "data-surface", "zinc"],
  ["theme-preset", "data-preset", "default"],
  ["theme-bg-style", "data-background-style", "gradient"],
  ["theme-bg-intensity", "data-background-intensity", "subtle"],
  ["theme-gradient-pattern", "data-gradient-pattern", "mesh"],
  ["theme-elevation", "data-elevation", "high"],
  ["theme-button-elevation", "data-button-elevation", "low"],
  ["theme-surface-intensity", "data-surface-intensity", "bold"],
  ["theme-font-size", "data-font-size", "large"],
  ["theme-control-depth", "data-control-depth", "deep"],
  ["theme-outer-glow", "data-outer-glow", "subtle"],
  ["theme-inner-glow", "data-inner-glow", "subtle"],
  ["theme-shell-style", "data-shell-style", "island"],
]

test("restores the stored theme before the app mounts", async ({ page }) => {
  await seedApp(page)
  await page.addInitScript((seed: [string, string, string][]) => {
    for (const [key, , value] of seed) {
      if (localStorage.getItem(key) === null) localStorage.setItem(key, value)
    }
  }, SEED)
  await gotoApp(page, "/components/buttons")
  const html = page.locator("html")
  await expect(html).toHaveAttribute("data-accent", "violet")
  const primary = await page.evaluate(() =>
    document.documentElement.style.getPropertyValue("--primary"),
  )
  expect(primary).not.toBe("")

  // Without the app bundle nothing but the pre-render script can paint.
  await page.route(/\/src\/main\.tsx/, (route) => route.abort())
  await page.reload()
  for (const [, attribute, value] of SEED) {
    await expect(html, attribute).toHaveAttribute(attribute, value)
  }
  expect(
    await page.evaluate(() =>
      document.documentElement.style.getPropertyValue("--primary"),
    ),
  ).toBe(primary)
  await expect(page.locator("#root .app-loading")).toHaveCount(1)
})
