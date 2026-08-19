import { describe, it, expect } from "vitest"
import { generateTokens, capCanvasSaturation } from "./generateTokens"
import { accentColors } from "@theme/palettes/accentColors"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import { contrastRatio, hslStringToOklch } from "@theme/engine/oklch"
import { themeConfig } from "@theme/themeConfig"
import { presets, type PresetName } from "@theme/presets"
import { ACCENT_COLORS, SURFACE_COLORS, CANVAS_TINTS } from "@theme/types"
import type {
  ColorScale,
  AccentColor,
  AccentVibrancy,
  ResolvedMode,
  CanvasTint,
} from "@theme/types"

describe("generateTokens", () => {
  it("produces all expected token keys for the default combination", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "light",
      accentVibrancy: "balanced",
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
      "--surface-base",
      "--surface-raised",
      "--surface-overlay",
      "--surface-sunken",
      "--surface-sidebar",
      "--surface-header",
      "--border-subtle",
      "--border-default",
      "--border-strong",
      "--shadow-card",
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
      accentVibrancy: "balanced",
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
      accentVibrancy: "balanced",
    })
    const dark = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "dark",
      accentVibrancy: "balanced",
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
      accentVibrancy: "balanced",
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
      accentVibrancy: "balanced",
    })
    const darkTokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "dark",
      accentVibrancy: "balanced",
    })
    expect(lightTokens["--focus-ring"]).toBe(accentColors.blue[300])
    expect(darkTokens["--focus-ring"]).toBe(accentColors.blue[200])
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
        accentVibrancy: "balanced",
      })

    // White is unreadable on the light accents: it measures 2.14:1 on amber
    // against a 3:1 floor, which is why this is computed rather than fixed.
    expect(build("amber", "light")["--primary-foreground"]).toBe("222 47% 11%")
    expect(build("blue", "light")["--primary-foreground"]).toBe("0 0% 100%")
    expect(build("amber", "dark")["--primary-foreground"]).toBe("0 0% 100%")
  })

  it("dark mode flips background to step 950 and foreground to step 50", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "dark",
      accentVibrancy: "balanced",
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
      accentVibrancy: "balanced",
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
      accentVibrancy: "balanced",
    } as const

    for (const mode of ["light", "dark"] as const) {
      const slate = generateTokens({ ...common, surfaceColor: "slate", mode })
      const rose = generateTokens({ ...common, surfaceColor: "rose", mode })

      expect(slate["--border-strong"]).toBeTruthy()
      expect(rose["--border-strong"]).not.toEqual(slate["--border-strong"])
      expect(slate["--border-strong"]).not.toEqual(slate["--border-default"])
      expect(slate["--border-strong"]).not.toEqual(slate["--border-subtle"])
    }
  })

  it("derives chart colors from evenly spaced accent palettes", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "light",
      accentVibrancy: "balanced",
    })

    expect(tokens["--chart-1"]).toBeTruthy()
    expect(tokens["--chart-2"]).toBeTruthy()
    expect(tokens["--chart-3"]).toBeTruthy()
    expect(tokens["--chart-4"]).toBeTruthy()
    expect(tokens["--chart-5"]).toBeTruthy()

    const allDifferentOrValid = new Set([
      tokens["--chart-1"],
      tokens["--chart-2"],
      tokens["--chart-3"],
      tokens["--chart-4"],
      tokens["--chart-5"],
    ])
    expect(allDifferentOrValid.size).toBe(5)
  })

  it("glass preset no longer emits scalar opacity/blur tokens (CSS-driven)", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "glass",
      backgroundStyle: "solid",
      mode: "light",
      accentVibrancy: "balanced",
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
      accentVibrancy: "balanced",
    })

    expect(tokens["--primary"]).toBe("221 83% 53%")
    expect(tokens["--ring"]).toBe("221 83% 53%")
  })

  // Re-enabled in Phase 3 with the glass preset registered
  it("light + glass tints card shadow drops with blue-black (16 24 40)", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "glass",
      backgroundStyle: "solid",
      mode: "light",
      accentVibrancy: "balanced",
    })

    expect(tokens["--shadow-card"]).toContain("rgb(16 24 40")
    expect(tokens["--shadow-card"]).not.toContain("rgb(0 0 0")
    expect(tokens["--shadow-dropdown"]).toContain("rgb(16 24 40")
  })

  it("destructive uses red-500 for light and red-600 for dark", () => {
    const light = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "light",
      accentVibrancy: "balanced",
    })
    const dark = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "dark",
      accentVibrancy: "balanced",
    })

    expect(light["--destructive"]).toBe("0 84% 60%")
    expect(dark["--destructive"]).toBe("0 72% 51%")
  })

  it("success uses emerald-500 for light and emerald-400 for dark, white foreground", () => {
    const light = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "light",
      accentVibrancy: "balanced",
    })
    const dark = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "dark",
      accentVibrancy: "balanced",
    })

    expect(light["--success"]).toBe(accentColors.emerald[500])
    expect(dark["--success"]).toBe(accentColors.emerald[400])
    expect(light["--success-foreground"]).toBe("0 0% 100%")
    expect(dark["--success-foreground"]).toBe("0 0% 100%")
  })

  it("warning uses amber-500 for light and amber-400 for dark, dark foreground", () => {
    const light = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "light",
      accentVibrancy: "balanced",
    })
    const dark = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "dark",
      accentVibrancy: "balanced",
    })

    expect(light["--warning"]).toBe(accentColors.amber[500])
    expect(dark["--warning"]).toBe(accentColors.amber[400])
    expect(light["--warning-foreground"]).toBe("222 47% 11%")
    expect(dark["--warning-foreground"]).toBe("222 47% 11%")
  })

  it("success and warning are independent of accentColor", () => {
    const blueAccent = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "light",
      accentVibrancy: "balanced",
    })
    const redAccent = generateTokens({
      accentColor: "red",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "light",
      accentVibrancy: "balanced",
    })

    expect(blueAccent["--success"]).toBe(redAccent["--success"])
    expect(blueAccent["--warning"]).toBe(redAccent["--warning"])
  })

  it("uses desaturated accent color scale as surface when surfaceColor is set", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "red",
      preset: "default",
      backgroundStyle: "solid",
      mode: "light",
      accentVibrancy: "balanced",
    })

    expect(tokens["--background"]).toBe("0 34% 97%")
    expect(tokens["--foreground"]).toBe("222 47% 11%")
  })

  it("surfaceColor slate produces identical tokens to the original behavior", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "light",
      accentVibrancy: "balanced",
    })

    expect(tokens["--background"]).toBe("210 40% 98%")
    expect(tokens["--foreground"]).toBe("222 47% 11%")
  })

  it("dark mode with accent surface color uses shade 950 for background", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "emerald",
      preset: "default",
      backgroundStyle: "solid",
      mode: "dark",
      accentVibrancy: "balanced",
    })

    expect(tokens["--background"]).toBe("166 16% 5%")
    expect(tokens["--foreground"]).toBe("210 40% 98%")
  })

  describe("fog ramp tokens", () => {
    it("dark + glass does not emit fog tokens from common generateTokens", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        preset: "glass",
        backgroundStyle: "solid",
        mode: "dark",
        accentVibrancy: "balanced",
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
        accentVibrancy: "balanced",
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
        accentVibrancy: "balanced",
      })
      const light = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        preset: "default",
        backgroundStyle: "solid",
        mode: "light",
        accentVibrancy: "balanced",
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
        accentVibrancy: "balanced",
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
        accentVibrancy: "balanced",
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
        accentVibrancy: "balanced",
      })
      const light = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        preset: "default",
        backgroundStyle: "solid",
        mode: "light",
        accentVibrancy: "balanced",
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
        accentVibrancy: "balanced",
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
        accentVibrancy: "balanced",
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
        accentVibrancy: "balanced",
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
        accentVibrancy: "balanced",
      })

      expect(tokens["--noise-opacity"]).toBe("0")
    })
  })

  describe("sf-hue tokens", () => {
    const baseInput = {
      accentColor: "blue" as const,
      surfaceColor: "blue" as const,
      preset: "default" as const,
      backgroundStyle: "gradient" as const,
      mode: "dark" as const,
      accentVibrancy: "balanced" as const,
    }

    it("emits hsl shade-500 for --sf-hue in gradient mode", () => {
      const tokens = generateTokens(baseInput)
      expect(tokens["--sf-hue"]).toBe(`hsl(${accentColors.blue[500]})`)
    })

    it("emits hsl neighbor shade-500 for --sf-hue-2 (wheel +3)", () => {
      const tokens = generateTokens(baseInput)
      expect(tokens["--sf-hue-2"]).toBe(`hsl(${accentColors.purple[500]})`)
    })

    it("emits hsl shade-300 for --sf-hue-3 (lighter pastel)", () => {
      const tokens = generateTokens(baseInput)
      expect(tokens["--sf-hue-3"]).toBe(`hsl(${accentColors.blue[300]})`)
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
      expect(tokens["--sf-hue"]).toBe(`hsl(${accentColors.blue[500]})`)
      expect(tokens["--sf-hue-2"]).toBe(`hsl(${accentColors.purple[500]})`)
      expect(tokens["--sf-hue-3"]).toBe(`hsl(${accentColors.blue[300]})`)
    })
  })

  describe("--content-gradient-overlay after merge", () => {
    const baseInput = {
      accentColor: "blue" as const,
      surfaceColor: "blue" as const,
      preset: "default" as const,
      backgroundStyle: "gradient" as const,
      mode: "dark" as const,
      accentVibrancy: "balanced" as const,
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
      accentVibrancy: "balanced",
    } as const

    // The branches were inverted, putting slate-400 on the near-white light
    // rail (2.43:1) and slate-500 on the dark rail. Every other muted text
    // token in the kit uses 500 in light and 400 in dark.
    it("matches --muted-foreground's light/dark polarity", () => {
      const light = generateTokens({ ...base, mode: "light" })
      const dark = generateTokens({ ...base, mode: "dark" })
      expect(light["--sidebar-foreground-muted"]).toBe(slate[500])
      expect(dark["--sidebar-foreground-muted"]).toBe(slate[400])
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

  describe("accent vibrancy axis", () => {
    const CHROMA_TOLERANCE = 0.005
    /** sRGB gamut ceiling across accents in the usable lightness band. */
    const GAMUT_CHROMA_MAX = 0.26

    const STEPS = {
      calm: { L: 0.54, fillChroma: 0.24, primaryChroma: 0.2, labelFloor: 4.5 },
      balanced: {
        L: 0.57,
        fillChroma: null,
        primaryChroma: 0.24,
        labelFloor: 4,
      },
      vivid: { L: 0.6, fillChroma: null, primaryChroma: null, labelFloor: 3.5 },
      intense: {
        L: 0.63,
        fillChroma: null,
        primaryChroma: null,
        labelFloor: 3,
      },
    } as const

    const VIBRANCIES = Object.keys(STEPS) as (keyof typeof STEPS)[]

    const build = (
      accentColor: AccentColor,
      mode: ResolvedMode,
      accentVibrancy: AccentVibrancy = "balanced",
      preset: PresetName = "default",
    ) =>
      generateTokens({
        accentColor,
        surfaceColor: "slate",
        preset,
        backgroundStyle: "solid",
        mode,
        accentVibrancy,
      })

    const PAIRS = (["default", "glass"] as const).flatMap((preset) =>
      VIBRANCIES.flatMap((step) =>
        ACCENT_COLORS.map((a) => [a, step, preset] as const),
      ),
    )

    it.each(PAIRS)(
      "%s at %s on %s: fill lands on the step lightness within its chroma cap",
      (accentColor, step, preset) => {
        const fill = build(accentColor, "dark", step, preset)[
          "--primary-fill"
        ] as string
        const { L, C } = hslStringToOklch(fill)
        const cap = STEPS[step].fillChroma ?? GAMUT_CHROMA_MAX

        expect(Math.abs(L - STEPS[step].L)).toBeLessThanOrEqual(0.02)
        expect(C).toBeLessThanOrEqual(cap + CHROMA_TOLERANCE)
      },
    )

    it.each(PAIRS)(
      "%s at %s on %s: --primary keeps its palette lightness",
      (accentColor, step, preset) => {
        const shade = preset === "glass" ? 400 : 500
        const base = hslStringToOklch(accentColors[accentColor][shade])
        const got = hslStringToOklch(
          build(accentColor, "dark", step, preset)["--primary"] as string,
        )
        const cap = STEPS[step].primaryChroma ?? GAMUT_CHROMA_MAX

        expect(Math.abs(got.L - base.L)).toBeLessThanOrEqual(0.02)
        expect(got.C).toBeLessThanOrEqual(cap + CHROMA_TOLERANCE)
      },
    )

    it.each(PAIRS)(
      "%s at %s on %s: label clears the step's floor and stays white",
      (accentColor, step, preset) => {
        const tokens = build(accentColor, "dark", step, preset)
        expect(tokens["--primary-foreground"]).toBe("0 0% 100%")
        expect(
          contrastRatio(
            tokens["--primary-foreground"] as string,
            tokens["--primary-fill"] as string,
          ),
        ).toBeGreaterThanOrEqual(STEPS[step].labelFloor)
      },
    )

    // Slate only, deliberately. Fuchsia on an emerald surface measures 2.76
    // today, so widening this guard would fail on pre-existing behaviour.
    it.each(PAIRS)(
      "%s at %s on %s: fill clears the UI-boundary floor against the card",
      (accentColor, step, preset) => {
        const tokens = build(accentColor, "dark", step, preset)
        expect(
          contrastRatio(
            tokens["--primary-fill"] as string,
            tokens["--card"] as string,
          ),
        ).toBeGreaterThanOrEqual(3)
      },
    )

    // Measured across every surface colour, not just slate. The worst case is
    // indigo on an emerald surface, which sits at 4.32 — already 4.38 before
    // this axis existed, so the floor holds the status quo rather than
    // claiming AA cleanliness on every surface.
    it.each(VIBRANCIES)(
      "%s: accent text clears the floor on the worst surface colour",
      (step) => {
        for (const surfaceColor of SURFACE_COLORS) {
          for (const accentColor of ACCENT_COLORS) {
            const tokens = generateTokens({
              accentColor,
              surfaceColor,
              preset: "default",
              backgroundStyle: "solid",
              mode: "dark",
              accentVibrancy: step,
            })
            expect(
              contrastRatio(
                tokens["--primary"] as string,
                tokens["--background"] as string,
              ),
              `${accentColor} on ${surfaceColor}`,
            ).toBeGreaterThanOrEqual(4.3)
          }
        }
      },
    )

    // The guard that would have caught a chroma-only ladder, which collapsed
    // to identical fills for most accents because chroma is gamut-limited.
    it.each(ACCENT_COLORS)(
      "%s: all four steps emit distinct fills",
      (accentColor) => {
        const fills = VIBRANCIES.map(
          (step) => build(accentColor, "dark", step)["--primary-fill"],
        )
        expect(new Set(fills).size).toBe(4)
      },
    )

    it.each(ACCENT_COLORS)("%s: light mode ignores the axis", (accentColor) => {
      for (const step of VIBRANCIES) {
        const tokens = build(accentColor, "light", step)
        expect(tokens["--primary"]).toBe(accentColors[accentColor][500])
        expect(tokens["--primary-fill"]).toBe(accentColors[accentColor][500])
      }
    })

    it("light glass keeps its own shade at every step", () => {
      for (const step of VIBRANCIES) {
        const tokens = build("blue", "light", step, "glass")
        expect(tokens["--primary"]).toBe(accentColors.blue[600])
      }
    })

    it("emits a fill for every preset so none can go stale", () => {
      for (const preset of Object.keys(presets) as PresetName[]) {
        const tokens = generateTokens({
          accentColor: "blue",
          surfaceColor: "slate",
          preset,
          backgroundStyle: "solid",
          mode: "dark",
          accentVibrancy: "balanced",
        })

        expect(tokens["--primary-fill"], preset).toBeTruthy()
      }
    })
  })

  describe("calm pins the quietest step", () => {
    // Pinned expected values for the ladder's bottom rung. This is the
    // regression guard that catches drift in "calm" — it must never be
    // regenerated to match new output.
    const CALM_SNAPSHOT = {
      red: { fill: "355 79% 45%", primary: "1 81% 60%" },
      orange: { fill: "26 98% 35%", primary: "25 95% 53%" },
      amber: { fill: "38 100% 30%", primary: "38 92% 50%" },
      yellow: { fill: "45 96% 28%", primary: "45 93% 47%" },
      lime: { fill: "83 95% 25%", primary: "85 73% 46%" },
      green: { fill: "146 98% 26%", primary: "142 71% 45%" },
      emerald: { fill: "160 90% 27%", primary: "160 84% 39%" },
      teal: { fill: "173 88% 27%", primary: "173 80% 40%" },
      cyan: { fill: "189 89% 30%", primary: "189 94% 43%" },
      sky: { fill: "199 92% 35%", primary: "199 89% 48%" },
      blue: { fill: "217 74% 49%", primary: "217 91% 60%" },
      indigo: { fill: "240 70% 61%", primary: "239 82% 67%" },
      violet: { fill: "259 72% 58%", primary: "257 78% 65%" },
      purple: { fill: "273 68% 53%", primary: "270 74% 64%" },
      fuchsia: { fill: "292 74% 43%", primary: "292 63% 62%" },
      pink: { fill: "326 82% 42%", primary: "331 76% 61%" },
      rose: { fill: "342 99% 40%", primary: "351 82% 61%" },
    } as const

    it.each(ACCENT_COLORS)("%s", (accentColor) => {
      const tokens = generateTokens({
        accentColor,
        surfaceColor: "slate",
        preset: "default",
        backgroundStyle: "solid",
        mode: "dark",
        accentVibrancy: "calm",
      })
      expect(tokens["--primary-fill"]).toBe(CALM_SNAPSHOT[accentColor].fill)
      expect(tokens["--primary"]).toBe(CALM_SNAPSHOT[accentColor].primary)
    })
  })
})

describe("accent vibrancy default", () => {
  // Pinned deliberately. The default ships filled-control labels at 4.10,
  // below AA, which the spec records as an accepted risk — a silent change
  // to this value would change that risk without review.
  it("is balanced", () => {
    expect(themeConfig.defaults.accentVibrancy).toBe("balanced")
  })

  it("is exposed in the switcher", () => {
    expect(themeConfig.switcher.axes.accentVibrancy).toBe(true)
  })
})

describe("canvasTint", () => {
  const dark = (canvasTint: CanvasTint, surfaceColor = "violet" as const) =>
    generateTokens({
      accentColor: "blue",
      surfaceColor,
      preset: "default",
      backgroundStyle: "solid",
      mode: "dark",
      accentVibrancy: "balanced",
      canvasTint,
    })

  it("caps canvas saturation at each step", () => {
    expect(dark("neutral")["--background"]).toBe("261 0% 5%")
    expect(dark("subtle")["--background"]).toBe("261 8% 5%")
    expect(dark("balanced")["--background"]).toBe("261 16% 5%")
  })

  it("leaves vivid at the palette's own value", () => {
    expect(dark("vivid")["--background"]).toBe("261 26% 5%")
  })

  it("clamps rather than sets, so an already-calm colour is untouched", () => {
    // indigo's dark canvas is 16% saturation, exactly the balanced cap
    const atCap = dark("balanced", "indigo")["--background"]
    expect(dark("vivid", "indigo")["--background"]).toBe(atCap)
  })

  it("caps slate, whose palette value is the most saturated of all", () => {
    expect(dark("vivid", "slate")["--background"]).toBe("229 84% 5%")
    expect(dark("balanced", "slate")["--background"]).toBe("229 16% 5%")
  })

  it("never changes lightness or hue", () => {
    for (const step of CANVAS_TINTS) {
      const [h, , l] = dark(step)["--background"].split(" ")
      expect(h).toBe("261")
      expect(l).toBe("5%")
    }
  })

  it("moves --surface-base in lockstep with --background", () => {
    for (const step of CANVAS_TINTS) {
      const t = dark(step)
      expect(t["--surface-base"]).toBe(t["--background"])
    }
  })

  it("is inert in light mode", () => {
    const light = (canvasTint: CanvasTint) =>
      generateTokens({
        accentColor: "blue",
        surfaceColor: "violet",
        preset: "default",
        backgroundStyle: "solid",
        mode: "light",
        accentVibrancy: "balanced",
        canvasTint,
      })["--background"]
    expect(light("neutral")).toBe(light("vivid"))
  })

  it("leaves the palette scale itself untouched", () => {
    // --surface-sunken and --surface-sidebar also derive from surface[950];
    // capping the canvas must not follow them, or the change has been applied
    // one level too deep.
    const a = dark("neutral")
    const b = dark("vivid")
    expect(a["--surface-sunken"]).toBe(b["--surface-sunken"])
    expect(a["--surface-sidebar"]).toBe(b["--surface-sidebar"])
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
