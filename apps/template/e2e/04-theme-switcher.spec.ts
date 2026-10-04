import { test, expect, type Page } from "@playwright/test"
import {
  ACCENT_COLORS,
  CONTRASTS,
  DARK_ACCENT_CHROMAS,
  DENSITIES,
  ELEVATIONS,
  FONT_SIZES,
  GLASS_BLURS,
  GLASS_OPACITIES,
  GRADIENT_PATTERNS,
  RADII,
  STYLES,
  SURFACE_COLORS,
  type Style,
} from "./fixtures/theme"
import {
  closeThemeSwitcher,
  gotoApp,
  openAdvanced,
  openThemeSwitcher,
  readThemeAttrs,
  readToken,
  reloadApp,
  seedApp,
  setAxisSlider,
  switcherSections,
  themeSwitcher,
  watchConsole,
} from "./helpers/app"

const PROBE = "/components/buttons"

const BRAND_SECTIONS = [
  "Mode",
  "Accent Color",
  "Surface Color",
  "Tint With Accent",
  "Style",
  "Font",
  "Radius",
  "Density",
  "Font Size",
]

// Gradient Pattern is absent: these cases seed a solid background.
const ADVANCED_SECTIONS = [
  "Contrast",
  "Dark Accent Chroma",
  "Elevation",
  "Outer Glow",
  "Inner Glow",
  "Background",
  "Background Intensity",
  "Sidebar Indicator",
]

/** The switcher's option label for each style. */
const STYLE_LABELS: Record<Style, string> = {
  flat: "Flat",
  quiet: "Quiet",
  tactile: "Tactile",
  glass: "Glass",
}

const GLASS_OPACITY_LABEL = "Opacity"
const GLASS_BLUR_LABEL = "Backdrop Blur"

async function selectStyle(page: Page, style: Style) {
  await themeSwitcher(page)
    .locator('[aria-label="Style"]')
    .getByRole("radio", { name: STYLE_LABELS[style], exact: true })
    .click()
  await expect
    .poll(async () => (await readThemeAttrs(page))["data-style"])
    .toBe(style)
}

function glassOpacityOption(page: Page, value: string) {
  return themeSwitcher(page)
    .locator(`[aria-label="${GLASS_OPACITY_LABEL}"]`)
    .getByRole("radio", { name: value, exact: true })
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

  test("renders the Brand axes, then the Advanced axes once opened", async ({
    page,
  }) => {
    await seedApp(page, { style: "quiet", mode: "light" })
    await gotoApp(page, PROBE)
    const panel = await openThemeSwitcher(page)
    await expect(panel.locator(".dr-theme-switcher-section-label")).toHaveText(
      BRAND_SECTIONS,
    )
    expect(await switcherSections(page)).toEqual([
      ...BRAND_SECTIONS,
      ...ADVANCED_SECTIONS,
    ])
  })
})


test.describe("style selection through the UI", () => {
  for (const style of STYLES) {
    test(`selecting "${STYLE_LABELS[style]}" applies and persists`, async ({
      page,
    }) => {
      const consoleWatch = watchConsole(page)
      await seedApp(page, { style: "quiet", mode: "dark" })
      await gotoApp(page, PROBE)
      await openThemeSwitcher(page)
      await selectStyle(page, style)

      await reloadApp(page)
      expect((await readThemeAttrs(page))["data-style"]).toBe(style)
      consoleWatch.assertClean()
    })

    test(`"${STYLE_LABELS[style]}" shows the glass axes only under glass`, async ({
      page,
    }) => {
      await seedApp(page, { style, mode: "dark" })
      await gotoApp(page, PROBE)
      await openThemeSwitcher(page)
      const sections = await switcherSections(page)

      expect(sections).toContain("Mode")
      expect(sections).toContain("Contrast")
      const at = sections.indexOf("Style")
      expect(at).toBeGreaterThan(-1)
      if (style === "glass") {
        expect(sections.slice(at + 1, at + 3)).toEqual([
          GLASS_OPACITY_LABEL,
          GLASS_BLUR_LABEL,
        ])
      } else {
        expect(sections).not.toContain(GLASS_OPACITY_LABEL)
        expect(sections).not.toContain(GLASS_BLUR_LABEL)
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
      await seedApp(page, { style: "quiet" })
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
    await seedApp(page, { style: "quiet", mode: "light" })
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
    await seedApp(page, { style: "quiet", mode: "light" })
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
      const title = accent === "neutral" ? "Neutral (near-black)" : accent
      const swatch = row.locator(`.dr-theme-switcher-swatch[title="${title}"]`)
      await swatch.click()
      await expect(swatch).toHaveAttribute("data-active", "true")
      seen.add(await readToken(page, "--primary"))
    }
    expect(seen.size).toBe(ACCENT_COLORS.length)
  })

  test("the neutral accent hides Tint With Accent", async ({ page }) => {
    await seedApp(page, { style: "quiet", mode: "light", accent: "blue" })
    await gotoApp(page, PROBE)
    const panel = await openThemeSwitcher(page)
    expect(await switcherSections(page)).toContain("Tint With Accent")

    await panel
      .locator('.dr-theme-switcher-swatch[title="Neutral (near-black)"]')
      .click()
    await expect
      .poll(async () => await switcherSections(page))
      .not.toContain("Tint With Accent")
  })

  test("every surface swatch is offered and selectable", async ({ page }) => {
    await seedApp(page, { style: "quiet", mode: "dark" })
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
    await seedApp(page, { style: "quiet", backgroundStyle: "solid" })
    await gotoApp(page, PROBE)
    await openThemeSwitcher(page)
    await openAdvanced(page)

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
      await seedApp(page, { style: "quiet", backgroundStyle: "gradient" })
      await gotoApp(page, PROBE)
      await openThemeSwitcher(page)
      await openAdvanced(page)
      await themeSwitcher(page)
        .locator('[aria-label="Gradient Pattern"]')
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
    await seedApp(page, { style: "quiet", backgroundStyle: "gradient" })
    await gotoApp(page, PROBE)
    await openThemeSwitcher(page)
    await openAdvanced(page)
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
    { label: "Radius", values: RADII, attr: "data-radius" },
  ]

  for (const axis of sliderAxes) {
    test(`${axis.label} slider walks every value`, async ({ page }) => {
      await seedApp(page, { style: "quiet", mode: "light" })
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

test.describe("advanced toggle-group axes", () => {
  const toggleAxes: {
    label: string
    values: readonly string[]
    attr: string
  }[] = [
    { label: "Elevation", values: ELEVATIONS, attr: "data-elevation" },
    { label: "Contrast", values: CONTRASTS, attr: "data-contrast" },
    {
      label: "Dark Accent Chroma",
      values: DARK_ACCENT_CHROMAS,
      attr: "data-dark-accent-chroma",
    },
  ]

  for (const axis of toggleAxes) {
    test(`${axis.label} toggle group sets every value`, async ({ page }) => {
      await seedApp(page, { style: "quiet", mode: "dark" })
      await gotoApp(page, PROBE)
      await openThemeSwitcher(page)
      await openAdvanced(page)
      const group = themeSwitcher(page).getByRole("radiogroup", {
        name: axis.label,
        exact: true,
      })

      for (const value of axis.values) {
        await group.getByRole("radio", { name: value, exact: true }).click()
        await expect
          .poll(async () => (await readThemeAttrs(page))[axis.attr])
          .toBe(value)
      }
    })
  }
})


test.describe("glass axis controls", () => {
  test(`${GLASS_OPACITY_LABEL} toggle group sets every value`, async ({
    page,
  }) => {
    await seedApp(page, { style: "glass", mode: "dark" })
    await gotoApp(page, PROBE)
    await openThemeSwitcher(page)
    for (const value of GLASS_OPACITIES) {
      await glassOpacityOption(page, value).click()
      await expect
        .poll(async () => (await readThemeAttrs(page))["data-glass-opacity"])
        .toBe(value)
    }
  })

  test(`${GLASS_BLUR_LABEL} slider walks every value`, async ({ page }) => {
    await seedApp(page, { style: "glass", mode: "dark" })
    await gotoApp(page, PROBE)
    await openThemeSwitcher(page)
    for (let i = 0; i < GLASS_BLURS.length; i++) {
      await setAxisSlider(page, GLASS_BLUR_LABEL, i)
      await expect
        .poll(async () => (await readThemeAttrs(page))["data-glass-blur"])
        .toBe(GLASS_BLURS[i])
    }
  })

  test("glass axis values survive switching style away and back", async ({
    page,
  }) => {
    await seedApp(page, { style: "glass", mode: "dark" })
    await gotoApp(page, PROBE)
    await openThemeSwitcher(page)

    await glassOpacityOption(page, "strong").click()
    await setAxisSlider(page, GLASS_BLUR_LABEL, GLASS_BLURS.indexOf("low"))
    await expect
      .poll(async () => {
        const attrs = await readThemeAttrs(page)
        return [attrs["data-glass-opacity"], attrs["data-glass-blur"]]
      })
      .toEqual(["strong", "low"])

    await selectStyle(page, "quiet")
    await expect
      .poll(async () => await switcherSections(page))
      .not.toContain(GLASS_OPACITY_LABEL)
    // Hidden, not cleared: the attributes stay stamped under every style.
    const underQuiet = await readThemeAttrs(page)
    expect(underQuiet["data-glass-opacity"]).toBe("strong")
    expect(underQuiet["data-glass-blur"]).toBe("low")

    await selectStyle(page, "glass")
    await expect(glassOpacityOption(page, "strong")).toBeChecked()
    await expect(
      themeSwitcher(page).getByRole("slider", { name: GLASS_BLUR_LABEL }),
    ).toHaveAttribute("aria-valuenow", String(GLASS_BLURS.indexOf("low")))

    await reloadApp(page)
    const reloaded = await readThemeAttrs(page)
    expect(reloaded["data-glass-opacity"]).toBe("strong")
    expect(reloaded["data-glass-blur"]).toBe("low")
  })
})

test.describe("theme changes reach rendered components", () => {
  test("radius change restyles a real button", async ({ page }) => {
    await seedApp(page, { style: "quiet", mode: "light", radius: "sharp" })
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
    await seedApp(page, { style: "quiet", fontSize: "small" })
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
