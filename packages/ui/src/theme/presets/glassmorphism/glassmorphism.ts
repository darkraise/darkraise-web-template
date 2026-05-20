// packages/ui/src/theme/presets/glassmorphism/glassmorphism.ts
import type { ThemePreset, CommonAxisInput } from "../types"

type GlassAxes = {
  opacity: readonly ["subtle", "medium", "strong"]
  blur: readonly ["none", "low", "medium", "high"]
}

// Axis semantics: "subtle" means a SUBTLE GLASS EFFECT (less glassy, surface
// is more solid). "strong" means a STRONG GLASS EFFECT (very glassy, surface
// is more transparent). Subtle/medium/strong = effect intensity, not opacity
// value.
//
// Light-mode glass = white-tinted card overlaying a colored canvas. Higher
// alphas = more white tint = less of the canvas shows through = subtler effect.
// Dark-mode glass = barely-tinted dark surface letting the canvas through.
// Higher alphas in dark = MORE white frost = the subtler "frosted" look.
//
// Medium values match today's behaviour byte-for-byte so the default settings
// produce zero visual change after Phase 3.
const FOG_ALPHA = {
  subtle: {
    light: [0.7, 0.8, 0.85, 0.9, 0.94, 0.98],
    dark: [0.07, 0.12, 0.17, 0.24, 0.32, 0.5],
  },
  medium: {
    light: [0.55, 0.65, 0.72, 0.82, 0.9, 0.96],
    dark: [0.04, 0.07, 0.1, 0.14, 0.2, 0.38],
  },
  strong: {
    light: [0.3, 0.4, 0.48, 0.58, 0.7, 0.82],
    dark: [0.02, 0.04, 0.06, 0.09, 0.13, 0.24],
  },
} as const

// Inset highlight ("liquid glass" top edge). Sharper edge = subtler glass.
const INSET_HI = {
  subtle: { light: 0.75, dark: 0.18 },
  medium: { light: 0.6, dark: 0.14 },
  strong: { light: 0.4, dark: 0.08 },
} as const

export const glassmorphism: ThemePreset<GlassAxes> = {
  name: "glassmorphism",
  label: "Glassmorphism",
  description:
    "Frosted glass: backdrop-blur with semi-transparent surfaces and subtle highlight insets.",

  axes: {
    opacity: {
      values: ["subtle", "medium", "strong"],
      default: "medium",
      label: "Opacity",
      order: 1,
    },
    blur: {
      values: ["none", "low", "medium", "high"],
      default: "medium",
      label: "Backdrop Blur",
      order: 2,
    },
  },

  surfaceRecipe: {
    surfaceRaised: (s, m) => (m === "light" ? "0 0% 100%" : s[900]),
    surfaceOverlay: (s, m) => (m === "light" ? "0 0% 100%" : s[800]),
    surfaceSunken: (s, m) => (m === "light" ? s[100] : s[950]),
    surfaceSidebar: (s, m) => (m === "light" ? s[50] : s[950]),
    surfaceHeader: (s, m) => (m === "light" ? "0 0% 100%" : s[900]),
    borderSubtle: (s, m) => (m === "light" ? s[100] : s[600]),
    borderDefault: (s, m) => (m === "light" ? s[200] : s[500]),
    overrides: {
      shadowCard: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
      shadowDropdown:
        "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    },
  },

  generateTokens(common: CommonAxisInput, axes) {
    const alphas = FOG_ALPHA[axes.opacity][common.mode]
    const insetAlpha = INSET_HI[axes.opacity][common.mode]
    const tokens: Record<string, string> = {
      "--fog-05": `rgba(255, 255, 255, ${alphas[0]})`,
      "--fog-10": `rgba(255, 255, 255, ${alphas[1]})`,
      "--fog-15": `rgba(255, 255, 255, ${alphas[2]})`,
      "--fog-20": `rgba(255, 255, 255, ${alphas[3]})`,
      "--fog-30": `rgba(255, 255, 255, ${alphas[4]})`,
      "--fog-50": `rgba(255, 255, 255, ${alphas[5]})`,
      "--inset-hi": `inset 0 1px 0 rgba(255, 255, 255, ${insetAlpha})`,
      "--inset-hi-strong": `inset 0 1px 0 rgba(255, 255, 255, ${(insetAlpha * 1.25).toFixed(2)})`,
      "--inset-hi-button": `inset 0 1px 0 rgba(255, 255, 255, ${(insetAlpha * 1.1).toFixed(2)})`,
    }

    // Dark-glass + gradient bg: translucent white border instead of a tinted
    // surface border. Today's behaviour, preserved here because the recipe
    // override signature (scale, mode) can't see backgroundStyle.
    if (common.mode === "dark" && common.backgroundStyle === "gradient") {
      tokens["--border"] = "0 0% 100% / 0.1"
    }

    return tokens
  },

  ownedTokenKeys: [
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
  ] as const,
}
