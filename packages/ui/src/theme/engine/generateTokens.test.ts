import { describe, it, expect } from "vitest"
import { generateTokens, capCanvasSaturation } from "./generateTokens"
import { accentColors } from "@theme/palettes/accentColors"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import { contrastRatio } from "@theme/engine/oklch"
import { themeConfig } from "@theme/themeConfig"
import {
  ACCENT_COLORS,
  ACCENT_INTENSITIES,
  BACKGROUND_INTENSITIES,
} from "@theme/types"
import type {
  ColorScale,
  AccentColor,
  ResolvedMode,
  BackgroundIntensity,
} from "@theme/types"

describe("generateTokens", () => {
  it("produces all expected token keys for the default combination", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "light",
      accentIntensity: "balanced",
    })

    const expectedKeys = [
      "--primary",
      "--primary-foreground",
      "--primary-fill",
      "--ring",
      "--focus-ring",
      "--chart-1",
      "--chart-2",
      "--chart-3",
      "--chart-4",
      "--chart-5",
      "--background",
      "--foreground",
      "--card",
      "--card-foreground",
      "--popover",
      "--popover-foreground",
      "--secondary",
      "--secondary-foreground",
      "--muted",
      "--muted-foreground",
      "--legend",
      "--accent",
      "--accent-foreground",
      "--destructive",
      "--destructive-foreground",
      "--success",
      "--success-foreground",
      "--warning",
      "--warning-foreground",
      "--border",
      "--input",
      "--field-edge-color",
      "--surface-base",
      "--surface-raised",
      "--surface-overlay",
      "--surface-sunken",
      "--surface-sidebar",
      "--sidebar-active-bg",
      "--surface-header",
      "--border-subtle",
      "--border-default",
      "--border-strong",
      "--shadow-dropdown",
    ]

    for (const key of expectedKeys) {
      expect(tokens).toHaveProperty(key)
      expect(tokens[key]).toBeTruthy()
    }
  })

  it("does not emit glass-only tokens for the default surface style", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "light",
      accentIntensity: "balanced",
    })

    const glassOnlyKeys = [
      "--fog-05",
      "--fog-10",
      "--fog-15",
      "--fog-20",
      "--fog-30",
      "--fog-50",
      "--inset-hi",
      "--inset-hi-strong",
      "--inset-hi-button",
      "--backdrop-blur",
      "--backdrop-filter",
      "--surface-opacity",
    ]

    for (const key of glassOnlyKeys) {
      expect(tokens).not.toHaveProperty(key)
    }
  })

  it("uses shade 500 for primary in both light and dark modes (non-glass)", () => {
    // Dark mode used to brighten primary to shade 400, but that read as
    // glaring on every `bg-primary` surface (Button default, Checkbox,
    // Switch, Calendar selected, etc.). Both modes now share shade 500 of
    // the active accent palette so the brand color stays calm across
    // themes while the dark background still provides plenty of contrast.
    const light = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "light",
      accentIntensity: "balanced",
    })
    const dark = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "dark",
      accentIntensity: "balanced",
    })

    expect(light["--primary"]).toBe("217 91% 60%")
    expect(dark["--primary"]).toBe("217 91% 60%")
  })

  it("emits --focus-ring as raw HSL channels lighter than --ring", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "light",
      accentIntensity: "balanced",
    })
    expect(tokens["--focus-ring"]).toBeDefined()
    expect(tokens["--focus-ring"]).toMatch(/^\d+\s+\d+%\s+\d+%$/)
    expect(tokens["--focus-ring"]).not.toEqual(tokens["--ring"])
  })

  it("emits --focus-ring as accent shade 300 in light mode and 200 in dark mode", () => {
    const lightTokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "light",
      accentIntensity: "balanced",
    })
    const darkTokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "dark",
      accentIntensity: "balanced",
    })
    // Derived from those shades, then raised where the shade itself could not
    // be seen: light blue-300 measured 1.58:1 against the page. The floor is
    // the requirement; the shade was only ever the starting point.
    expect(
      contrastRatio(
        lightTokens["--focus-ring"] as string,
        lightTokens["--background"] as string,
      ),
    ).toBeGreaterThanOrEqual(3)
    expect(
      contrastRatio(
        darkTokens["--focus-ring"] as string,
        darkTokens["--background"] as string,
      ),
    ).toBeGreaterThanOrEqual(3)
    expect(lightTokens["--focus-ring"]).not.toEqual(lightTokens["--ring"])
    expect(darkTokens["--focus-ring"]).not.toEqual(darkTokens["--ring"])
  })

  it("picks the primary foreground by contrast, not by assumption", () => {
    const build = (accentColor: AccentColor, mode: ResolvedMode) =>
      generateTokens({
        accentColor,
        surfaceColor: "slate",
        preset: "default",
        backgroundStyle: "solid",
        mode,
        accentIntensity: "balanced",
      })

    // White is unreadable on the light accents: it measures 2.14:1 on amber
    // against a 3:1 floor, which is why this is computed rather than fixed.
    // Dark amber keeps its bright fill, so it takes ink there too.
    expect(build("amber", "light")["--primary-foreground"]).toBe("222 47% 11%")
    expect(build("blue", "light")["--primary-foreground"]).toBe("0 0% 100%")
    expect(build("amber", "dark")["--primary-foreground"]).toBe("222 47% 11%")
    expect(build("blue", "dark")["--primary-foreground"]).toBe("0 0% 100%")
  })

  it("dark mode flips background to step 950 and foreground to step 50", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "dark",
      accentIntensity: "balanced",
    })

    expect(tokens["--background"]).toBe("229 16% 5%")
    expect(tokens["--foreground"]).toBe("210 40% 98%")
  })

  it("dark mode `--border` is distinct from `--muted` / `--secondary` / `--accent`", () => {
    // Regression for the collision where `--border` defaulted to
    // `surface[800]` — the same value used by --muted, --secondary,
    // --accent in dark mode. `border-border` outlines next to muted
    // surfaces (e.g. FloatingPanel header on its popover body) became
    // invisible. The standard border now sits one tier lighter
    // (surface[700]), matching the `borderDefault` recipe step.
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "dark",
      accentIntensity: "balanced",
    })
    expect(tokens["--border"]).not.toEqual(tokens["--muted"])
    expect(tokens["--border"]).not.toEqual(tokens["--secondary"])
    expect(tokens["--border"]).not.toEqual(tokens["--accent"])
    expect(tokens["--border"]).toEqual(tokens["--border-default"])
  })

  it("`--border-strong` follows the surface palette and outranks `--border`", () => {
    // Regression for the Card/Tabs `border="strong"` tier, which used to be
    // `hsl(var(--foreground) / 0.28)`. `--foreground` is always the fixed
    // slate neutral scale, so the strong tier painted a cold grey line on
    // every non-slate surface colour while the default tier stayed
    // surface-tinted — two borders on the same card in two different hues.
    const common = {
      accentColor: "blue",
      preset: "default",
      backgroundStyle: "solid",
      accentIntensity: "balanced",
    } as const

    for (const mode of ["light", "dark"] as const) {
      const slate = generateTokens({ ...common, surfaceColor: "slate", mode })
      const stone = generateTokens({ ...common, surfaceColor: "stone", mode })

      expect(slate["--border-strong"]).toBeTruthy()
      expect(stone["--border-strong"]).not.toEqual(slate["--border-strong"])
      expect(slate["--border-strong"]).not.toEqual(slate["--border-default"])
      expect(slate["--border-strong"]).not.toEqual(slate["--border-subtle"])
    }
  })

  it("accepts the renamed accentIntensity input", () => {
    const calm = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "dark",
      accentIntensity: "calm",
    })
    const vivid = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "dark",
      accentIntensity: "vivid",
    })
    expect(calm["--primary-fill"]).not.toEqual(vivid["--primary-fill"])
  })

  it("glass preset no longer emits scalar opacity/blur tokens (CSS-driven)", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "glass",
      backgroundStyle: "solid",
      mode: "light",
      accentIntensity: "balanced",
    })

    // These tokens are now bound by glass.css attribute selectors.
    expect(tokens["--backdrop-blur"]).toBeUndefined()
    expect(tokens["--surface-opacity"]).toBeUndefined()
    expect(tokens["--backdrop-filter"]).toBeUndefined()

    // Fog and inset tokens are computed by glass.generateTokens (the preset's
    // own generator), not by common generateTokens — so they should also be
    // undefined here.
    expect(tokens["--fog-05"]).toBeUndefined()
    expect(tokens["--inset-hi"]).toBeUndefined()
  })

  // Re-enabled in Phase 3 with the glass preset registered
  it("light + glass shifts primary from accent-500 to accent-600 for AA contrast", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "glass",
      backgroundStyle: "solid",
      mode: "light",
      accentIntensity: "balanced",
    })

    expect(tokens["--primary"]).toBe("221 83% 53%")
    expect(tokens["--ring"]).toBe("221 83% 53%")
  })

  // Re-enabled in Phase 3 with the glass preset registered
  it("light + glass tints dropdown shadow drops with blue-black (16 24 40)", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "glass",
      backgroundStyle: "solid",
      mode: "light",
      accentIntensity: "balanced",
    })

    expect(tokens["--shadow-dropdown"]).toContain("rgb(16 24 40")
    expect(tokens).not.toHaveProperty("--shadow-card")
  })

  it("destructive uses red-500 for light and red-600 for dark", () => {
    const light = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "light",
      accentIntensity: "balanced",
    })
    const dark = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "dark",
      accentIntensity: "balanced",
    })

    // red-500 and red-600 are the base values; both are raised where they did
    // not carry as text, which is what --destructive is used for.
    expect(light["--destructive"]).toMatch(/^0 /)
    expect(dark["--destructive"]).toMatch(/^0 /)
    expect(
      contrastRatio(
        light["--destructive"] as string,
        light["--background"] as string,
      ),
    ).toBeGreaterThanOrEqual(4.5)
    expect(
      contrastRatio(
        dark["--destructive"] as string,
        dark["--background"] as string,
      ),
    ).toBeGreaterThanOrEqual(4.5)
  })

  it("success is the success text step; white label in light, ink in dark", () => {
    const light = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "light",
      accentIntensity: "balanced",
    })
    const dark = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "dark",
      accentIntensity: "balanced",
    })

    // emerald-500 measured 2.48:1 in light, so it is darkened to the 4.5:1
    // status text floor.
    expect(light["--success"]).toMatch(/^160 /)
    expect(light["--success"]).toBe(light["--success-text"])
    expect(dark["--success"]).toBe(dark["--success-text"])
    expect(
      contrastRatio(
        light["--success"] as string,
        light["--background"] as string,
      ),
    ).toBeGreaterThanOrEqual(4.5)
    expect(light["--success-foreground"]).toBe("0 0% 100%")
    // A dark success readable as text is too light for a white label.
    expect(dark["--success-foreground"]).toBe("222 47% 11%")
  })

  it("warning is the warning text step; white label in light, ink in dark", () => {
    const light = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "light",
      accentIntensity: "balanced",
    })
    const dark = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "dark",
      accentIntensity: "balanced",
    })

    // amber-500 measured 2.03:1 in light, the worst of the state colours; it is
    // darkened to the 4.5:1 status text floor.
    expect(light["--warning"]).toMatch(/^38 /)
    expect(light["--warning"]).toBe(light["--warning-text"])
    expect(dark["--warning"]).toBe(dark["--warning-text"])
    expect(
      contrastRatio(
        light["--warning"] as string,
        light["--background"] as string,
      ),
    ).toBeGreaterThanOrEqual(4.5)
    // Light warning is darkened to read as text, which makes white the better label.
    expect(light["--warning-foreground"]).toBe("0 0% 100%")
    expect(dark["--warning-foreground"]).toBe("222 47% 11%")
  })

  it("success and warning are independent of accentColor", () => {
    const blueAccent = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "light",
      accentIntensity: "balanced",
    })
    const redAccent = generateTokens({
      accentColor: "red",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "light",
      accentIntensity: "balanced",
    })

    expect(blueAccent["--success"]).toBe(redAccent["--success"])
    expect(blueAccent["--warning"]).toBe(redAccent["--warning"])
  })

  it("surfaceColor slate produces identical tokens to the original behavior", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "light",
      accentIntensity: "balanced",
    })

    expect(tokens["--background"]).toBe("210 16% 98%")
    expect(tokens["--foreground"]).toBe("222 47% 11%")
  })

  describe("semantic aliases", () => {
    const ALIASES = [
      ["--background", "--neutral-1"],
      ["--card", "--neutral-2"],
      ["--muted", "--neutral-3"],
      ["--border", "--neutral-6"],
      ["--foreground", "--neutral-12"],
      ["--primary", "--primary-8"],
      ["--primary-fill", "--primary-9"],
      ["--primary-text", "--primary-11"],
    ] as const

    for (const mode of ["light", "dark"] as const) {
      it(`maps the semantic tokens onto the steps in ${mode} mode`, () => {
        const tokens = generateTokens({
          accentColor: "blue",
          surfaceColor: "slate",
          preset: "default",
          backgroundStyle: "solid",
          mode,
          accentIntensity: "balanced",
        })
        for (const [alias, step] of ALIASES) {
          expect(tokens[step], step).toBeTruthy()
          expect(tokens[alias], alias).toBe(tokens[step])
        }
      })
    }
  })

  it("emits the same eight chart colours under every accent", () => {
    for (const mode of ["light", "dark"] as const) {
      const charts = (accentColor: AccentColor) => {
        const tokens = generateTokens({
          accentColor,
          surfaceColor: "slate",
          preset: "default",
          backgroundStyle: "solid",
          mode,
          accentIntensity: "balanced",
        })
        return Array.from({ length: 8 }, (_, i) => tokens[`--chart-${i + 1}`])
      }
      const reference = charts("blue")
      expect(new Set(reference).size).toBe(8)
      for (const accentColor of ACCENT_COLORS) {
        expect(charts(accentColor), `${accentColor} ${mode}`).toEqual(reference)
      }
    }
  })

  describe("fog ramp tokens", () => {
    it("dark + glass does not emit fog tokens from common generateTokens", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        preset: "glass",
        backgroundStyle: "solid",
        mode: "dark",
        accentIntensity: "balanced",
      })

      // Fog tokens are now computed by glass.generateTokens (the preset's
      // own generator), not by the shared generateTokens path.
      expect(tokens["--fog-05"]).toBeUndefined()
      expect(tokens["--fog-10"]).toBeUndefined()
      expect(tokens["--fog-15"]).toBeUndefined()
      expect(tokens["--fog-20"]).toBeUndefined()
      expect(tokens["--fog-30"]).toBeUndefined()
      expect(tokens["--fog-50"]).toBeUndefined()
    })

    it("light + glass does not emit fog tokens from common generateTokens", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        preset: "glass",
        backgroundStyle: "solid",
        mode: "light",
        accentIntensity: "balanced",
      })

      expect(tokens["--fog-05"]).toBeUndefined()
      expect(tokens["--fog-10"]).toBeUndefined()
      expect(tokens["--fog-15"]).toBeUndefined()
      expect(tokens["--fog-20"]).toBeUndefined()
      expect(tokens["--fog-30"]).toBeUndefined()
      expect(tokens["--fog-50"]).toBeUndefined()
    })

    it("default surface style does not emit any fog tokens", () => {
      const dark = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        preset: "default",
        backgroundStyle: "solid",
        mode: "dark",
        accentIntensity: "balanced",
      })
      const light = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        preset: "default",
        backgroundStyle: "solid",
        mode: "light",
        accentIntensity: "balanced",
      })

      const fogKeys = [
        "--fog-05",
        "--fog-10",
        "--fog-15",
        "--fog-20",
        "--fog-30",
        "--fog-50",
      ]
      for (const key of fogKeys) {
        expect(dark).not.toHaveProperty(key)
        expect(light).not.toHaveProperty(key)
      }
    })
  })

  describe("inset rim tokens", () => {
    it("dark + glass does not emit inset rim tokens from common generateTokens", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        preset: "glass",
        backgroundStyle: "solid",
        mode: "dark",
        accentIntensity: "balanced",
      })

      // Inset tokens are now computed by glass.generateTokens (the preset's
      // own generator), not by the shared generateTokens path.
      expect(tokens["--inset-hi"]).toBeUndefined()
      expect(tokens["--inset-hi-strong"]).toBeUndefined()
      expect(tokens["--inset-hi-button"]).toBeUndefined()
    })

    it("light + glass does not emit inset rim tokens from common generateTokens", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        preset: "glass",
        backgroundStyle: "solid",
        mode: "light",
        accentIntensity: "balanced",
      })

      expect(tokens["--inset-hi"]).toBeUndefined()
      expect(tokens["--inset-hi-strong"]).toBeUndefined()
      expect(tokens["--inset-hi-button"]).toBeUndefined()
    })

    it("default surface style does not emit any inset rim tokens", () => {
      const dark = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        preset: "default",
        backgroundStyle: "solid",
        mode: "dark",
        accentIntensity: "balanced",
      })
      const light = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        preset: "default",
        backgroundStyle: "solid",
        mode: "light",
        accentIntensity: "balanced",
      })

      const insetKeys = ["--inset-hi", "--inset-hi-strong", "--inset-hi-button"]
      for (const key of insetKeys) {
        expect(dark).not.toHaveProperty(key)
        expect(light).not.toHaveProperty(key)
      }
    })
  })

  describe("noise opacity token", () => {
    it("dark + gradient background emits 0.5 noise opacity", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        preset: "default",
        backgroundStyle: "gradient",
        mode: "dark",
        accentIntensity: "balanced",
      })

      expect(tokens["--noise-opacity"]).toBe("0.5")
    })

    it("light + gradient background emits 0.6 noise opacity", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        preset: "default",
        backgroundStyle: "gradient",
        mode: "light",
        accentIntensity: "balanced",
      })

      expect(tokens["--noise-opacity"]).toBe("0.6")
    })

    it("dark + solid background emits 0 noise opacity", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        preset: "default",
        backgroundStyle: "solid",
        mode: "dark",
        accentIntensity: "balanced",
      })

      expect(tokens["--noise-opacity"]).toBe("0")
    })

    it("light + solid background emits 0 noise opacity", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        preset: "default",
        backgroundStyle: "solid",
        mode: "light",
        accentIntensity: "balanced",
      })

      expect(tokens["--noise-opacity"]).toBe("0")
    })
  })

  describe("sf-hue tokens", () => {
    const baseInput = {
      accentColor: "blue" as const,
      surfaceColor: "stone" as const,
      preset: "default" as const,
      backgroundStyle: "gradient" as const,
      mode: "dark" as const,
      accentIntensity: "balanced" as const,
    }

    it("emits hsl shade-500 for --sf-hue in gradient mode", () => {
      const tokens = generateTokens(baseInput)
      expect(tokens["--sf-hue"]).toBe(`hsl(${surfaceColors.stone[500]})`)
    })

    it("emits hsl shade-300 for --sf-hue-3 (lighter pastel)", () => {
      const tokens = generateTokens(baseInput)
      expect(tokens["--sf-hue-3"]).toBe(`hsl(${surfaceColors.stone[300]})`)
    })

    it("emits transparent for all three hue anchors in solid mode", () => {
      const tokens = generateTokens({ ...baseInput, backgroundStyle: "solid" })
      expect(tokens["--sf-hue"]).toBe("transparent")
      expect(tokens["--sf-hue-2"]).toBe("transparent")
      expect(tokens["--sf-hue-3"]).toBe("transparent")
    })

    it("slate hard-branches to same-palette shades (no cross-palette neighbor)", () => {
      const slate = surfaceColors.slate as ColorScale
      const tokens = generateTokens({ ...baseInput, surfaceColor: "slate" })
      expect(tokens["--sf-hue"]).toBe(`hsl(${slate[500]})`)
      expect(tokens["--sf-hue-2"]).toBe(`hsl(${slate[400]})`)
      expect(tokens["--sf-hue-3"]).toBe(`hsl(${slate[300]})`)
    })

    it("light mode uses the same hue values (ink anchor differentiates, not hue)", () => {
      const tokens = generateTokens({ ...baseInput, mode: "light" })
      expect(tokens["--sf-hue"]).toBe(`hsl(${surfaceColors.stone[500]})`)
      expect(tokens["--sf-hue-2"]).toBe(`hsl(${surfaceColors.stone[400]})`)
      expect(tokens["--sf-hue-3"]).toBe(`hsl(${surfaceColors.stone[300]})`)
    })
  })

  describe("--content-gradient-overlay after merge", () => {
    const baseInput = {
      accentColor: "blue" as const,
      surfaceColor: "stone" as const,
      preset: "default" as const,
      backgroundStyle: "gradient" as const,
      mode: "dark" as const,
      accentIntensity: "balanced" as const,
    }

    it("gradient + default → five-layer var() composition", () => {
      const tokens = generateTokens(baseInput)
      expect(
        tokens["--content-gradient-overlay"].replace(/\s+/g, " ").trim(),
      ).toBe(
        "var(--canvas-blob-a), var(--canvas-blob-b), var(--canvas-blob-c), var(--canvas-blob-d), var(--canvas-ink)",
      )
    })

    // Was a linear accent fade across the top 300px of main[data-
    // content] under Glass + solid. Bled through as a colored glow
    // at the top of pages without dense Cards (e.g. the Buttons
    // demo), most visible in dark mode where accent[800] at 0.2
    // alpha read as an obvious tint. Now neutral — body bg is the
    // canonical page color source under Glass.
    it("solid + glass → none (body bg is the page color under Glass)", () => {
      const tokens = generateTokens({
        ...baseInput,
        backgroundStyle: "solid",
        preset: "glass",
      })
      expect(tokens["--content-gradient-overlay"]).toBe("none")
    })

    // Re-enabled in Phase 3 with the glass preset registered
    it("gradient + glass → none (body already paints blobs)", () => {
      const tokens = generateTokens({
        ...baseInput,
        backgroundStyle: "gradient",
        preset: "glass",
      })
      expect(tokens["--content-gradient-overlay"]).toBe("none")
    })

    it("solid + default → none", () => {
      const tokens = generateTokens({
        ...baseInput,
        backgroundStyle: "solid",
        preset: "default",
      })
      expect(tokens["--content-gradient-overlay"]).toBe("none")
    })
  })
  describe("--sidebar-foreground-muted polarity", () => {
    const slate = surfaceColors.slate as ColorScale
    const base = {
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      accentIntensity: "balanced",
    } as const

    // The branches were inverted, putting slate-400 on the near-white light
    // rail (2.43:1) and slate-500 on the dark rail. Every other muted text
    // token in the kit uses 500 in light and 400 in dark.
    it("matches --muted-foreground's light/dark polarity", () => {
      const light = generateTokens({ ...base, mode: "light" })
      const dark = generateTokens({ ...base, mode: "dark" })
      // Pinned to the floor the inversion breached rather than to a ramp
      // step: the tiers are computed against the background now, so a step
      // number would pin the arithmetic instead of the requirement.
      expect(
        contrastRatio(
          light["--sidebar-foreground-muted"] as string,
          light["--surface-sidebar"] as string,
        ),
      ).toBeGreaterThanOrEqual(4.5)
      expect(
        contrastRatio(
          dark["--sidebar-foreground-muted"] as string,
          dark["--surface-sidebar"] as string,
        ),
      ).toBeGreaterThanOrEqual(4.5)
      expect(light["--sidebar-foreground-muted"]).toBe(
        light["--muted-foreground"],
      )
      expect(dark["--sidebar-foreground-muted"]).toBe(
        dark["--muted-foreground"],
      )
    })

    it("stays lighter than --sidebar-foreground in both modes", () => {
      const light = generateTokens({ ...base, mode: "light" })
      const dark = generateTokens({ ...base, mode: "dark" })
      expect(light["--sidebar-foreground"]).toBe(slate[600])
      expect(dark["--sidebar-foreground"]).toBe(slate[300])
    })
  })
})

describe("accent vibrancy default", () => {
  // Pinned deliberately. The default ships filled-control labels at 4.10,
  // below AA, which the spec records as an accepted risk — a silent change
  // to this value would change that risk without review.
  it("is balanced", () => {
    expect(themeConfig.defaults.accentIntensity).toBe("balanced")
  })

  it("is exposed in the switcher", () => {
    expect(themeConfig.switcher.axes.accentIntensity).toBe(true)
  })
})

describe("backgroundIntensity canvas cap", () => {
  const dark = (
    backgroundIntensity: BackgroundIntensity,
    surfaceColor = "sepia" as const,
  ) =>
    generateTokens({
      accentColor: "blue",
      surfaceColor,
      preset: "default",
      backgroundStyle: "solid",
      mode: "dark",
      accentIntensity: "balanced",
      backgroundIntensity,
    })

  it("clamps rather than sets, so an already-calm colour is untouched", () => {
    // iron's dark canvas is 16% saturation, exactly the balanced cap
    const atCap = dark("balanced", "iron")["--background"]
    expect(dark("vivid", "iron")["--background"]).toBe(atCap)
  })

  it("moves --surface-base in lockstep with --background", () => {
    for (const step of BACKGROUND_INTENSITIES) {
      const t = dark(step)
      expect(t["--surface-base"]).toBe(t["--background"])
    }
  })

  it("caps in light mode too", () => {
    // The axis used to be dark-only, which made it silently inert in half the
    // themes. slate[50] is `210 40% 98%`, so the cap genuinely binds in light.
    const light = (backgroundIntensity: BackgroundIntensity) =>
      generateTokens({
        accentColor: "blue",
        surfaceColor: "sepia",
        preset: "default",
        backgroundStyle: "solid",
        mode: "light",
        accentIntensity: "balanced",
        backgroundIntensity,
      })["--background"]
    expect(light("neutral").split(" ")[1]).toBe("0%")
    expect(light("neutral")).not.toBe(light("vivid"))
  })

  it("treats intense as uncapped, like vivid", () => {
    expect(dark("intense")["--background"]).toBe(dark("vivid")["--background"])
  })
})

describe("capCanvasSaturation", () => {
  // Direct unit tests on the helper, not routed through a palette colour.
  // Across all eighteen surface colours the dark canvas saturation ranges
  // from 16 to 84, so no palette input ever sits strictly below a cap —
  // the canvasTint suite above can't distinguish a clamp (Math.min) from a
  // plain assignment. A synthetic below-cap triplet closes that gap.
  it("leaves an already-below-cap saturation unchanged", () => {
    expect(capCanvasSaturation("200 10% 5%", 16)).toBe("200 10% 5%")
  })

  it("clamps an above-cap saturation down to the cap", () => {
    expect(capCanvasSaturation("200 40% 5%", 16)).toBe("200 16% 5%")
  })

  it("passes through unchanged when the cap is null", () => {
    expect(capCanvasSaturation("200 40% 5%", null)).toBe("200 40% 5%")
  })

  it("leaves a saturation exactly at the cap unchanged", () => {
    expect(capCanvasSaturation("200 16% 5%", 16)).toBe("200 16% 5%")
  })
})

// Chroma capping cannot drive these two tokens: accent[100..500] measure
// 0.03-0.18 OKLCH chroma, below every cap the primary treatment applies, so
// capChroma would return them unchanged at every step. They ramp by palette
// shade instead. `balanced` reproducing today's values is pinned separately.
describe("accentIntensity reach", () => {
  const base = {
    accentColor: "blue",
    surfaceColor: "slate",
    preset: "default",
    backgroundStyle: "solid",
  } as const

  for (const mode of ["light", "dark"] as const) {
    it(`moves --focus-ring across every step in ${mode} mode`, () => {
      const seen = new Set(
        ACCENT_INTENSITIES.map(
          (accentIntensity) =>
            generateTokens({ ...base, mode, accentIntensity })["--focus-ring"],
        ),
      )
      expect(seen.size).toBe(ACCENT_INTENSITIES.length)
    })

    it(`moves --sidebar-hover-bg across every step in ${mode} mode`, () => {
      const seen = new Set(
        ACCENT_INTENSITIES.map(
          (accentIntensity) =>
            generateTokens({ ...base, mode, accentIntensity })[
              "--sidebar-hover-bg"
            ],
        ),
      )
      expect(seen.size).toBe(ACCENT_INTENSITIES.length)
    })
  }

  it("reproduces today's sidebar hover at balanced", () => {
    const light = generateTokens({
      ...base,
      mode: "light",
      accentIntensity: "balanced",
    })
    const dark = generateTokens({
      ...base,
      mode: "dark",
      accentIntensity: "balanced",
    })
    expect(light["--sidebar-hover-bg"]).toBe(accentColors.blue[100])
    expect(dark["--sidebar-hover-bg"]).toBe(`${accentColors.blue[500]} / 0.15`)
  })

  it("keeps chart colours out of the axis", () => {
    const calm = generateTokens({
      ...base,
      mode: "dark",
      accentIntensity: "calm",
    })
    const intense = generateTokens({
      ...base,
      mode: "dark",
      accentIntensity: "intense",
    })
    expect(calm["--chart-1"]).toBe(intense["--chart-1"])
  })
})
