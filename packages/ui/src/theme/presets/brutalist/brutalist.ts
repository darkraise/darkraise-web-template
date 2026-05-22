// packages/ui/src/theme/presets/brutalist/brutalist.ts
import type { ThemePreset } from "../types"

type BrutalistAxes = {
  offset: readonly ["subtle", "normal", "extreme"]
}

/**
 * Brutalist preset: raw, high-contrast, print-influenced. Heavy
 * borders (full-saturation foreground), hard offset shadows with no
 * blur (like xerox / print misregistration), no animation. Works in
 * both modes.
 *
 * Hides elevation + buttonElevation common axes because the preset's
 * `offset` axis takes over the depth language with a fundamentally
 * different recipe shape (hard offset vs soft blur).
 */
export const brutalist: ThemePreset<BrutalistAxes> = {
  name: "brutalist",
  label: "Brutalist",
  description:
    "Raw and uncompromising. Heavy borders, hard offset shadows, high contrast.",

  axes: {
    offset: {
      values: ["subtle", "normal", "extreme"],
      default: "normal",
      label: "Shadow Offset",
      order: 1,
    },
  },

  hiddenCommonAxes: ["elevation", "buttonElevation"],

  surfaceRecipe: {
    surfaceRaised: (_s, m) => (m === "light" ? "0 0% 100%" : "0 0% 8%"),
    surfaceOverlay: (_s, m) => (m === "light" ? "0 0% 100%" : "0 0% 12%"),
    surfaceSunken: (_s, m) => (m === "light" ? "0 0% 96%" : "0 0% 4%"),
    surfaceSidebar: (_s, m) => (m === "light" ? "0 0% 98%" : "0 0% 4%"),
    surfaceHeader: (_s, m) => (m === "light" ? "0 0% 100%" : "0 0% 8%"),
    // Borders: full foreground saturation in both modes so they read as
    // intentional structural marks rather than subtle separators.
    borderSubtle: (_s, m) => (m === "light" ? "0 0% 20%" : "0 0% 80%"),
    borderDefault: (_s, m) => (m === "light" ? "0 0% 0%" : "0 0% 100%"),
    overrides: {
      shadowCard: "none",
      shadowDropdown: "none",
    },
  },

  generateTokens() {
    // Hover/selected tinting kept restrained — brutalism is high-
    // contrast monochrome, not preset-tinted. Inherits Default's
    // surface-tier behavior by NOT returning rebinds for --accent etc.
    return {}
  },

  ownedTokenKeys: [
    "--card-elevation-low",
    "--card-elevation-medium",
    "--card-elevation-high",
    "--shadow-button",
    "--shadow-card",
    "--shadow-dropdown",
    "--surface-overlay-shadow",
  ] as const,
}
