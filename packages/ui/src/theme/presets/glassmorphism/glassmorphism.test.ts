// packages/ui/src/theme/presets/glassmorphism/glassmorphism.test.ts
import { describe, it, expect } from "vitest"
import { glassmorphism } from "./glassmorphism"
import { accentColors } from "@theme/palettes/accentColors"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import type { ColorScale } from "@theme/types"

const slate = surfaceColors.slate as ColorScale
const blue = accentColors.blue

function buildCommon(
  overrides: Partial<
    Parameters<NonNullable<typeof glassmorphism.generateTokens>>[0]
  > = {},
) {
  return {
    accentColor: "blue" as const,
    surfaceColor: "slate" as const,
    backgroundStyle: "solid" as const,
    mode: "light" as const,
    accent: blue,
    surface: slate,
    neutral: slate,
    ...overrides,
  }
}

describe("glassmorphism preset", () => {
  it("declares opacity and blur axes with the expected default and value sets", () => {
    expect(glassmorphism.axes.opacity.values).toEqual([
      "subtle",
      "medium",
      "strong",
    ])
    expect(glassmorphism.axes.opacity.default).toBe("medium")
    expect(glassmorphism.axes.blur.values).toEqual([
      "none",
      "low",
      "medium",
      "high",
    ])
    expect(glassmorphism.axes.blur.default).toBe("medium")
  })

  it("ownedTokenKeys covers the per-preset token surface", () => {
    expect(glassmorphism.ownedTokenKeys).toEqual([
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
      "--border",
    ])
  })

  describe("generateTokens", () => {
    const generateTokens = glassmorphism.generateTokens as NonNullable<
      typeof glassmorphism.generateTokens
    >

    it("light + medium opacity = today's baseline fog alphas", () => {
      const tokens = generateTokens(buildCommon(), {
        opacity: "medium",
        blur: "medium",
      })
      expect(tokens["--fog-05"]).toBe("rgba(255, 255, 255, 0.55)")
      expect(tokens["--fog-50"]).toBe("rgba(255, 255, 255, 0.96)")
    })

    it("light + subtle opacity = higher alphas (more solid)", () => {
      const tokens = generateTokens(buildCommon(), {
        opacity: "subtle",
        blur: "medium",
      })
      expect(tokens["--fog-05"]).toBe("rgba(255, 255, 255, 0.7)")
      expect(tokens["--fog-50"]).toBe("rgba(255, 255, 255, 0.98)")
    })

    it("light + strong opacity = lower alphas (more transparent)", () => {
      const tokens = generateTokens(buildCommon(), {
        opacity: "strong",
        blur: "medium",
      })
      expect(tokens["--fog-05"]).toBe("rgba(255, 255, 255, 0.3)")
      expect(tokens["--fog-50"]).toBe("rgba(255, 255, 255, 0.82)")
    })

    it("dark + medium opacity = today's baseline dark alphas", () => {
      const tokens = generateTokens(buildCommon({ mode: "dark" }), {
        opacity: "medium",
        blur: "medium",
      })
      expect(tokens["--fog-05"]).toBe("rgba(255, 255, 255, 0.04)")
      expect(tokens["--fog-50"]).toBe("rgba(255, 255, 255, 0.38)")
    })

    it("inset-hi scales with opacity in light mode", () => {
      const subtle = generateTokens(buildCommon(), {
        opacity: "subtle",
        blur: "medium",
      })
      const strong = generateTokens(buildCommon(), {
        opacity: "strong",
        blur: "medium",
      })
      expect(subtle["--inset-hi"]).toBe(
        "inset 0 1px 0 rgba(255, 255, 255, 0.75)",
      )
      expect(strong["--inset-hi"]).toBe(
        "inset 0 1px 0 rgba(255, 255, 255, 0.4)",
      )
    })

    it("dark + gradient bg → --border becomes translucent white", () => {
      const tokens = generateTokens(
        buildCommon({ mode: "dark", backgroundStyle: "gradient" }),
        { opacity: "medium", blur: "medium" },
      )
      expect(tokens["--border"]).toBe("0 0% 100% / 0.1")
    })

    it("dark + solid bg → --border NOT set (common-axis default applies)", () => {
      const tokens = generateTokens(
        buildCommon({ mode: "dark", backgroundStyle: "solid" }),
        { opacity: "medium", blur: "medium" },
      )
      expect(tokens["--border"]).toBeUndefined()
    })

    it("light bg-anything → --border NOT set (common-axis default applies)", () => {
      const solid = generateTokens(
        buildCommon({ mode: "light", backgroundStyle: "solid" }),
        {
          opacity: "medium",
          blur: "medium",
        },
      )
      const gradient = generateTokens(
        buildCommon({ mode: "light", backgroundStyle: "gradient" }),
        {
          opacity: "medium",
          blur: "medium",
        },
      )
      expect(solid["--border"]).toBeUndefined()
      expect(gradient["--border"]).toBeUndefined()
    })
  })

  describe("surfaceRecipe", () => {
    it("matches today's surfaceStyles.glassmorphism for dark borders", () => {
      expect(glassmorphism.surfaceRecipe.borderSubtle(slate, "dark")).toBe(
        slate[600],
      )
      expect(glassmorphism.surfaceRecipe.borderDefault(slate, "dark")).toBe(
        slate[500],
      )
    })

    it("matches today's surfaceStyles.glassmorphism for light borders", () => {
      expect(glassmorphism.surfaceRecipe.borderSubtle(slate, "light")).toBe(
        slate[100],
      )
      expect(glassmorphism.surfaceRecipe.borderDefault(slate, "light")).toBe(
        slate[200],
      )
    })
  })
})
