import { test, expect, type Page } from "@playwright/test"
import { generateTokens } from "darkraise-ui/theme"
import {
  ACCENT_COLORS,
  BACKGROUND_INTENSITIES,
  CONTRASTS,
  DENSITIES,
  ELEVATIONS,
  FONT_SIZES,
  GLASS_BLURS,
  GLASS_TRANSPARENCIES,
  GRADIENT_PATTERNS,
  LS_KEYS,
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
  type ThemeSeed,
} from "./helpers/app"
import { alphaOf } from "./helpers/measure"
import { shadowLayers } from "./helpers/showcase"

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

/**
 * What each style changes on its own: its control and chrome tokens in light
 * mode, and the axis defaults its record carries for axes the user never set.
 */
const STYLE_SIGNATURES: Record<
  Style,
  { tokens: Record<string, string>; attrs: Record<string, string> }
> = {
  flat: {
    tokens: {
      "--btn-shadow": "0 0 transparent",
      "--field-shadow": "0 0 transparent",
      "--chrome-backdrop": "none",
    },
    attrs: { "data-elevation": "flat", "data-background-style": "solid" },
  },
  quiet: {
    tokens: {
      "--btn-shadow": "0 0 transparent",
      "--field-shadow": "0 0 transparent",
      "--chrome-backdrop": "none",
    },
    attrs: { "data-elevation": "standard", "data-background-style": "solid" },
  },
  tactile: {
    tokens: {
      "--btn-shadow": "0 0 transparent",
      "--btn-sheen":
        "linear-gradient(180deg, transparent 75%, rgb(255 255 255 / 0.15))",
      "--field-shadow": "0 0 transparent",
      "--chrome-backdrop": "none",
    },
    attrs: { "data-elevation": "standard", "data-background-style": "solid" },
  },
  glass: {
    tokens: {
      "--btn-shadow": "0 1px 2px rgb(0 0 0 / 0.1)",
      "--field-shadow": "0 0 transparent",
      "--overlay-backdrop": "blur(20px) saturate(180%)",
      "--scrim-backdrop": "blur(4px)",
    },
    attrs: {
      "data-elevation": "standard",
      "data-background-style": "gradient",
      "data-gradient-pattern": "dots",
      "data-bar-edge": "veil",
    },
  },
}

/** The surface in storage and on <html>: a retired name migrates to zinc. */
async function expectSurface(page: Page, surface: string) {
  expect(
    await page.evaluate((key) => localStorage.getItem(key), LS_KEYS.surface),
    "stored surface",
  ).toBe(surface)
  await expect(page.locator("html")).toHaveAttribute("data-surface", surface)
}

/** Blur radii of the outset shadow layers that paint, in order. */
function dropShadowBlurs(shadow: string): number[] {
  if (shadow === "none") return []
  return shadowLayers(shadow)
    .filter(
      (layer) =>
        !layer.endsWith("inset") &&
        alphaOf(layer.slice(0, layer.indexOf(")") + 1)) > 0,
    )
    .map((layer) =>
      Number(/\)\s+-?[\d.]+px\s+-?[\d.]+px\s+([\d.]+)px/.exec(layer)?.[1]),
    )
}

/** The first background layer the body paints: the opening blob of the pattern. */
function bodyImage(page: Page) {
  return page.evaluate(() => getComputedStyle(document.body).backgroundImage)
}

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
      expect(attrs["data-preset"]).toBe("base")
      // Ordinary axes: stamped under every style, read only by the glass style.
      expect(attrs["data-glass-transparency"]).toBe("medium")
      expect(attrs["data-glass-blur"]).toBe("medium")

      const signature = STYLE_SIGNATURES[style]
      for (const [name, value] of Object.entries(signature.attrs)) {
        expect(attrs[name], name).toBe(value)
      }
      const names = Object.keys(signature.tokens)
      await expect
        .poll(() => readTokens(page, names), { message: "style tokens" })
        .toEqual(signature.tokens)
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
    const edges = new Map<Style, string>()
    await seedApp(page)
    await gotoApp(page, PROBE)
    for (const style of STYLES) {
      await applyTheme(page, { style, mode: "light" })
      await reloadApp(page)
      shadows.set(style, await readToken(page, "--btn-shadow"))
      edges.set(style, await readToken(page, "--btn-edge"))
    }
    expect(shadows.get("flat")).toContain("transparent")
    // Quiet's depth is tint steps and rules: its buttons cast no shadow.
    expect(shadows.get("quiet")).toContain("transparent")
    // A Tactile key casts no shadow: its depth is the rim lit from below.
    expect(shadows.get("tactile")).toContain("transparent")
    expect(edges.get("tactile")).toContain("inset 0 -1px 0 1px")
    expect(edges.get("tactile")).not.toBe(edges.get("quiet"))
    // Glass restyles no button, so its buttons keep the kit's shadow.
    expect(shadows.get("glass")).not.toContain("transparent")
  })
})

test.describe("glass axes", () => {
  /** Each value resolved on a throwaway element under <html>. */
  function resolved(page: Page, css: string, property: string) {
    return page.evaluate(
      ([text, name]) => {
        const el = document.createElement("div")
        el.setAttribute("style", text)
        document.body.append(el)
        const value = getComputedStyle(el).getPropertyValue(name)
        el.remove()
        return value
      },
      [css, property] as const,
    )
  }

  test("glass opacity thins the overlay from subtle to strong", async ({
    page,
  }) => {
    const consoleWatch = watchConsole(page)
    await seedApp(page, { style: "glass", mode: "light" })
    await gotoApp(page, PROBE)
    const alphas: number[] = []
    for (const glassTransparency of GLASS_TRANSPARENCIES) {
      await applyTheme(page, { glassTransparency })
      await reloadApp(page)
      expect((await readThemeAttrs(page))["data-glass-transparency"]).toBe(
        glassTransparency,
      )
      const colour = await resolved(
        page,
        "background-color: var(--surface-overlay-base)",
        "background-color",
      )
      alphas.push(Number(/,\s*([\d.]+)\)$/.exec(colour)?.[1] ?? 1))
    }
    const readings = alphas.join(", ")
    for (let i = 1; i < alphas.length; i++) {
      expect(
        alphas[i],
        `${GLASS_TRANSPARENCIES[i]} thinner than ${GLASS_TRANSPARENCIES[i - 1]}: ${readings}`,
      ).toBeLessThan(alphas[i - 1] ?? 0)
    }
    consoleWatch.assertClean()
  })

  // The scrim blurs the app a fifth as hard as an overlay blurs what it
  // covers (theme/styles/builtin/glass.ts); the chrome takes no blur.
  const blurs: Record<(typeof GLASS_BLURS)[number], [string, string]> = {
    none: ["none", "none"],
    low: ["blur(10px) saturate(1.6)", "blur(2px)"],
    medium: ["blur(20px) saturate(1.8)", "blur(4px)"],
    high: ["blur(32px) saturate(1.8)", "blur(8px)"],
  }
  for (const glassBlur of GLASS_BLURS) {
    test(`glass blur = ${glassBlur}`, async ({ page }) => {
      const consoleWatch = watchConsole(page)
      await seedApp(page, { style: "glass", glassBlur })
      await gotoApp(page, PROBE)
      const attrs = await readThemeAttrs(page)
      expect(attrs["data-glass-blur"]).toBe(glassBlur)
      const [overlay, scrim] = blurs[glassBlur]
      expect(
        await resolved(
          page,
          "backdrop-filter: var(--overlay-backdrop)",
          "backdrop-filter",
        ),
      ).toBe(overlay)
      expect(
        await resolved(
          page,
          "backdrop-filter: var(--scrim-backdrop)",
          "backdrop-filter",
        ),
      ).toBe(scrim)
      await expect(page.locator('.dr-shell > [data-region="nav"]')).toHaveCSS(
        "backdrop-filter",
        "none",
      )
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

type TokenInput = Parameters<typeof generateTokens>[0]

/**
 * The --primary the kit token generator gives an accent on a quiet light
 * page whose other axes are the ones stamped on its <html>.
 */
function primaryFor(accent: string, attrs: Record<string, string>) {
  return generateTokens({
    accentColor: accent as TokenInput["accentColor"],
    surfaceColor: attrs["data-surface"] as TokenInput["surfaceColor"],
    frosted: false,
    backgroundStyle: attrs[
      "data-background-style"
    ] as TokenInput["backgroundStyle"],
    mode: "light",
    contrast: attrs["data-contrast"] as TokenInput["contrast"],
    darkAccentChroma: attrs[
      "data-dark-accent-chroma"
    ] as TokenInput["darkAccentChroma"],
    tintWithAccent: attrs["data-tint-with-accent"] === "on",
    backgroundIntensity: attrs[
      "data-background-intensity"
    ] as TokenInput["backgroundIntensity"],
  })["--primary"]
}

test.describe("accent color axis", () => {
  for (const accent of ACCENT_COLORS) {
    test(`accent "${accent}" drives --primary`, async ({ page }) => {
      await seedApp(page, { accent, style: "quiet", mode: "light" })
      await gotoApp(page, PROBE)
      const attrs = await readThemeAttrs(page)
      const primary = await readToken(page, "--primary")
      expect(primary, accent).toBe(primaryFor(accent, attrs))
      if (accent !== "neutral") {
        expect(primary, `${accent} against neutral`).not.toBe(
          primaryFor("neutral", attrs),
        )
      }
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
      // zinc is the default surface, so it is compared with sand instead.
      const reference = surface === "zinc" ? "sand" : "zinc"
      await seedApp(page, { surface, style: "quiet", mode: "dark" })
      await gotoApp(page, PROBE)
      await expectSurface(page, surface)
      const background = await readToken(page, "--background")

      await applyTheme(page, { surface: reference })
      await reloadApp(page)
      await expectSurface(page, reference)
      await expect
        .poll(() => readToken(page, "--background"), {
          message: `--background moves from ${surface} to ${reference}`,
        })
        .not.toBe(background)
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
    await expect.poll(() => bodyImage(page)).toBe("none")
  })

  const blobScale: Record<string, string> = {
    neutral: "0.25",
    subtle: "0.5",
    balanced: "1",
    vivid: "1.5",
    intense: "2",
  }

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
      expect(await readToken(page, "--canvas-blob-scale")).toBe(
        blobScale[intensity],
      )
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

  const firstLayer: Record<string, string> = {
    blobs: "radial-gradient(1400px 900px at 10% -5%,",
    aurora: "radial-gradient(1600px 280px at 20% 22%,",
    spotlight: "radial-gradient(2000px 1200px at 50% -15%,",
    mesh: "radial-gradient(700px 600px at 18% 18%,",
    dots: "radial-gradient(oklab(",
    grain: "linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0))",
  }

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
      const expected = firstLayer[pattern] ?? ""
      await expect
        .poll(async () => (await bodyImage(page)).slice(0, expected.length))
        .toBe(expected)
      consoleWatch.assertClean()
    })
  }

  test("grain draws the canvas noise at twice its usual strength", async ({
    page,
  }) => {
    await seedApp(page, {
      backgroundStyle: "gradient",
      gradientPattern: "grain",
      style: "quiet",
    })
    await gotoApp(page, PROBE)
    expect((await readThemeAttrs(page))["data-gradient-pattern"]).toBe("grain")
    const usual = Number(
      await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue(
          "--noise-opacity",
        ),
      ),
    )
    expect(usual).toBeGreaterThan(0)
    await expect
      .poll(() =>
        page.evaluate(() =>
          Number(getComputedStyle(document.body, "::before").opacity),
        ),
      )
      .toBeCloseTo(Math.min(1, usual * 2), 5)
  })

  test("dots tile the canvas every 16px", async ({ page }) => {
    await seedApp(page, {
      backgroundStyle: "gradient",
      gradientPattern: "dots",
      style: "quiet",
    })
    await gotoApp(page, PROBE)
    await expect
      .poll(() =>
        page.evaluate(() => getComputedStyle(document.body).backgroundSize),
      )
      .toMatch(/^16px 16px, /)
    // The content strip repaints the canvas and keeps the same tile.
    const strip = await page.evaluate(() => {
      const main = document.querySelector("main[data-content]")
      return main ? getComputedStyle(main, "::before").backgroundSize : null
    })
    expect(strip).toMatch(/^16px 16px, /)
    // The strip's dots start where the page's do, so the two grids coincide.
    const anchor = await page.evaluate(() => {
      const main = document.querySelector("main[data-content]")
      if (!main) return null
      const style = getComputedStyle(main, "::before")
      return `${style.backgroundAttachment} | ${style.backgroundPosition}`
    })
    expect(anchor).toMatch(/^fixed, scroll, .* \| 0px 0px, /)
  })
})

test.describe("density axis", () => {
  const buttonPadding: Record<string, string> = {
    compact: "0.5rem",
    cozy: "0.75rem",
    comfortable: "1rem",
    spacious: "1.25rem",
  }
  for (const density of DENSITIES) {
    test(`density "${density}"`, async ({ page }) => {
      await seedApp(page, { density, style: "quiet" })
      await gotoApp(page, PROBE)
      expect((await readThemeAttrs(page))["data-density"]).toBe(density)
      expect(await readToken(page, "--btn-px")).toBe(buttonPadding[density])
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
  // Light-mode drop shadows of the axis ramp (theme.css): flat paints none.
  const shadowBlurs: Record<(typeof ELEVATIONS)[number], number[]> = {
    flat: [],
    standard: [20, 8],
    high: [72, 36],
  }
  for (const elevation of ELEVATIONS) {
    test(`elevation "${elevation}"`, async ({ page }) => {
      await seedApp(page, { elevation, style: "quiet", mode: "light" })
      await gotoApp(page, "/components/cards")
      expect((await readThemeAttrs(page))["data-elevation"]).toBe(elevation)
      // The one card that follows the axis; explicit levels ignore it.
      const card = page
        .locator('.dr-card[data-card-elevation="auto"]')
        .filter({ hasText: "Auto (theme)" })
      await expect(card).toHaveCount(1)
      await expect
        .poll(async () =>
          dropShadowBlurs(
            await card.evaluate((el) => getComputedStyle(el).boxShadow),
          ),
        )
        .toEqual(shadowBlurs[elevation])
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

  test("on moves the page --background toward the accent", async ({ page }) => {
    await seedApp(page, {
      tintWithAccent: "off",
      accent: "violet",
      surface: "zinc",
      style: "quiet",
      mode: "dark",
    })
    await gotoApp(page, PROBE)
    const untinted = await readToken(page, "--background")

    await applyTheme(page, { tintWithAccent: "on" })
    await reloadApp(page)
    await expect(page.locator("html")).toHaveAttribute(
      "data-tint-with-accent",
      "on",
    )
    await expect.poll(() => readToken(page, "--background")).not.toBe(untinted)
  })
})

test.describe("background intensity canvas cap", () => {
  test("each step yields a distinct background", async ({ page }) => {
    await seedApp(page, {
      surface: "mauve",
      tintWithAccent: "off",
      mode: "dark",
    })
    await gotoApp(page, PROBE)
    await expectSurface(page, "mauve")

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
    await seedApp(page, {
      surface: "sand",
      tintWithAccent: "off",
      mode: "light",
    })
    await gotoApp(page, PROBE)
    await expectSurface(page, "sand")

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
        surface: "sand",
        tintWithAccent: "off",
        glassTransparency: "strong",
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
        "data-accent": "violet",
        "data-surface": "sand",
        "data-tint-with-accent": "off",
        "data-glass-transparency": "strong",
        "data-glass-blur": "high",
      },
    },
  ]

  for (const combo of combos) {
    test(combo.name, async ({ page }) => {
      const consoleWatch = watchConsole(page)
      await seedApp(page, combo.seed)
      await gotoApp(page, PROBE)
      await expectSurface(page, combo.seed?.surface ?? "")
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
      style: "glass",
      glassTransparency: "subtle",
      glassBlur: "low",
      mode: "dark",
      accent: "teal",
      surface: "sand",
      backgroundStyle: "gradient",
      backgroundIntensity: "balanced",
      gradientPattern: "spotlight",
      density: "compact",
      elevation: "high",
      contrast: "high",
      darkAccentChroma: "vivid",
      tintWithAccent: "on",
      radius: "sharp",
      fontSize: "large",
    } satisfies ThemeSeed
    const attributes: Record<keyof typeof seed, string> = {
      style: "data-style",
      glassTransparency: "data-glass-transparency",
      glassBlur: "data-glass-blur",
      mode: "data-mode",
      accent: "data-accent",
      surface: "data-surface",
      backgroundStyle: "data-background-style",
      backgroundIntensity: "data-background-intensity",
      gradientPattern: "data-gradient-pattern",
      density: "data-density",
      elevation: "data-elevation",
      contrast: "data-contrast",
      darkAccentChroma: "data-dark-accent-chroma",
      tintWithAccent: "data-tint-with-accent",
      radius: "data-radius",
      fontSize: "data-font-size",
    }
    const fields = Object.keys(seed) as (keyof typeof seed)[]
    const stored = () =>
      page.evaluate(
        (keys) => keys.map((key) => localStorage.getItem(key)),
        fields.map((field) => LS_KEYS[field]),
      )
    const seeded = fields.map((field) => seed[field])

    await seedApp(page, seed)
    await gotoApp(page, PROBE)
    const before = await readThemeAttrs(page)
    expect(fields.map((field) => before[attributes[field]])).toEqual(seeded)
    expect(await stored()).toEqual(seeded)

    await reloadApp(page)
    await gotoApp(page, "/settings")
    await gotoApp(page, PROBE)

    expect(await readThemeAttrs(page)).toEqual(before)
    expect(await stored()).toEqual(seeded)
  })

  test("a seeded key the app erased is not seeded again on reload", async ({
    page,
  }) => {
    await seedApp(page, { accent: "violet", style: "quiet" })
    await gotoApp(page, PROBE)
    await page.evaluate((key) => localStorage.removeItem(key), LS_KEYS.accent)

    await reloadApp(page)
    expect(
      await page.evaluate((key) => localStorage.getItem(key), LS_KEYS.accent),
    ).not.toBe("violet")
  })
})
