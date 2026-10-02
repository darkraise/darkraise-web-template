import { readFileSync } from "node:fs"
import { test, expect } from "@playwright/test"
import { gotoApp, seedApp } from "./helpers/app"

interface ScaffoldAxis {
  values: string[]
  default: string
  storageKey: string
  attribute: string | null
}

const AXES = JSON.parse(
  readFileSync(
    new URL("../../../create-app/bin/axes.json", import.meta.url),
    "utf8",
  ),
) as Record<string, ScaffoldAxis>

// Glass hides surface intensity, which would leave that attribute to the
// provider, so the preset stays on default. Mode must be `dark`: `system` and
// `light` both resolve to light under Playwright's scheme and would prove
// nothing.
const PINNED: Record<string, string> = {
  "theme-preset": "default",
  mode: "dark",
}

// Every attribute axis, seeded with its last non-default value. With the app
// bundle blocked, an attribute present after reload can only come from the
// pre-render script.
const SEED: [storageKey: string, attribute: string, value: string][] =
  Object.values(AXES).flatMap((axis) =>
    axis.attribute
      ? [
          [
            axis.storageKey,
            axis.attribute,
            PINNED[axis.storageKey] ??
              [...axis.values].reverse().find((v) => v !== axis.default) ??
              axis.default,
          ] as [string, string, string],
        ]
      : [],
  )

const seeded = (storageKey: string) =>
  SEED.find(([key]) => key === storageKey)?.[2] ?? ""

test("restores the stored theme before the app mounts", async ({ page }) => {
  await seedApp(page)
  await page.addInitScript((seed: [string, string, string][]) => {
    for (const [key, , value] of seed) {
      if (localStorage.getItem(key) === null) localStorage.setItem(key, value)
    }
  }, SEED)
  await gotoApp(page, "/components/buttons")
  const html = page.locator("html")
  await expect(html).toHaveAttribute("data-accent", seeded("theme-accent"))
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
