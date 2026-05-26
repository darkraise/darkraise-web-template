// packages/ui/src/theme/presets/glass/glass.test.ts
import { describe, it, expect } from "vitest"
import { glass } from "./glass"
import { accentColors } from "@theme/palettes/accentColors"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import type { ColorScale } from "@theme/types"

const slate = surfaceColors.slate as ColorScale
const blue = accentColors.blue

function buildCommon(
  overrides: Partial<
    Parameters<NonNullable<typeof glass.generateTokens>>[0]
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

describe("glass preset", () => {
  it("declares opacity and blur axes with the expected default and value sets", () => {
    expect(glass.axes.opacity.values).toEqual(["subtle", "medium", "strong"])
    expect(glass.axes.opacity.default).toBe("medium")
    expect(glass.axes.blur.values).toEqual(["none", "low", "medium", "high"])
    expect(glass.axes.blur.default).toBe("medium")
  })

  it("ownedTokenKeys lists only what generateTokens actually writes", () => {
    // --backdrop-blur / --backdrop-filter / --surface-opacity are set
    // by glass.css attribute selectors (CSS-only), so they self-clean
    // via the cascade and don't belong in this list.
    expect(glass.ownedTokenKeys).toEqual([
      "--fog-05",
      "--fog-10",
      "--fog-15",
      "--fog-20",
      "--fog-30",
      "--fog-50",
      "--inset-hi",
      "--inset-hi-strong",
      "--inset-hi-button",
      "--border",
      "--accent",
      "--accent-foreground",
      "--muted",
      "--secondary",
      "--secondary-foreground",
      "--glass-halo-raised",
      "--glass-halo-overlay",
      "--glass-halo-modal",
    ])
  })

  describe("generateTokens", () => {
    const generateTokens = glass.generateTokens as NonNullable<
      typeof glass.generateTokens
    >

    // Fog tokens are accent-tinted color-mix expressions. Dilution
    // base differs by mode:
    //   - Light: 24% accent[500] mixed into white. White-frosted
    //     surface with accent tint coming through.
    //   - Dark: 40% accent[400] mixed into surface[950]. Mixing into
    //     white in dark mode produced near-white fog at low alphas,
    //     overwhelming the accent. The deep dark base keeps the fog
    //     dark so accent registers; the higher 40% is needed because
    //     the dark base has its own hue and accent needs more weight
    //     to dominate visually.
    // Test fixture uses blue accent + slate surface palettes:
    //   accent[500] = "217 91% 60%", accent[400] = "213 94% 68%",
    //   slate[950] = "229 84% 5%".
    const lightBase = "color-mix(in oklab, hsl(217 91% 60%) 24%, white)"
    const darkBase =
      "color-mix(in oklab, hsl(213 94% 68%) 40%, hsl(229 84% 5%))"

    it("light + medium opacity = today's baseline fog alphas (accent-tinted)", () => {
      const tokens = generateTokens(buildCommon(), {
        opacity: "medium",
        blur: "medium",
        halo: "soft",
      })
      expect(tokens["--fog-05"]).toBe(
        `color-mix(in oklab, ${lightBase} 55.0%, transparent)`,
      )
      expect(tokens["--fog-50"]).toBe(
        `color-mix(in oklab, ${lightBase} 96.0%, transparent)`,
      )
    })

    it("light + subtle opacity = higher alphas (more solid)", () => {
      const tokens = generateTokens(buildCommon(), {
        opacity: "subtle",
        blur: "medium",
        halo: "soft",
      })
      expect(tokens["--fog-05"]).toBe(
        `color-mix(in oklab, ${lightBase} 70.0%, transparent)`,
      )
      expect(tokens["--fog-50"]).toBe(
        `color-mix(in oklab, ${lightBase} 98.0%, transparent)`,
      )
    })

    it("light + strong opacity = lower alphas (more transparent)", () => {
      const tokens = generateTokens(buildCommon(), {
        opacity: "strong",
        blur: "medium",
        halo: "soft",
      })
      expect(tokens["--fog-05"]).toBe(
        `color-mix(in oklab, ${lightBase} 30.0%, transparent)`,
      )
      expect(tokens["--fog-50"]).toBe(
        `color-mix(in oklab, ${lightBase} 82.0%, transparent)`,
      )
    })

    it("dark + medium opacity = today's baseline dark alphas (accent-tinted)", () => {
      const tokens = generateTokens(buildCommon({ mode: "dark" }), {
        opacity: "medium",
        blur: "medium",
        halo: "soft",
      })
      expect(tokens["--fog-05"]).toBe(
        `color-mix(in oklab, ${darkBase} 4.0%, transparent)`,
      )
      expect(tokens["--fog-50"]).toBe(
        `color-mix(in oklab, ${darkBase} 38.0%, transparent)`,
      )
    })

    it("inset-hi scales with opacity in light mode", () => {
      const subtle = generateTokens(buildCommon(), {
        opacity: "subtle",
        blur: "medium",
        halo: "soft",
      })
      const strong = generateTokens(buildCommon(), {
        opacity: "strong",
        blur: "medium",
        halo: "soft",
      })
      expect(subtle["--inset-hi"]).toBe(
        "inset 0 1px 0 rgba(255, 255, 255, 0.75), inset 1px 0 0 rgba(255, 255, 255, 0.45)",
      )
      expect(strong["--inset-hi"]).toBe(
        "inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 1px 0 0 rgba(255, 255, 255, 0.24)",
      )
    })

    it("dark + gradient bg → --border becomes translucent white", () => {
      const tokens = generateTokens(
        buildCommon({ mode: "dark", backgroundStyle: "gradient" }),
        { opacity: "medium", blur: "medium", halo: "soft" },
      )
      expect(tokens["--border"]).toBe("0 0% 100% / 0.1")
    })

    it("dark + solid bg → --border NOT set (common-axis default applies)", () => {
      const tokens = generateTokens(
        buildCommon({ mode: "dark", backgroundStyle: "solid" }),
        { opacity: "medium", blur: "medium", halo: "soft" },
      )
      expect(tokens["--border"]).toBeUndefined()
    })

    it("light bg-anything → --border NOT set (common-axis default applies)", () => {
      const solid = generateTokens(
        buildCommon({ mode: "light", backgroundStyle: "solid" }),
        {
          opacity: "medium",
          blur: "medium",
          halo: "soft",
        },
      )
      const gradient = generateTokens(
        buildCommon({ mode: "light", backgroundStyle: "gradient" }),
        {
          opacity: "medium",
          blur: "medium",
          halo: "soft",
        },
      )
      expect(solid["--border"]).toBeUndefined()
      expect(gradient["--border"]).toBeUndefined()
    })

    it("rebinds --accent + --muted + --secondary to primary-tinted CSS expressions (mode-aware)", () => {
      const light = generateTokens(buildCommon(), {
        opacity: "medium",
        blur: "medium",
        halo: "soft",
      })
      expect(light["--accent"]).toBe("var(--primary) / 0.1")
      expect(light["--accent-foreground"]).toBe("var(--primary)")
      expect(light["--muted"]).toBe("var(--primary) / 0.04")
      expect(light["--secondary"]).toBe("var(--primary) / 0.08")
      expect(light["--secondary-foreground"]).toBe("var(--primary)")

      const dark = generateTokens(buildCommon({ mode: "dark" }), {
        opacity: "medium",
        blur: "medium",
        halo: "soft",
      })
      expect(dark["--accent"]).toBe("var(--primary) / 0.14")
      expect(dark["--muted"]).toBe("var(--primary) / 0.06")
      expect(dark["--secondary"]).toBe("var(--primary) / 0.1")
    })

    it("does NOT rebind --muted-foreground (kept as muted gray for text legibility)", () => {
      const tokens = generateTokens(buildCommon(), {
        opacity: "medium",
        blur: "medium",
        halo: "soft",
      })
      expect(tokens["--muted-foreground"]).toBeUndefined()
    })

    describe("halo tier tokens", () => {
      it("emits --glass-halo-raised for halo=soft, light mode, with rim+tight+mid layers", () => {
        const tokens = generateTokens(buildCommon(), {
          opacity: "medium",
          blur: "medium",
          halo: "soft",
        })
        expect(tokens["--glass-halo-raised"]).toBe(
          "0 0 0 1px hsl(var(--primary) / 0.06), 0 4px 12px -2px hsl(var(--primary) / 0.12), 0 12px 32px -8px hsl(var(--primary) / 0.06)",
        )
      })

      it("emits --glass-halo-overlay for halo=soft, light mode", () => {
        const tokens = generateTokens(buildCommon(), {
          opacity: "medium",
          blur: "medium",
          halo: "soft",
        })
        expect(tokens["--glass-halo-overlay"]).toBe(
          "0 0 0 1px hsl(var(--primary) / 0.08), 0 4px 16px -2px hsl(var(--primary) / 0.16), 0 16px 40px -8px hsl(var(--primary) / 0.08)",
        )
      })

      it("emits --glass-halo-modal for halo=soft, light mode", () => {
        const tokens = generateTokens(buildCommon(), {
          opacity: "medium",
          blur: "medium",
          halo: "soft",
        })
        expect(tokens["--glass-halo-modal"]).toBe(
          "0 0 0 1px hsl(var(--primary) / 0.1), 0 8px 24px -2px hsl(var(--primary) / 0.2), 0 24px 60px -8px hsl(var(--primary) / 0.1)",
        )
      })

      it("doubles alphas in dark mode for visibility against dark canvas", () => {
        const tokens = generateTokens(buildCommon({ mode: "dark" }), {
          opacity: "medium",
          blur: "medium",
          halo: "soft",
        })
        expect(tokens["--glass-halo-raised"]).toBe(
          "0 0 0 1px hsl(var(--primary) / 0.1), 0 4px 12px -2px hsl(var(--primary) / 0.2), 0 12px 32px -8px hsl(var(--primary) / 0.1)",
        )
      })

      it("halo=pronounced bumps alphas by ~1.6× over soft", () => {
        const soft = generateTokens(buildCommon(), {
          opacity: "medium",
          blur: "medium",
          halo: "soft",
        })
        const pronounced = generateTokens(buildCommon(), {
          opacity: "medium",
          blur: "medium",
          halo: "pronounced",
        })
        expect(soft["--glass-halo-raised"]).not.toBe(
          pronounced["--glass-halo-raised"],
        )
        expect(pronounced["--glass-halo-raised"]).toContain(
          "hsl(var(--primary) / 0.1)",
        )
        expect(pronounced["--glass-halo-raised"]).toContain(
          "hsl(var(--primary) / 0.2)",
        )
      })

      it("halo=none resolves all tier tokens to no-op shadow", () => {
        const tokens = generateTokens(buildCommon(), {
          opacity: "medium",
          blur: "medium",
          halo: "none",
        })
        expect(tokens["--glass-halo-raised"]).toBe("0 0 transparent")
        expect(tokens["--glass-halo-overlay"]).toBe("0 0 transparent")
        expect(tokens["--glass-halo-modal"]).toBe("0 0 transparent")
      })
    })

    describe("--inset-hi family extension", () => {
      it("--inset-hi includes a left-edge sliver at 60% of the top alpha", () => {
        const tokens = generateTokens(buildCommon(), {
          opacity: "medium",
          blur: "medium",
          halo: "soft",
        })
        // Medium (light) insetAlpha = 0.6 from existing INSET_HI table
        // → top: 0.6, left: 0.36 (60% of top)
        expect(tokens["--inset-hi"]).toBe(
          "inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 1px 0 0 rgba(255, 255, 255, 0.36)",
        )
      })

      it("--inset-hi-strong scales both edges proportionally", () => {
        const tokens = generateTokens(buildCommon(), {
          opacity: "medium",
          blur: "medium",
          halo: "soft",
        })
        expect(tokens["--inset-hi-strong"]).toBe(
          "inset 0 1px 0 rgba(255, 255, 255, 0.75), inset 1px 0 0 rgba(255, 255, 255, 0.45)",
        )
      })

      it("--inset-hi-button scales top by 1.1× and left by 60% of that", () => {
        const tokens = generateTokens(buildCommon(), {
          opacity: "medium",
          blur: "medium",
          halo: "soft",
        })
        // Medium (light) insetAlpha = 0.6
        // → top: 0.6 × 1.1 = 0.66, left: 0.66 × 0.6 = 0.396 → "0.40"
        expect(tokens["--inset-hi-button"]).toBe(
          "inset 0 1px 0 rgba(255, 255, 255, 0.66), inset 1px 0 0 rgba(255, 255, 255, 0.40)",
        )
      })
    })
  })

  describe("surfaceRecipe", () => {
    it("matches today's surfaceStyles.glass for dark borders", () => {
      expect(glass.surfaceRecipe.borderSubtle(slate, "dark")).toBe(slate[600])
      expect(glass.surfaceRecipe.borderDefault(slate, "dark")).toBe(slate[500])
    })

    it("matches today's surfaceStyles.glass for light borders", () => {
      expect(glass.surfaceRecipe.borderSubtle(slate, "light")).toBe(slate[100])
      expect(glass.surfaceRecipe.borderDefault(slate, "light")).toBe(slate[200])
    })
  })

  describe("halo axis", () => {
    it("declares 3 values and defaults to soft", () => {
      expect(glass.axes.halo.values).toEqual(["none", "soft", "pronounced"])
      expect(glass.axes.halo.default).toBe("soft")
      expect(glass.axes.halo.label).toBe("Halo")
      expect(glass.axes.halo.order).toBe(3)
    })
  })
})
