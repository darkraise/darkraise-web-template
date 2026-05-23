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

  generateTokens(_common, axes) {
    // Per-offset shadow recipe. We have to write --shadow-card and
    // --shadow-dropdown HERE (inline style) rather than via CSS
    // attribute selectors because surfaceRecipe.overrides above
    // declares them too — the engine writes those overrides as
    // inline style, which beats any CSS rule regardless of
    // specificity. To get the hard-offset shadow to actually win we
    // also have to write inline, which we do via generateTokens.
    //
    // The OTHER shadow tokens Brutalist sets (--card-elevation-*,
    // --shadow-button, --surface-overlay-shadow, --affordance-glow*)
    // can stay in brutalist.css because nothing in surfaceRecipe.
    // overrides touches them — CSS wins for those by default.
    //
    // Hover/selected tinting is intentionally NOT rebound here —
    // brutalism is high-contrast monochrome, not preset-tinted. The
    // bold border + inverted-color treatments at the component level
    // signal active state on their own.
    const offsetPx = {
      subtle: { card: 2, dropdown: 3 },
      normal: { card: 4, dropdown: 6 },
      extreme: { card: 8, dropdown: 10 },
    } as const
    const o = offsetPx[axes.offset]
    const stroke = (n: number) => `${n}px ${n}px 0 0 hsl(var(--foreground))`
    return {
      "--shadow-card": stroke(o.card),
      "--shadow-dropdown": stroke(o.dropdown),
    }
  },

  // Only what generateTokens actually writes. The remaining shadow
  // tokens Brutalist binds via brutalist.css (--card-elevation-*,
  // --shadow-button, --surface-overlay-shadow, --affordance-glow*)
  // are CSS-only and self-clean via the cascade.
  ownedTokenKeys: ["--shadow-card", "--shadow-dropdown"] as const,
}
