import { test, expect } from "@playwright/test"
import {
  ACCENT_COLORS,
  ACCENT_VIBRANCIES,
  BACKGROUND_INTENSITIES,
  CANVAS_TINTS,
  DARK_ONLY_PRESETS,
  DENSITIES,
  ELEVATIONS,
  FONT_SIZES,
  GRADIENT_PATTERNS,
  PRESETS,
  PRESET_AXES,
  PRESET_LABELS,
  RADII,
  SURFACE_COLORS,
  SURFACE_INTENSITIES,
  type Preset,
} from "./fixtures/theme"
import {
  applyTheme,
  gotoApp,
  readThemeAttrs,
  readToken,
  seedApp,
  watchConsole,
} from "./helpers/app"

/** A page that renders enough chrome to prove tokens reach real components. */
const PROBE = "/components/buttons"

test.describe("preset axis", () => {
  for (const preset of PRESETS) {
    test(`preset "${preset}" applies its attributes and tokens`, async ({
      page,
    }) => {
      const consoleWatch = watchConsole(page)
      await seedApp(page, { preset, mode: "light" })
      await gotoApp(page, PROBE)

      const attrs = await readThemeAttrs(page)
      expect(attrs["data-preset"]).toBe(preset)

      // Every preset axis gets its own attribute, seeded with the axis default.
      for (const axis of PRESET_AXES[preset]) {
        expect(attrs[`data-${preset}-${axis.name}`]).toBe(axis.default)
      }
      // Attributes from other presets must be cleared.
      for (const other of PRESETS) {
        if (other === preset) continue
        for (const axis of PRESET_AXES[other]) {
          expect(attrs[`data-${other}-${axis.name}`]).toBeUndefined()
        }
      }

      expect(await readToken(page, "--primary")).not.toBe("")
      expect(await readToken(page, "--background")).not.toBe("")
      consoleWatch.assertClean()
    })

    test(`preset "${preset}" survives a reload`, async ({ page }) => {
      await seedApp(page, { preset })
      await gotoApp(page, PROBE)
      await page.reload()
      const attrs = await readThemeAttrs(page)
      expect(attrs["data-preset"]).toBe(preset)
    })
  }

  for (const preset of DARK_ONLY_PRESETS) {
    test(`preset "${preset}" forces dark mode when switched at runtime`, async ({
      page,
    }) => {
      await seedApp(page, { preset: "default", mode: "light" })
      await gotoApp(page, PROBE)
      await page.getByRole("button", { name: "Customize theme" }).click()
      const label = PRESET_LABELS[preset]
      await page
        .locator('[aria-label="Preset"]')
        .getByRole("radio", { name: label, exact: true })
        .click()
      await expect
        .poll(async () => (await readThemeAttrs(page))["data-mode"])
        .toBe("dark")
    })

    test(`preset "${preset}" forces dark mode at boot`, async ({ page }) => {
      // Both paths must enforce `supportedModes`: the runtime setPreset call
      // and the boot path that reads localStorage / themeConfig defaults.
      await seedApp(page, { preset, mode: "light" })
      await gotoApp(page, PROBE)
      expect((await readThemeAttrs(page))["data-mode"]).toBe("dark")
    })
  }

  test("presets produce distinct surface tokens", async ({ page }) => {
    const seen = new Map<string, string>()
    await seedApp(page)
    await gotoApp(page, PROBE)
    for (const preset of PRESETS) {
      await applyTheme(page, { preset, mode: "dark" })
      await page.reload()
      seen.set(preset, await readToken(page, "--surface-raised"))
    }
    const values = [...seen.values()]
    expect(values.every((v) => v !== "")).toBe(true)
    // Not every preset has to differ from every other, but a single shared
    // value across all six would mean the recipes are not being applied.
    expect(new Set(values).size).toBeGreaterThan(1)
  })
})

test.describe("preset-specific axes", () => {
  for (const preset of PRESETS) {
    for (const axis of PRESET_AXES[preset]) {
      for (const value of axis.values) {
        test(`${preset} · ${axis.name} = ${value}`, async ({ page }) => {
          const consoleWatch = watchConsole(page)
          await seedApp(page, {
            preset,
            presetAxes: { [preset]: { [axis.name]: value } },
          })
          await gotoApp(page, PROBE)
          const attrs = await readThemeAttrs(page)
          expect(attrs[`data-${preset}-${axis.name}`]).toBe(value)
          consoleWatch.assertClean()
        })
      }
    }
  }
})

test.describe("mode axis", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mode "${mode}" resolves on <html>`, async ({ page }) => {
      await seedApp(page, { mode, preset: "default" })
      await gotoApp(page, PROBE)
      expect((await readThemeAttrs(page))["data-mode"]).toBe(mode)
    })
  }

  for (const scheme of ["light", "dark"] as const) {
    test(`mode "system" follows prefers-color-scheme: ${scheme}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await seedApp(page, { mode: "system", preset: "default" })
      await gotoApp(page, PROBE)
      expect((await readThemeAttrs(page))["data-mode"]).toBe(scheme)
    })
  }

  test("light and dark produce different background tokens", async ({
    page,
  }) => {
    await seedApp(page, { mode: "light", preset: "default" })
    await gotoApp(page, PROBE)
    const light = await readToken(page, "--background")

    await applyTheme(page, { mode: "dark", preset: "default" })
    await page.reload()
    const dark = await readToken(page, "--background")

    expect(light).not.toBe(dark)
  })
})

test.describe("accent color axis", () => {
  for (const accent of ACCENT_COLORS) {
    test(`accent "${accent}" drives --primary`, async ({ page }) => {
      await seedApp(page, { accent, preset: "default", mode: "light" })
      await gotoApp(page, PROBE)
      expect(await readToken(page, "--primary"), accent).not.toBe("")
    })
  }

  test("every accent yields a distinct --primary", async ({ page }) => {
    const values: string[] = []
    await seedApp(page)
    await gotoApp(page, PROBE)
    for (const accent of ACCENT_COLORS) {
      await applyTheme(page, { accent, preset: "default", mode: "light" })
      await page.reload()
      values.push(await readToken(page, "--primary"))
    }
    expect(new Set(values).size).toBe(ACCENT_COLORS.length)
  })
})

test.describe("accent vibrancy axis", () => {
  test("each step emits a distinct --primary-fill in dark mode", async ({
    page,
  }) => {
    const consoleWatch = watchConsole(page)
    // Fuchsia is the one accent whose --primary also moves across steps, so a
    // single test covers both tokens. The axis is inert in light mode.
    await seedApp(page, { accent: "fuchsia", mode: "dark" })
    await gotoApp(page, PROBE)

    const seen = new Set<string>()
    for (const vibrancy of ACCENT_VIBRANCIES) {
      await applyTheme(page, { accentVibrancy: vibrancy })
      await page.reload()
      const fill = await readToken(page, "--primary-fill")
      expect(fill, `${vibrancy} must emit a fill`).not.toBe("")
      seen.add(fill)
    }
    expect(seen.size).toBe(ACCENT_VIBRANCIES.length)

    consoleWatch.assertClean()
  })

  test("the axis is inert in light mode", async ({ page }) => {
    await seedApp(page, { accent: "fuchsia", mode: "light" })
    await gotoApp(page, PROBE)

    await applyTheme(page, { accentVibrancy: "calm" })
    await page.reload()
    const calm = await readToken(page, "--primary-fill")

    await applyTheme(page, { accentVibrancy: "intense" })
    await page.reload()
    expect(await readToken(page, "--primary-fill")).toBe(calm)
  })

  test("no data attribute leaks for this axis", async ({ page }) => {
    await seedApp(page, { accentVibrancy: "vivid", mode: "dark" })
    await gotoApp(page, PROBE)

    const attrs = await readThemeAttrs(page)
    expect(attrs["data-accent-vibrancy"]).toBeUndefined()
  })
})

test.describe("surface color axis", () => {
  for (const surface of SURFACE_COLORS) {
    test(`surface "${surface}" applies`, async ({ page }) => {
      const consoleWatch = watchConsole(page)
      await seedApp(page, { surface, preset: "default", mode: "dark" })
      await gotoApp(page, PROBE)
      expect(await readToken(page, "--background")).not.toBe("")
      consoleWatch.assertClean()
    })
  }

  test("every surface yields a distinct --background in dark mode", async ({
    page,
  }) => {
    const values: string[] = []
    await seedApp(page)
    await gotoApp(page, PROBE)
    for (const surface of SURFACE_COLORS) {
      await applyTheme(page, { surface, preset: "default", mode: "dark" })
      await page.reload()
      values.push(await readToken(page, "--background"))
    }
    expect(new Set(values).size).toBe(SURFACE_COLORS.length)
  })
})

test.describe("background style axis", () => {
  test("solid background sets the attribute", async ({ page }) => {
    await seedApp(page, { backgroundStyle: "solid", preset: "default" })
    await gotoApp(page, PROBE)
    expect((await readThemeAttrs(page))["data-background-style"]).toBe("solid")
  })

  for (const intensity of BACKGROUND_INTENSITIES) {
    test(`gradient · intensity "${intensity}"`, async ({ page }) => {
      const consoleWatch = watchConsole(page)
      await seedApp(page, {
        backgroundStyle: "gradient",
        backgroundIntensity: intensity,
        preset: "default",
      })
      await gotoApp(page, PROBE)
      const attrs = await readThemeAttrs(page)
      expect(attrs["data-background-style"]).toBe("gradient")
      expect(attrs["data-background-intensity"]).toBe(intensity)
      expect(await readToken(page, "--canvas-blob-scale")).not.toBe("")
      consoleWatch.assertClean()
    })
  }

  test("intensity scales the blob token monotonically", async ({ page }) => {
    const scales: number[] = []
    await seedApp(page)
    await gotoApp(page, PROBE)
    for (const intensity of BACKGROUND_INTENSITIES) {
      await applyTheme(page, {
        backgroundStyle: "gradient",
        backgroundIntensity: intensity,
        preset: "default",
      })
      await page.reload()
      scales.push(Number(await readToken(page, "--canvas-blob-scale")))
    }
    for (let i = 1; i < scales.length; i++) {
      expect(scales[i]).toBeGreaterThan(scales[i - 1])
    }
  })

  for (const pattern of GRADIENT_PATTERNS) {
    test(`gradient · pattern "${pattern}"`, async ({ page }) => {
      const consoleWatch = watchConsole(page)
      await seedApp(page, {
        backgroundStyle: "gradient",
        gradientPattern: pattern,
        preset: "default",
      })
      await gotoApp(page, PROBE)
      expect((await readThemeAttrs(page))["data-gradient-pattern"]).toBe(
        pattern,
      )
      consoleWatch.assertClean()
    })
  }
})

test.describe("density axis", () => {
  for (const density of DENSITIES) {
    test(`density "${density}"`, async ({ page }) => {
      await seedApp(page, { density, preset: "default" })
      await gotoApp(page, PROBE)
      expect((await readThemeAttrs(page))["data-density"]).toBe(density)
      expect(await readToken(page, "--density-button-px")).not.toBe("")
    })
  }

  test("density scales control padding monotonically", async ({ page }) => {
    const values: number[] = []
    await seedApp(page)
    await gotoApp(page, PROBE)
    for (const density of DENSITIES) {
      await applyTheme(page, { density, preset: "default" })
      await page.reload()
      values.push(
        Number.parseFloat(await readToken(page, "--density-button-px")),
      )
    }
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1])
    }
  })
})

test.describe("font size axis", () => {
  for (const fontSize of FONT_SIZES) {
    test(`font size "${fontSize}"`, async ({ page }) => {
      await seedApp(page, { fontSize, preset: "default" })
      await gotoApp(page, PROBE)
      expect((await readThemeAttrs(page))["data-font-size"]).toBe(fontSize)
    })
  }

  test("font size scales --text-base monotonically", async ({ page }) => {
    const values: number[] = []
    await seedApp(page)
    await gotoApp(page, PROBE)
    for (const fontSize of FONT_SIZES) {
      await applyTheme(page, { fontSize, preset: "default" })
      await page.reload()
      values.push(Number.parseFloat(await readToken(page, "--text-base")))
    }
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1])
    }
  })
})

test.describe("elevation axes", () => {
  for (const elevation of ELEVATIONS) {
    test(`elevation "${elevation}"`, async ({ page }) => {
      await seedApp(page, { elevation, preset: "default" })
      await gotoApp(page, PROBE)
      expect((await readThemeAttrs(page))["data-elevation"]).toBe(elevation)
      expect(await readToken(page, "--elevation-current")).not.toBe("")
    })
  }

  for (const buttonElevation of ELEVATIONS) {
    test(`button elevation "${buttonElevation}"`, async ({ page }) => {
      await seedApp(page, { buttonElevation, preset: "default" })
      await gotoApp(page, PROBE)
      expect((await readThemeAttrs(page))["data-button-elevation"]).toBe(
        buttonElevation,
      )
      const shadow = await readToken(page, "--shadow-button")
      expect(shadow).not.toBe("")
      if (buttonElevation === "flat") {
        expect(shadow).toContain("transparent")
      } else {
        expect(shadow).not.toContain("transparent")
      }
    })
  }
})

test.describe("surface intensity axis", () => {
  for (const surfaceIntensity of SURFACE_INTENSITIES) {
    test(`surface intensity "${surfaceIntensity}"`, async ({ page }) => {
      await seedApp(page, { surfaceIntensity, preset: "default" })
      await gotoApp(page, PROBE)
      expect((await readThemeAttrs(page))["data-surface-intensity"]).toBe(
        surfaceIntensity,
      )
    })
  }
})

test.describe("canvas tint axis", () => {
  test("each canvas tint step yields a distinct background", async ({
    page,
  }) => {
    await seedApp(page, { surface: "violet", mode: "dark" })
    await gotoApp(page, PROBE)

    const seen = new Set<string>()
    for (const tint of CANVAS_TINTS) {
      await applyTheme(page, { canvasTint: tint })
      await page.reload()
      const bg = await readToken(page, "--background")
      expect(bg, `${tint} must emit a background`).not.toBe("")
      seen.add(bg)
    }
    expect(seen.size).toBe(CANVAS_TINTS.length)
  })

  test("the axis is inert in light mode", async ({ page }) => {
    await seedApp(page, { surface: "violet", mode: "light" })
    await gotoApp(page, PROBE)

    await applyTheme(page, { canvasTint: "neutral" })
    await page.reload()
    const neutral = await readToken(page, "--background")

    await applyTheme(page, { canvasTint: "vivid" })
    await page.reload()
    expect(await readToken(page, "--background")).toBe(neutral)
  })

  test("no data attribute leaks for this axis", async ({ page }) => {
    await seedApp(page, { canvasTint: "neutral", mode: "dark" })
    await gotoApp(page, PROBE)

    const attrs = await readThemeAttrs(page)
    expect(attrs["data-canvas-tint"]).toBeUndefined()
  })
})

test.describe("radius axis", () => {
  const expected: Record<string, string> = {
    sharp: "0",
    subtle: "0.25rem",
    rounded: "0.5rem",
    pill: "1rem",
  }
  for (const radius of RADII) {
    test(`radius "${radius}"`, async ({ page }) => {
      await seedApp(page, { radius, preset: "default" })
      await gotoApp(page, PROBE)
      expect((await readThemeAttrs(page))["data-radius"]).toBe(radius)
      expect(await readToken(page, "--radius")).toBe(expected[radius])
    })
  }

  test("pill radius rounds buttons fully", async ({ page }) => {
    await seedApp(page, { radius: "pill", preset: "default" })
    await gotoApp(page, PROBE)
    expect(await readToken(page, "--radius-button")).toBe("9999px")
  })
})

test.describe("axis combinations", () => {
  const combos: {
    name: string
    seed: Parameters<typeof seedApp>[1]
    expect: Record<string, string>
  }[] = [
    {
      name: "glass · gradient · spacious · pill · extra-large",
      seed: {
        preset: "glass",
        mode: "dark",
        backgroundStyle: "gradient",
        backgroundIntensity: "intense",
        gradientPattern: "mesh",
        density: "spacious",
        radius: "pill",
        fontSize: "extra-large",
        accent: "violet",
        surface: "indigo",
        presetAxes: {
          glass: { opacity: "strong", blur: "high", halo: "pronounced" },
        },
      },
      expect: {
        "data-preset": "glass",
        "data-mode": "dark",
        "data-background-style": "gradient",
        "data-background-intensity": "intense",
        "data-gradient-pattern": "mesh",
        "data-density": "spacious",
        "data-radius": "pill",
        "data-font-size": "extra-large",
        "data-glass-opacity": "strong",
        "data-glass-blur": "high",
        "data-glass-halo": "pronounced",
      },
    },
    {
      name: "terminal · compact · sharp · small",
      seed: {
        preset: "terminal",
        mode: "dark",
        density: "compact",
        radius: "sharp",
        fontSize: "small",
        accent: "green",
        presetAxes: { terminal: { phosphor: "bright", scanlines: "visible" } },
      },
      expect: {
        "data-preset": "terminal",
        "data-mode": "dark",
        "data-terminal-phosphor": "bright",
        "data-terminal-scanlines": "visible",
      },
    },
    {
      name: "scifi · intense · bracketed",
      seed: {
        preset: "scifi",
        mode: "dark",
        accent: "cyan",
        surface: "slate",
        presetAxes: { scifi: { intensity: "intense", frame: "bracketed" } },
      },
      expect: {
        "data-preset": "scifi",
        "data-mode": "dark",
        "data-scifi-intensity": "intense",
        "data-scifi-frame": "bracketed",
      },
    },
    {
      name: "playful · exuberant · comfortable",
      seed: {
        preset: "playful",
        mode: "light",
        density: "comfortable",
        accent: "pink",
        presetAxes: { playful: { pop: "exuberant" } },
      },
      expect: {
        "data-preset": "playful",
        "data-mode": "light",
        "data-density": "comfortable",
        "data-playful-pop": "exuberant",
      },
    },
    {
      name: "neon · intense glow · gradient aurora",
      seed: {
        preset: "neon",
        mode: "dark",
        accent: "fuchsia",
        backgroundStyle: "gradient",
        gradientPattern: "aurora",
        backgroundIntensity: "vivid",
        presetAxes: { neon: { glow: "intense" } },
      },
      expect: {
        "data-preset": "neon",
        "data-mode": "dark",
        "data-neon-glow": "intense",
        "data-gradient-pattern": "aurora",
      },
    },
  ]

  for (const combo of combos) {
    test(combo.name, async ({ page }) => {
      const consoleWatch = watchConsole(page)
      await seedApp(page, combo.seed)
      await gotoApp(page, PROBE)
      const attrs = await readThemeAttrs(page)
      for (const [key, value] of Object.entries(combo.expect)) {
        expect(attrs[key], key).toBe(value)
      }
      await expect(page.locator("main h1").first()).toBeVisible()
      consoleWatch.assertClean()
    })
  }
})

test.describe("theme persistence", () => {
  // canvasTint is deliberately omitted from this seed: readThemeAttrs only
  // collects data-* attributes, and canvasTint writes none, so it would add
  // a seed value the before/after comparison can never fail on. Its
  // round-trip is instead covered by the per-step reload loop in the
  // "canvas tint axis" describe block above, which compares --background.
  test("all axes round-trip through localStorage", async ({ page }) => {
    const seed = {
      preset: "glass" as Preset,
      mode: "dark",
      accent: "teal",
      surface: "rose",
      backgroundStyle: "gradient",
      backgroundIntensity: "vivid",
      gradientPattern: "spotlight",
      density: "compact",
      elevation: "high",
      buttonElevation: "high",
      surfaceIntensity: "bold",
      radius: "sharp",
      fontSize: "large",
    }
    await seedApp(page, seed)
    await gotoApp(page, PROBE)
    const before = await readThemeAttrs(page)

    await page.reload()
    await page.goto("/settings")
    await page.goto(PROBE)

    expect(await readThemeAttrs(page)).toEqual(before)
  })
})
