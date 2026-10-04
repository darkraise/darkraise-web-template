import { test, expect } from "@playwright/test"
import {
  ACCENT_COLORS,
  BACKGROUND_INTENSITIES,
  CONTRASTS,
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
  applyTheme,
  gotoApp,
  readThemeAttrs,
  readToken,
  readTokens,
  reloadApp,
  seedApp,
  watchConsole,
} from "./helpers/app"

/** A page that renders enough chrome to prove tokens reach real components. */
const PROBE = "/components/buttons"

/** Engine tokens content reads; no style may change them. */
const CONTENT_TOKENS = [
  "--primary",
  "--muted",
  "--accent",
  "--secondary",
  "--border",
  "--card",
]

test.describe("style axis", () => {
  for (const style of STYLES) {
    test(`style "${style}" applies its attributes and tokens`, async ({
      page,
    }) => {
      const consoleWatch = watchConsole(page)
      await seedApp(page, { style, mode: "light" })
      await gotoApp(page, PROBE)

      const attrs = await readThemeAttrs(page)
      expect(attrs["data-style"]).toBe(style)
      expect(attrs["data-preset"]).toBeUndefined()
      // Ordinary axes: stamped under every style, read only by glass.css.
      expect(attrs["data-glass-opacity"]).toBe("medium")
      expect(attrs["data-glass-blur"]).toBe("medium")

      expect(await readToken(page, "--primary")).not.toBe("")
      expect(await readToken(page, "--background")).not.toBe("")
      consoleWatch.assertClean()
    })

    test(`style "${style}" survives a reload`, async ({ page }) => {
      await seedApp(page, { style })
      await gotoApp(page, PROBE)
      await reloadApp(page)
      const attrs = await readThemeAttrs(page)
      expect(attrs["data-style"]).toBe(style)
    })
  }

  test("styles leave the content tokens alone", async ({ page }) => {
    // Glass frosts chrome and overlays only, so content keeps Quiet's colours.
    const seen = new Map<Style, Record<string, string>>()
    await seedApp(page)
    await gotoApp(page, PROBE)
    for (const style of STYLES) {
      await applyTheme(page, { style, mode: "dark", backgroundStyle: "solid" })
      await reloadApp(page)
      seen.set(style, await readTokens(page, CONTENT_TOKENS))
    }
    const quiet = seen.get("quiet") ?? {}
    for (const name of CONTENT_TOKENS) expect(quiet[name], name).not.toBe("")
    for (const style of STYLES) expect(seen.get(style), style).toEqual(quiet)
  })

  test("styles set the button token family", async ({ page }) => {
    const shadows = new Map<Style, string>()
    await seedApp(page)
    await gotoApp(page, PROBE)
    for (const style of STYLES) {
      await applyTheme(page, { style, mode: "light" })
      await reloadApp(page)
      shadows.set(style, await readToken(page, "--btn-shadow"))
    }
    expect(shadows.get("flat")).toContain("transparent")
    expect(shadows.get("quiet")).not.toContain("transparent")
    expect(shadows.get("tactile")).not.toContain("transparent")
    expect(shadows.get("tactile")).not.toBe(shadows.get("quiet"))
    // Glass restyles no content control, so its buttons are Quiet's.
    expect(shadows.get("glass")).toBe(shadows.get("quiet"))
  })
})

test.describe("glass axes", () => {
  for (const glassOpacity of GLASS_OPACITIES) {
    test(`glass opacity = ${glassOpacity}`, async ({ page }) => {
      const consoleWatch = watchConsole(page)
      await seedApp(page, { style: "glass", glassOpacity })
      await gotoApp(page, PROBE)
      const attrs = await readThemeAttrs(page)
      expect(attrs["data-glass-opacity"]).toBe(glassOpacity)
      consoleWatch.assertClean()
    })
  }

  for (const glassBlur of GLASS_BLURS) {
    test(`glass blur = ${glassBlur}`, async ({ page }) => {
      const consoleWatch = watchConsole(page)
      await seedApp(page, { style: "glass", glassBlur })
      await gotoApp(page, PROBE)
      const attrs = await readThemeAttrs(page)
      expect(attrs["data-glass-blur"]).toBe(glassBlur)
      consoleWatch.assertClean()
    })
  }
})

test.describe("mode axis", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mode "${mode}" resolves on <html>`, async ({ page }) => {
      await seedApp(page, { mode, style: "quiet" })
      await gotoApp(page, PROBE)
      expect((await readThemeAttrs(page))["data-mode"]).toBe(mode)
    })
  }

  for (const scheme of ["light", "dark"] as const) {
    test(`mode "system" follows prefers-color-scheme: ${scheme}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await seedApp(page, { mode: "system", style: "quiet" })
      await gotoApp(page, PROBE)
      expect((await readThemeAttrs(page))["data-mode"]).toBe(scheme)
    })
  }

  test("light and dark produce different background tokens", async ({
    page,
  }) => {
    await seedApp(page, { mode: "light", style: "quiet" })
    await gotoApp(page, PROBE)
    const light = await readToken(page, "--background")

    await applyTheme(page, { mode: "dark", style: "quiet" })
    await reloadApp(page)
    const dark = await readToken(page, "--background")

    expect(light).not.toBe(dark)
  })
})

test.describe("accent color axis", () => {
  for (const accent of ACCENT_COLORS) {
    test(`accent "${accent}" drives --primary`, async ({ page }) => {
      await seedApp(page, { accent, style: "quiet", mode: "light" })
      await gotoApp(page, PROBE)
      expect(await readToken(page, "--primary"), accent).not.toBe("")
    })
  }

  test("every accent yields a distinct --primary", async ({ page }) => {
    const values: string[] = []
    await seedApp(page)
    await gotoApp(page, PROBE)
    for (const accent of ACCENT_COLORS) {
      await applyTheme(page, { accent, style: "quiet", mode: "light" })
      await reloadApp(page)
      values.push(await readToken(page, "--primary"))
    }
    expect(new Set(values).size).toBe(ACCENT_COLORS.length)
  })
})

test.describe("dark accent chroma axis", () => {
  test("calm and vivid emit different --primary-fill values in dark mode", async ({
    page,
  }) => {
    const consoleWatch = watchConsole(page)
    await seedApp(page, { accent: "fuchsia", mode: "dark" })
    await gotoApp(page, PROBE)

    await applyTheme(page, { darkAccentChroma: "calm" })
    await reloadApp(page)
    const calm = await readToken(page, "--primary-fill")
    expect(calm).not.toBe("")

    await applyTheme(page, { darkAccentChroma: "vivid" })
    await reloadApp(page)
    const vivid = await readToken(page, "--primary-fill")
    expect(vivid).not.toBe("")
    expect(vivid).not.toBe(calm)

    consoleWatch.assertClean()
  })

  test("--primary-fill stays put in light mode", async ({ page }) => {
    await seedApp(page, { accent: "fuchsia", mode: "light" })
    await gotoApp(page, PROBE)

    await applyTheme(page, { darkAccentChroma: "calm" })
    await reloadApp(page)
    const calm = await readToken(page, "--primary-fill")

    await applyTheme(page, { darkAccentChroma: "vivid" })
    await reloadApp(page)
    expect(await readToken(page, "--primary-fill")).toBe(calm)
  })

  test("writes the stored value to its data attribute", async ({ page }) => {
    await seedApp(page, { darkAccentChroma: "vivid", mode: "dark" })
    await gotoApp(page, PROBE)

    const attrs = await readThemeAttrs(page)
    expect(attrs["data-dark-accent-chroma"]).toBe("vivid")
  })
})

test.describe("surface color axis", () => {
  for (const surface of SURFACE_COLORS) {
    test(`surface "${surface}" applies`, async ({ page }) => {
      const consoleWatch = watchConsole(page)
      await seedApp(page, { surface, style: "quiet", mode: "dark" })
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
      await applyTheme(page, { surface, style: "quiet", mode: "dark" })
      await reloadApp(page)
      values.push(await readToken(page, "--background"))
    }
    expect(new Set(values).size).toBe(SURFACE_COLORS.length)
  })
})

test.describe("background style axis", () => {
  test("solid background sets the attribute", async ({ page }) => {
    await seedApp(page, { backgroundStyle: "solid", style: "quiet" })
    await gotoApp(page, PROBE)
    expect((await readThemeAttrs(page))["data-background-style"]).toBe("solid")
  })

  for (const intensity of BACKGROUND_INTENSITIES) {
    test(`gradient · intensity "${intensity}"`, async ({ page }) => {
      const consoleWatch = watchConsole(page)
      await seedApp(page, {
        backgroundStyle: "gradient",
        backgroundIntensity: intensity,
        style: "quiet",
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
        style: "quiet",
      })
      await reloadApp(page)
      scales.push(Number(await readToken(page, "--canvas-blob-scale")))
    }
    for (let i = 1; i < scales.length; i++) {
      expect(scales[i]).toBeGreaterThan(
        scales[i - 1] ?? Number.POSITIVE_INFINITY,
      )
    }
  })

  for (const pattern of GRADIENT_PATTERNS) {
    test(`gradient · pattern "${pattern}"`, async ({ page }) => {
      const consoleWatch = watchConsole(page)
      await seedApp(page, {
        backgroundStyle: "gradient",
        gradientPattern: pattern,
        style: "quiet",
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
      await seedApp(page, { density, style: "quiet" })
      await gotoApp(page, PROBE)
      expect((await readThemeAttrs(page))["data-density"]).toBe(density)
      expect(await readToken(page, "--btn-px")).not.toBe("")
    })
  }

  test("density scales control padding monotonically", async ({ page }) => {
    const values: number[] = []
    await seedApp(page)
    await gotoApp(page, PROBE)
    for (const density of DENSITIES) {
      await applyTheme(page, { density, style: "quiet" })
      await reloadApp(page)
      values.push(Number.parseFloat(await readToken(page, "--btn-px")))
    }
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(
        values[i - 1] ?? Number.POSITIVE_INFINITY,
      )
    }
  })
})

test.describe("font size axis", () => {
  for (const fontSize of FONT_SIZES) {
    test(`font size "${fontSize}"`, async ({ page }) => {
      await seedApp(page, { fontSize, style: "quiet" })
      await gotoApp(page, PROBE)
      expect((await readThemeAttrs(page))["data-font-size"]).toBe(fontSize)
    })
  }

  test("font size scales --text-base monotonically", async ({ page }) => {
    const values: number[] = []
    await seedApp(page)
    await gotoApp(page, PROBE)
    for (const fontSize of FONT_SIZES) {
      await applyTheme(page, { fontSize, style: "quiet" })
      await reloadApp(page)
      values.push(Number.parseFloat(await readToken(page, "--text-base")))
    }
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(
        values[i - 1] ?? Number.POSITIVE_INFINITY,
      )
    }
  })
})

test.describe("elevation axes", () => {
  for (const elevation of ELEVATIONS) {
    test(`elevation "${elevation}"`, async ({ page }) => {
      await seedApp(page, { elevation, style: "quiet" })
      await gotoApp(page, PROBE)
      expect((await readThemeAttrs(page))["data-elevation"]).toBe(elevation)
      expect(await readToken(page, "--elevation-current")).not.toBe("")
    })
  }

  test("the shared button shadow token is gone", async ({ page }) => {
    await seedApp(page, { style: "quiet" })
    await gotoApp(page, PROBE)
    expect(await readToken(page, "--shadow-button")).toBe("")
  })
})

test.describe("contrast axis", () => {
  for (const contrast of CONTRASTS) {
    test(`contrast "${contrast}"`, async ({ page }) => {
      await seedApp(page, { contrast, style: "quiet" })
      await gotoApp(page, PROBE)
      expect((await readThemeAttrs(page))["data-contrast"]).toBe(contrast)
    })
  }

  test("moves the page --background in light mode", async ({ page }) => {
    // The light card stays white at every step; the page carries the axis.
    await seedApp(page, { style: "quiet", mode: "light" })
    await gotoApp(page, PROBE)

    await applyTheme(page, { contrast: "low" })
    await reloadApp(page)
    const low = await readToken(page, "--background")

    await applyTheme(page, { contrast: "high" })
    await reloadApp(page)
    expect(await readToken(page, "--background")).not.toBe(low)
  })
})

test.describe("tint with accent axis", () => {
  test("writes the stored value to its data attribute", async ({ page }) => {
    await seedApp(page, { tintWithAccent: "on", style: "quiet" })
    await gotoApp(page, PROBE)
    expect((await readThemeAttrs(page))["data-tint-with-accent"]).toBe("on")
  })
})

test.describe("background intensity canvas cap", () => {
  test("each step yields a distinct background", async ({ page }) => {
    await seedApp(page, { surface: "violet", mode: "dark" })
    await gotoApp(page, PROBE)

    const seen = new Set<string>()
    for (const step of BACKGROUND_INTENSITIES) {
      await applyTheme(page, { backgroundIntensity: step })
      await reloadApp(page)
      const bg = await readToken(page, "--background")
      expect(bg, `${step} must emit a background`).not.toBe("")
      seen.add(bg)
    }
    // vivid and intense are both uncapped, so five steps yield four canvases.
    expect(seen.size).toBe(BACKGROUND_INTENSITIES.length - 1)
  })

  test("caps the canvas in light mode too", async ({ page }) => {
    // The tint half of this axis used to be dark-only, which made it silently
    // inert in half the themes.
    await seedApp(page, { surface: "violet", mode: "light" })
    await gotoApp(page, PROBE)

    await applyTheme(page, { backgroundIntensity: "neutral" })
    await reloadApp(page)
    const neutral = await readToken(page, "--background")

    await applyTheme(page, { backgroundIntensity: "vivid" })
    await reloadApp(page)
    expect(await readToken(page, "--background")).not.toBe(neutral)
  })

  test("writes its data attribute for the blob-scale half", async ({
    page,
  }) => {
    await seedApp(page, { backgroundIntensity: "neutral", mode: "dark" })
    await gotoApp(page, PROBE)

    const attrs = await readThemeAttrs(page)
    expect(attrs["data-background-intensity"]).toBe("neutral")
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
      await seedApp(page, { radius, style: "quiet" })
      await gotoApp(page, PROBE)
      expect((await readThemeAttrs(page))["data-radius"]).toBe(radius)
      expect(await readToken(page, "--radius")).toBe(expected[radius])
    })
  }

  test("pill radius rounds buttons fully", async ({ page }) => {
    await seedApp(page, { radius: "pill", style: "quiet" })
    await gotoApp(page, PROBE)
    expect(await readToken(page, "--radius-control")).toBe("9999px")
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
        style: "glass",
        mode: "dark",
        backgroundStyle: "gradient",
        backgroundIntensity: "intense",
        gradientPattern: "mesh",
        density: "spacious",
        radius: "pill",
        fontSize: "extra-large",
        accent: "violet",
        surface: "indigo",
        glassOpacity: "strong",
        glassBlur: "high",
      },
      expect: {
        "data-style": "glass",
        "data-mode": "dark",
        "data-background-style": "gradient",
        "data-background-intensity": "intense",
        "data-gradient-pattern": "mesh",
        "data-density": "spacious",
        "data-radius": "pill",
        "data-font-size": "extra-large",
        "data-glass-opacity": "strong",
        "data-glass-blur": "high",
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
  // round-trip is instead covered by the per-step reload loop in the
  // "background intensity canvas cap" describe block above.
  test("all axes round-trip through localStorage", async ({ page }) => {
    const seed = {
      style: "glass" as Style,
      glassOpacity: "subtle",
      glassBlur: "low",
      mode: "dark",
      accent: "teal",
      surface: "rose",
      backgroundStyle: "gradient",
      backgroundIntensity: "vivid",
      gradientPattern: "spotlight",
      density: "compact",
      elevation: "high",
      contrast: "high",
      darkAccentChroma: "vivid",
      tintWithAccent: "on",
      radius: "sharp",
      fontSize: "large",
    }
    await seedApp(page, seed)
    await gotoApp(page, PROBE)
    const before = await readThemeAttrs(page)

    await reloadApp(page)
    await gotoApp(page, "/settings")
    await gotoApp(page, PROBE)

    expect(await readThemeAttrs(page)).toEqual(before)
  })
})
