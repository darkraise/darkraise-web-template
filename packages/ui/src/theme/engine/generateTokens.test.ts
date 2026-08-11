import { describe, it, expect } from "vitest"
import { generateTokens } from "./generateTokens"
import { accentColors } from "@theme/palettes/accentColors"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import { contrastRatio, hslStringToOklch } from "@theme/engine/oklch"
import { presets, type PresetName } from "@theme/presets"
import { ACCENT_COLORS } from "@theme/types"
import type { ColorScale, AccentColor, ResolvedMode } from "@theme/types"

describe("generateTokens", () => {
  it("produces all expected token keys for the default combination", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "light",
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
    })
    const dark = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "dark",
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
    })
    const darkTokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "dark",
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
    })

    expect(tokens["--background"]).toBe("229 84% 5%")
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
    })
    expect(tokens["--border"]).not.toEqual(tokens["--muted"])
    expect(tokens["--border"]).not.toEqual(tokens["--secondary"])
    expect(tokens["--border"]).not.toEqual(tokens["--accent"])
    expect(tokens["--border"]).toEqual(tokens["--border-default"])
  })

  it("derives chart colors from evenly spaced accent palettes", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "light",
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
    })
    const dark = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "dark",
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
    })
    const dark = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "dark",
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
    })
    const dark = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "dark",
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
    })
    const redAccent = generateTokens({
      accentColor: "red",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "light",
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
    })

    expect(tokens["--background"]).toBe("166 32% 5%")
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
      })
      const light = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        preset: "default",
        backgroundStyle: "solid",
        mode: "light",
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
      })
      const light = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        preset: "default",
        backgroundStyle: "solid",
        mode: "light",
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

  describe("dark accent fill calming", () => {
    const FILL_LIGHTNESS = 0.54
    const FILL_CHROMA_MAX = 0.19
    const PRIMARY_CHROMA_MAX = 0.2
    // Integer-HSL storage rounds the emitted value, which can push measured
    // chroma marginally past the cap — 0.0022 was the worst overshoot observed
    // across the candidate lightnesses. This tolerance is wider than that and
    // far tighter than the caps themselves, so it still catches a real breach.
    const CHROMA_TOLERANCE = 0.005

    const build = (accentColor: AccentColor, mode: ResolvedMode) =>
      generateTokens({
        accentColor,
        surfaceColor: "slate",
        preset: "default",
        backgroundStyle: "solid",
        mode,
      })

    it.each(ACCENT_COLORS)(
      "%s: dark fill lands on one perceptual lightness within the chroma cap",
      (accentColor) => {
        const fill = build(accentColor, "dark")["--primary-fill"] as string
        const { L, C } = hslStringToOklch(fill)

        // 0.02, not toBeCloseTo(x, 2): tokens are stored as integer HSL, and one
        // percent of HSL lightness costs up to 0.008 in OKLCH L near the gamut
        // cusps. Tight enough to hold every accent to one visual weight.
        expect(Math.abs(L - FILL_LIGHTNESS)).toBeLessThanOrEqual(0.02)
        expect(C).toBeLessThanOrEqual(FILL_CHROMA_MAX + CHROMA_TOLERANCE)
      },
    )

    it.each(ACCENT_COLORS)(
      "%s: dark label clears AA on the fill",
      (accentColor) => {
        const tokens = build(accentColor, "dark")
        const ratio = contrastRatio(
          tokens["--primary-foreground"] as string,
          tokens["--primary-fill"] as string,
        )

        expect(ratio).toBeGreaterThanOrEqual(4.5)
      },
    )

    it.each(ACCENT_COLORS)(
      "%s: light label clears the large-text floor on the fill",
      (accentColor) => {
        const tokens = build(accentColor, "light")
        const ratio = contrastRatio(
          tokens["--primary-foreground"] as string,
          tokens["--primary-fill"] as string,
        )

        expect(ratio).toBeGreaterThanOrEqual(3)
      },
    )

    it.each(ACCENT_COLORS)(
      "%s: dark fill clears the UI-boundary floor against the card",
      (accentColor) => {
        const tokens = build(accentColor, "dark")
        const ratio = contrastRatio(
          tokens["--primary-fill"] as string,
          tokens["--card"] as string,
        )

        expect(ratio).toBeGreaterThanOrEqual(3)
      },
    )

    it.each(ACCENT_COLORS)(
      "%s: dark accent chroma is capped without moving its lightness",
      (accentColor) => {
        const base = hslStringToOklch(accentColors[accentColor][500])
        const capped = hslStringToOklch(
          build(accentColor, "dark")["--primary"] as string,
        )

        expect(capped.C).toBeLessThanOrEqual(
          PRIMARY_CHROMA_MAX + CHROMA_TOLERANCE,
        )
        expect(Math.abs(capped.L - base.L)).toBeLessThanOrEqual(0.02)
      },
    )

    it.each(ACCENT_COLORS)(
      "%s: light mode fills are untouched",
      (accentColor) => {
        const tokens = build(accentColor, "light")

        expect(tokens["--primary"]).toBe(accentColors[accentColor][500])
        expect(tokens["--primary-fill"]).toBe(accentColors[accentColor][500])
      },
    )

    it.each(["amber", "yellow", "lime"] as const)(
      "%s: takes the ink label in light mode instead of unreadable white",
      (accentColor) => {
        expect(build(accentColor, "light")["--primary-foreground"]).toBe(
          "222 47% 11%",
        )
      },
    )

    it("keeps white labels on every accent in dark mode", () => {
      for (const accentColor of ACCENT_COLORS) {
        expect(build(accentColor, "dark")["--primary-foreground"]).toBe(
          "0 0% 100%",
        )
      }
    })

    it("normalizes the glass preset's brighter shade to the same fill", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        preset: "glass",
        backgroundStyle: "solid",
        mode: "dark",
      })

      expect(
        Math.abs(
          hslStringToOklch(tokens["--primary-fill"] as string).L -
            FILL_LIGHTNESS,
        ),
      ).toBeLessThanOrEqual(0.02)
    })

    it("emits a fill for every preset so none can go stale", () => {
      for (const preset of Object.keys(presets) as PresetName[]) {
        const tokens = generateTokens({
          accentColor: "blue",
          surfaceColor: "slate",
          preset,
          backgroundStyle: "solid",
          mode: "dark",
        })

        expect(tokens["--primary-fill"], preset).toBeTruthy()
      }
    })
  })
})
