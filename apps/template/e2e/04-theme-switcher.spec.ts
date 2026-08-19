import { test, expect, type Page } from "@playwright/test"
import {
  ACCENT_COLORS,
  DENSITIES,
  ELEVATIONS,
  FONT_SIZES,
  GRADIENT_PATTERNS,
  HIDDEN_COMMON_AXES,
  PRESETS,
  PRESET_AXES,
  PRESET_LABELS,
  RADII,
  SURFACE_COLORS,
  SURFACE_INTENSITIES,
  type Preset,
} from "./fixtures/theme"
import {
  closeThemeSwitcher,
  gotoApp,
  openThemeSwitcher,
  readThemeAttrs,
  readToken,
  seedApp,
  setAxisSlider,
  switcherSections,
  themeSwitcher,
  watchConsole,
} from "./helpers/app"

const PROBE = "/components/buttons"

async function selectPreset(page: Page, preset: Preset) {
  await themeSwitcher(page)
    .locator('[aria-label="Preset"]')
    .getByRole("radio", { name: PRESET_LABELS[preset], exact: true })
    .click()
  await expect
    .poll(async () => (await readThemeAttrs(page))["data-preset"])
    .toBe(preset)
}

test.describe("theme switcher popover", () => {
  test("opens from the header and closes with Escape", async ({ page }) => {
    const consoleWatch = watchConsole(page)
    await seedApp(page)
    await gotoApp(page, PROBE)
    await openThemeSwitcher(page)
    await expect(themeSwitcher(page)).toBeVisible()
    await closeThemeSwitcher(page)
    consoleWatch.assertClean()
  })

  test("renders every common axis section under the default preset", async ({
    page,
  }) => {
    await seedApp(page, { preset: "default", mode: "light" })
    await gotoApp(page, PROBE)
    await openThemeSwitcher(page)
    expect(await switcherSections(page)).toEqual([
      "Mode",
      "Preset",
      "Background",
      "Accent Color",
      "Surface Color",
      "Density",
      "Font Size",
      "Accent Vibrancy",
      "Elevation",
      "Button Elevation",
      "Surface Intensity",
      "Radius",
    ])
  })
})

test.describe("preset selection through the UI", () => {
  for (const preset of PRESETS) {
    test(`selecting "${PRESET_LABELS[preset]}" applies and persists`, async ({
      page,
    }) => {
      const consoleWatch = watchConsole(page)
      await seedApp(page, { preset: "default", mode: "dark" })
      await gotoApp(page, PROBE)
      await openThemeSwitcher(page)
      await selectPreset(page, preset)

      await page.reload()
      expect((await readThemeAttrs(page))["data-preset"]).toBe(preset)
      consoleWatch.assertClean()
    })

    test(`"${PRESET_LABELS[preset]}" hides the axes it takes over`, async ({
      page,
    }) => {
      await seedApp(page, { preset, mode: "dark" })
      await gotoApp(page, PROBE)
      await openThemeSwitcher(page)
      const sections = await switcherSections(page)

      const hiddenLabels: Record<string, string> = {
        elevation: "Elevation",
        buttonElevation: "Button Elevation",
        radius: "Radius",
        density: "Density",
        surfaceIntensity: "Surface Intensity",
      }
      for (const axis of HIDDEN_COMMON_AXES[preset]) {
        expect(sections, `${preset} must hide ${axis}`).not.toContain(
          hiddenLabels[axis],
        )
      }
      // Dark-only presets hide the Mode section entirely.
      if (["neon", "terminal", "scifi"].includes(preset)) {
        expect(sections).not.toContain("Mode")
      } else {
        expect(sections).toContain("Mode")
      }
      // Preset-specific axes must be offered.
      for (const axis of PRESET_AXES[preset]) {
        expect(sections).toContain(axis.label)
      }
    })
  }
})

test.describe("mode selection through the UI", () => {
  for (const [label, expected] of [
    ["Light", "light"],
    ["Dark", "dark"],
  ] as const) {
    test(`mode "${label}" applies`, async ({ page }) => {
      await seedApp(page, { preset: "default" })
      await gotoApp(page, PROBE)
      await openThemeSwitcher(page)
      await themeSwitcher(page)
        .locator('[aria-label="Mode"]')
        .getByRole("radio", { name: label })
        .click()
      await expect
        .poll(async () => (await readThemeAttrs(page))["data-mode"])
        .toBe(expected)
    })
  }

  test('mode "System" follows the emulated color scheme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" })
    await seedApp(page, { preset: "default", mode: "light" })
    await gotoApp(page, PROBE)
    await openThemeSwitcher(page)
    await themeSwitcher(page)
      .locator('[aria-label="Mode"]')
      .getByRole("radio", { name: "System" })
      .click()
    await expect
      .poll(async () => (await readThemeAttrs(page))["data-mode"])
      .toBe("dark")
  })
})

test.describe("accent and surface swatches", () => {
  test("every accent swatch is offered and selectable", async ({ page }) => {
    await seedApp(page, { preset: "default", mode: "light" })
    await gotoApp(page, PROBE)
    const panel = await openThemeSwitcher(page)
    const row = panel.locator(".dr-theme-switcher-row", {
      hasText: "Accent Color",
    })
    await expect(row.locator(".dr-theme-switcher-swatch")).toHaveCount(
      ACCENT_COLORS.length,
    )

    const seen = new Set<string>()
    for (const accent of ACCENT_COLORS) {
      const swatch = row.locator(`.dr-theme-switcher-swatch[title="${accent}"]`)
      await swatch.click()
      await expect(swatch).toHaveAttribute("data-active", "true")
      seen.add(await readToken(page, "--primary"))
    }
    expect(seen.size).toBe(ACCENT_COLORS.length)
  })

  test("every surface swatch is offered and selectable", async ({ page }) => {
    await seedApp(page, { preset: "default", mode: "dark" })
    await gotoApp(page, PROBE)
    const panel = await openThemeSwitcher(page)
    const row = panel.locator(".dr-theme-switcher-row", {
      hasText: "Surface Color",
    })
    await expect(row.locator(".dr-theme-switcher-swatch")).toHaveCount(
      SURFACE_COLORS.length,
    )

    const seen = new Set<string>()
    for (const surface of SURFACE_COLORS) {
      const swatch = row.locator(
        `.dr-theme-switcher-swatch[title="${surface}"]`,
      )
      await swatch.click()
      await expect(swatch).toHaveAttribute("data-active", "true")
      seen.add(await readToken(page, "--background"))
    }
    expect(seen.size).toBe(SURFACE_COLORS.length)
  })
})

test.describe("background controls", () => {
  test("gradient reveals intensity and pattern controls", async ({ page }) => {
    await seedApp(page, { preset: "default", backgroundStyle: "solid" })
    await gotoApp(page, PROBE)
    await openThemeSwitcher(page)

    expect(await switcherSections(page)).not.toContain("Gradient Pattern")

    await themeSwitcher(page)
      .locator('[aria-label="Background"]')
      .getByRole("radio", { name: "Gradient" })
      .click()

    await expect
      .poll(async () => await switcherSections(page))
      .toContain("Gradient Pattern")
    expect(await switcherSections(page)).toContain("Background Intensity")
  })

  for (const pattern of GRADIENT_PATTERNS) {
    test(`gradient pattern "${pattern}" selectable`, async ({ page }) => {
      await seedApp(page, { preset: "default", backgroundStyle: "gradient" })
      await gotoApp(page, PROBE)
      await openThemeSwitcher(page)
      await themeSwitcher(page)
        .locator('[aria-label="Gradient pattern"]')
        .getByRole("radio", { name: pattern })
        .click()
      await expect
        .poll(async () => (await readThemeAttrs(page))["data-gradient-pattern"])
        .toBe(pattern)
    })
  }

  test("switching back to solid hides the gradient controls", async ({
    page,
  }) => {
    await seedApp(page, { preset: "default", backgroundStyle: "gradient" })
    await gotoApp(page, PROBE)
    await openThemeSwitcher(page)
    await themeSwitcher(page)
      .locator('[aria-label="Background"]')
      .getByRole("radio", { name: "Solid" })
      .click()
    await expect
      .poll(async () => await switcherSections(page))
      .not.toContain("Gradient Pattern")
  })
})

test.describe("stepped slider axes", () => {
  const sliderAxes: {
    label: string
    values: readonly string[]
    attr: string
  }[] = [
    { label: "Density", values: DENSITIES, attr: "data-density" },
    { label: "Font size", values: FONT_SIZES, attr: "data-font-size" },
    { label: "Elevation", values: ELEVATIONS, attr: "data-elevation" },
    {
      label: "Button elevation",
      values: ELEVATIONS,
      attr: "data-button-elevation",
    },
    { label: "Radius", values: RADII, attr: "data-radius" },
    {
      label: "Surface Intensity",
      values: SURFACE_INTENSITIES,
      attr: "data-surface-intensity",
    },
  ]

  for (const axis of sliderAxes) {
    test(`${axis.label} slider walks every value`, async ({ page }) => {
      await seedApp(page, { preset: "default", mode: "light" })
      await gotoApp(page, PROBE)
      await openThemeSwitcher(page)

      for (let i = 0; i < axis.values.length; i++) {
        await setAxisSlider(page, axis.label, i)
        await expect
          .poll(async () => (await readThemeAttrs(page))[axis.attr])
          .toBe(axis.values[i])
      }
    })
  }
})

test.describe("preset-specific axis controls", () => {
  for (const preset of PRESETS) {
    for (const axis of PRESET_AXES[preset]) {
      test(`${PRESET_LABELS[preset]} · ${axis.label} control`, async ({
        page,
      }) => {
        await seedApp(page, { preset, mode: "dark" })
        await gotoApp(page, PROBE)
        await openThemeSwitcher(page)
        const attr = `data-${preset}-${axis.name}`

        if (axis.values.length === 4) {
          for (let i = 0; i < axis.values.length; i++) {
            await setAxisSlider(page, axis.label, i)
            await expect
              .poll(async () => (await readThemeAttrs(page))[attr])
              .toBe(axis.values[i])
          }
        } else {
          for (const value of axis.values) {
            await themeSwitcher(page)
              .locator(`[aria-label="${axis.label}"]`)
              .getByRole("radio", { name: value, exact: true })
              .click()
            await expect
              .poll(async () => (await readThemeAttrs(page))[attr])
              .toBe(value)
          }
        }
      })
    }
  }

  test("preset axis values are remembered per preset", async ({ page }) => {
    await seedApp(page, { preset: "glass", mode: "dark" })
    await gotoApp(page, PROBE)
    await openThemeSwitcher(page)

    await themeSwitcher(page)
      .locator('[aria-label="Halo"]')
      .getByRole("radio", { name: "pronounced", exact: true })
      .click()
    await expect
      .poll(async () => (await readThemeAttrs(page))["data-glass-halo"])
      .toBe("pronounced")

    await selectPreset(page, "playful")
    await selectPreset(page, "glass")

    await expect
      .poll(async () => (await readThemeAttrs(page))["data-glass-halo"])
      .toBe("pronounced")
  })
})

test.describe("theme changes reach rendered components", () => {
  test("radius change restyles a real button", async ({ page }) => {
    await seedApp(page, { preset: "default", mode: "light", radius: "sharp" })
    await gotoApp(page, PROBE)
    const button = page.locator("main button.dr-btn").first()
    const sharp = await button.evaluate(
      (el) => getComputedStyle(el).borderRadius,
    )

    await openThemeSwitcher(page)
    await setAxisSlider(page, "Radius", RADII.indexOf("pill"))
    await closeThemeSwitcher(page)

    await expect
      .poll(async () =>
        button.evaluate((el) => getComputedStyle(el).borderRadius),
      )
      .not.toBe(sharp)
  })

  test("font size change restyles body copy", async ({ page }) => {
    await seedApp(page, { preset: "default", fontSize: "small" })
    await gotoApp(page, PROBE)
    const copy = page.locator("main p").first()
    const before = await copy.evaluate((el) => getComputedStyle(el).fontSize)

    await openThemeSwitcher(page)
    await setAxisSlider(page, "Font size", FONT_SIZES.indexOf("extra-large"))
    await closeThemeSwitcher(page)

    const after = await copy.evaluate((el) => getComputedStyle(el).fontSize)
    expect(Number.parseFloat(after)).toBeGreaterThan(Number.parseFloat(before))
  })
})
