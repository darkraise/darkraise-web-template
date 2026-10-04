import { test, expect } from "@playwright/test"
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
 * The settings page under each matrix style, in both modes. It is not a
 * component showcase route, so 05-component-preset-matrix never reaches it,
 * yet it composes NumberInput, Combobox, InputOTP and PasswordInput, and its
 * theme panel shows the glass axes only under Glass.
 */
for (const style of MATRIX_STYLES) {
  const modes = ["light", "dark"] as const

  for (const mode of modes) {
    test(`/settings · ${style} · ${mode}`, async ({ page }) => {
      const consoleWatch = watchConsole(page)
      await seedApp(page, { style, mode })
      await gotoApp(page, "/settings")

      const attrs = await readThemeAttrs(page)
      expect(attrs["data-style"]).toBe(style)
      expect(attrs["data-mode"]).toBe(mode)

      await expect(page.locator("main h1").first()).toHaveText("Settings")
      await expectNoErrorBoundary(page)
      await expectNoHorizontalOverflow(page)
      consoleWatch.assertClean()
    })
  }
}
