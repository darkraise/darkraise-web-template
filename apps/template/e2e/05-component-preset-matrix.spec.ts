import { test, expect } from "@playwright/test"
import { COMPONENT_ROUTES } from "./fixtures/component-routes"
import { MATRIX_STYLES } from "./fixtures/theme"
import {
  expectNoErrorBoundary,
  expectNoHorizontalOverflow,
  gotoApp,
  readThemeAttrs,
  seedApp,
  watchConsole,
} from "./helpers/app"

/**
 * Every component showcase page under each matrix style, in both modes.
 * Glass frosts the shell chrome and the overlays around every page, so a page
 * that renders under Quiet can still break under Glass. Flat and Tactile
 * change only control shadows, which 16 and the kitchen sink baseline cover.
 */
const ERROR_COPY_BY_DESIGN = new Set(["/components/error-pages"])

for (const style of MATRIX_STYLES) {
  const modes = ["light", "dark"] as const

  for (const mode of modes) {
    test.describe(`${style} · ${mode}`, () => {
      for (const route of COMPONENT_ROUTES) {
        test(`${route.path}`, async ({ page }) => {
          const consoleWatch = watchConsole(page)
          await seedApp(page, { style, mode })
          await gotoApp(page, route.path)

          const attrs = await readThemeAttrs(page)
          expect(attrs["data-style"]).toBe(style)
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
