import { describe, it, expect } from "vitest"
import { generateTokens } from "./generate-tokens"
import { accentColors } from "../palettes/accent-colors"
import { surfaceColors } from "../palettes/surface-colors"
import type { ColorScale } from "../types"

describe("generateTokens", () => {
  it("produces all expected token keys for the default combination", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "light",
    })

    const expectedKeys = [
      "--primary",
      "--primary-foreground",
      "--ring",
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
      "--radius",
      "--shadow-card",
      "--shadow-dropdown",
      "--backdrop-blur",
      "--surface-opacity",
      "--theme-font-heading",
    ]

    for (const key of expectedKeys) {
      expect(tokens).toHaveProperty(key)
      expect(tokens[key]).toBeTruthy()
    }
  })

  it("uses shade 500 for primary in light mode and shade 400 in dark mode", () => {
    const light = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "light",
    })
    const dark = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "dark",
    })

    expect(light["--primary"]).toBe("217 91% 60%")
    expect(dark["--primary"]).toBe("213 94% 68%")
  })

  it("uses dark foreground for light accent colors (amber, yellow, lime)", () => {
    const amber = generateTokens({
      accentColor: "amber",
      surfaceColor: "slate",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "light",
    })
    expect(amber["--primary-foreground"]).toBe("21 92% 14%")

    const blue = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "light",
    })
    expect(blue["--primary-foreground"]).toBe("0 0% 100%")
  })

  it("dark mode flips background to step 950 and foreground to step 50", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "dark",
    })

    expect(tokens["--background"]).toBe("229 84% 5%")
    expect(tokens["--foreground"]).toBe("210 40% 98%")
  })

  it("derives chart colors from evenly spaced accent palettes", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
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

  it("glassmorphism style sets backdrop-blur and reduced opacity", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "glassmorphism",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "light",
    })

    expect(tokens["--backdrop-blur"]).toBe("12px")
    expect(tokens["--surface-opacity"]).toBe("0.5")
    expect(tokens["--backdrop-filter"]).toContain("saturate(140%)")
  })

  it("light + glassmorphism shifts primary from accent-500 to accent-600 for AA contrast", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "glassmorphism",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "light",
    })

    expect(tokens["--primary"]).toBe("221 83% 53%")
    expect(tokens["--ring"]).toBe("221 83% 53%")
  })

  it("light + glassmorphism tints card shadow drops with blue-black (16 24 40)", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "glassmorphism",
      backgroundStyle: "solid",
      fontFamily: "default",
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
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "light",
    })
    const dark = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "dark",
    })

    expect(light["--destructive"]).toBe("0 84% 60%")
    expect(dark["--destructive"]).toBe("0 72% 51%")
  })

  it("emits font tokens for the selected font family", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "humanist",
      mode: "light",
    })

    expect(tokens["--theme-font-sans"]).toBe("DM Sans")
    expect(tokens["--theme-font-heading"]).toBe("DM Sans")
    expect(tokens["--theme-font-mono"]).toBe("DM Mono")
  })

  it("uses desaturated accent color scale as surface when surfaceColor is set", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "red",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "light",
    })

    expect(tokens["--background"]).toBe("0 34% 97%")
    expect(tokens["--foreground"]).toBe("222 47% 11%")
  })

  it("surfaceColor slate produces identical tokens to the original behavior", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "light",
    })

    expect(tokens["--background"]).toBe("210 40% 98%")
    expect(tokens["--foreground"]).toBe("222 47% 11%")
  })

  it("dark mode with accent surface color uses shade 950 for background", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "emerald",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "dark",
    })

    expect(tokens["--background"]).toBe("166 32% 5%")
    expect(tokens["--foreground"]).toBe("210 40% 98%")
  })

  describe("fog ramp tokens", () => {
    it("dark + glassmorphism emits the thin-white fog ramp", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        surfaceStyle: "glassmorphism",
        backgroundStyle: "solid",
        fontFamily: "default",
        mode: "dark",
      })

      expect(tokens["--fog-05"]).toBe("rgba(255, 255, 255, 0.04)")
      expect(tokens["--fog-10"]).toBe("rgba(255, 255, 255, 0.07)")
      expect(tokens["--fog-15"]).toBe("rgba(255, 255, 255, 0.10)")
      expect(tokens["--fog-20"]).toBe("rgba(255, 255, 255, 0.14)")
      expect(tokens["--fog-30"]).toBe("rgba(255, 255, 255, 0.20)")
      expect(tokens["--fog-50"]).toBe("rgba(255, 255, 255, 0.38)")
    })

    it("light + glassmorphism emits the paper-glass fog ramp", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        surfaceStyle: "glassmorphism",
        backgroundStyle: "solid",
        fontFamily: "default",
        mode: "light",
      })

      expect(tokens["--fog-05"]).toBe("rgba(255, 255, 255, 0.55)")
      expect(tokens["--fog-10"]).toBe("rgba(255, 255, 255, 0.65)")
      expect(tokens["--fog-15"]).toBe("rgba(255, 255, 255, 0.72)")
      expect(tokens["--fog-20"]).toBe("rgba(255, 255, 255, 0.82)")
      expect(tokens["--fog-30"]).toBe("rgba(255, 255, 255, 0.90)")
      expect(tokens["--fog-50"]).toBe("rgba(255, 255, 255, 0.96)")
    })

    it("dark + default surface style emits transparent for every fog token", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        surfaceStyle: "default",
        backgroundStyle: "solid",
        fontFamily: "default",
        mode: "dark",
      })

      expect(tokens["--fog-05"]).toBe("transparent")
      expect(tokens["--fog-10"]).toBe("transparent")
      expect(tokens["--fog-15"]).toBe("transparent")
      expect(tokens["--fog-20"]).toBe("transparent")
      expect(tokens["--fog-30"]).toBe("transparent")
      expect(tokens["--fog-50"]).toBe("transparent")
    })

    it("light + default surface style emits transparent for every fog token", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        surfaceStyle: "default",
        backgroundStyle: "solid",
        fontFamily: "default",
        mode: "light",
      })

      expect(tokens["--fog-05"]).toBe("transparent")
      expect(tokens["--fog-10"]).toBe("transparent")
      expect(tokens["--fog-15"]).toBe("transparent")
      expect(tokens["--fog-20"]).toBe("transparent")
      expect(tokens["--fog-30"]).toBe("transparent")
      expect(tokens["--fog-50"]).toBe("transparent")
    })
  })

  describe("inset rim tokens", () => {
    it("dark + glassmorphism emits the dark-glass inset rim values", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        surfaceStyle: "glassmorphism",
        backgroundStyle: "solid",
        fontFamily: "default",
        mode: "dark",
      })

      expect(tokens["--inset-hi"]).toBe("inset 0 1px 0 rgba(255,255,255,0.14)")
      expect(tokens["--inset-hi-strong"]).toBe(
        "inset 0 1px 0 rgba(255,255,255,0.22)",
      )
      expect(tokens["--inset-hi-button"]).toBe(
        "inset 0 1px 0 rgba(255,255,255,0.28)",
      )
    })

    it("light + glassmorphism emits the light-glass inset rim values", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        surfaceStyle: "glassmorphism",
        backgroundStyle: "solid",
        fontFamily: "default",
        mode: "light",
      })

      expect(tokens["--inset-hi"]).toBe("inset 0 1px 0 rgba(255,255,255,0.6)")
      expect(tokens["--inset-hi-strong"]).toBe(
        "inset 0 1px 0 rgba(255,255,255,0.75)",
      )
      expect(tokens["--inset-hi-button"]).toBe(
        "inset 0 1px 0 rgba(255,255,255,0.6)",
      )
    })

    it("dark + default surface style emits none for every inset rim token", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        surfaceStyle: "default",
        backgroundStyle: "solid",
        fontFamily: "default",
        mode: "dark",
      })

      expect(tokens["--inset-hi"]).toBe("none")
      expect(tokens["--inset-hi-strong"]).toBe("none")
      expect(tokens["--inset-hi-button"]).toBe("none")
    })

    it("light + default surface style emits none for every inset rim token", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        surfaceStyle: "default",
        backgroundStyle: "solid",
        fontFamily: "default",
        mode: "light",
      })

      expect(tokens["--inset-hi"]).toBe("none")
      expect(tokens["--inset-hi-strong"]).toBe("none")
      expect(tokens["--inset-hi-button"]).toBe("none")
    })
  })

  describe("noise opacity token", () => {
    it("dark + gradient background emits 0.5 noise opacity", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        surfaceStyle: "default",
        backgroundStyle: "gradient",
        fontFamily: "default",
        mode: "dark",
      })

      expect(tokens["--noise-opacity"]).toBe("0.5")
    })

    it("light + gradient background emits 0.6 noise opacity", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        surfaceStyle: "default",
        backgroundStyle: "gradient",
        fontFamily: "default",
        mode: "light",
      })

      expect(tokens["--noise-opacity"]).toBe("0.6")
    })

    it("dark + solid background emits 0 noise opacity", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        surfaceStyle: "default",
        backgroundStyle: "solid",
        fontFamily: "default",
        mode: "dark",
      })

      expect(tokens["--noise-opacity"]).toBe("0")
    })

    it("light + solid background emits 0 noise opacity", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        surfaceStyle: "default",
        backgroundStyle: "solid",
        fontFamily: "default",
        mode: "light",
      })

      expect(tokens["--noise-opacity"]).toBe("0")
    })
  })

  describe("sf-hue tokens", () => {
    const baseInput = {
      accentColor: "blue" as const,
      surfaceColor: "blue" as const,
      surfaceStyle: "default" as const,
      backgroundStyle: "gradient" as const,
      fontFamily: "default" as const,
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
      surfaceStyle: "default" as const,
      backgroundStyle: "gradient" as const,
      fontFamily: "default" as const,
      mode: "dark" as const,
    }

    it("gradient + default → four-layer var() composition", () => {
      const tokens = generateTokens(baseInput)
      expect(
        tokens["--content-gradient-overlay"].replace(/\s+/g, " ").trim(),
      ).toBe(
        "var(--canvas-blob-a), var(--canvas-blob-b), var(--canvas-blob-c), var(--canvas-ink)",
      )
    })

    it("solid + glass → preserved linear accent fade", () => {
      const tokens = generateTokens({
        ...baseInput,
        backgroundStyle: "solid",
        surfaceStyle: "glassmorphism",
      })
      const out = tokens["--content-gradient-overlay"]
        .replace(/\s+/g, " ")
        .trim()
      expect(out).toMatch(
        /^linear-gradient\(135deg, hsl\([^)]+\) 0%, transparent 70%\)$/,
      )
    })

    it("gradient + glass → none (body already paints blobs)", () => {
      const tokens = generateTokens({
        ...baseInput,
        backgroundStyle: "gradient",
        surfaceStyle: "glassmorphism",
      })
      expect(tokens["--content-gradient-overlay"]).toBe("none")
    })

    it("solid + default → none", () => {
      const tokens = generateTokens({
        ...baseInput,
        backgroundStyle: "solid",
        surfaceStyle: "default",
      })
      expect(tokens["--content-gradient-overlay"]).toBe("none")
    })
  })
})
