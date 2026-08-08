import { test, expect } from "@playwright/test"
import { COMPONENT_ROUTES } from "./fixtures/component-routes"
import { DARK_ONLY_PRESETS, PRESETS } from "./fixtures/theme"
import {
  expectNoErrorBoundary,
  expectNoHorizontalOverflow,
  gotoApp,
  readThemeAttrs,
  seedApp,
  watchConsole,
} from "./helpers/app"

/**
 * Every component showcase page under every preset, in every mode that preset
 * supports. Presets rebind surface, radius, shadow and glow tokens, and several
 * ship their own CSS layer — a page that renders under Default can still break
 * under Terminal or Sci-fi.
 */
const ERROR_COPY_BY_DESIGN = new Set(["/components/error-pages"])

for (const preset of PRESETS) {
  const modes = DARK_ONLY_PRESETS.includes(preset)
    ? (["dark"] as const)
    : (["light", "dark"] as const)

  for (const mode of modes) {
    test.describe(`${preset} · ${mode}`, () => {
      for (const route of COMPONENT_ROUTES) {
        test(`${route.path}`, async ({ page }) => {
          const consoleWatch = watchConsole(page)
          await seedApp(page, { preset, mode })
          await gotoApp(page, route.path)

          const attrs = await readThemeAttrs(page)
          expect(attrs["data-preset"]).toBe(preset)
          expect(attrs["data-mode"]).toBe(mode)

          await expect(page.locator("main h1").first()).toHaveText(route.title)
          if (!ERROR_COPY_BY_DESIGN.has(route.path)) {
            await expectNoErrorBoundary(page)
          }
          await expectNoHorizontalOverflow(page)
          consoleWatch.assertClean()
        })
      }
    })
  }
}
