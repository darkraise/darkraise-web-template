import { test, expect } from "@playwright/test"
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
 * The settings page under every preset, in every mode that preset supports.
 * It is not a component showcase route, so 05-component-preset-matrix never
 * reaches it — yet it composes NumberInput, Combobox, InputOTP and
 * PasswordInput, the compound inputs most prone to preset-specific breakage.
 */
for (const preset of PRESETS) {
  const modes = DARK_ONLY_PRESETS.includes(preset)
    ? (["dark"] as const)
    : (["light", "dark"] as const)

  for (const mode of modes) {
    test(`/settings · ${preset} · ${mode}`, async ({ page }) => {
      const consoleWatch = watchConsole(page)
      await seedApp(page, { preset, mode })
      await gotoApp(page, "/settings")

      const attrs = await readThemeAttrs(page)
      expect(attrs["data-preset"]).toBe(preset)
      expect(attrs["data-mode"]).toBe(mode)

      await expect(page.locator("main h1").first()).toHaveText("Settings")
      await expectNoErrorBoundary(page)
      await expectNoHorizontalOverflow(page)
      consoleWatch.assertClean()
    })
  }
}
