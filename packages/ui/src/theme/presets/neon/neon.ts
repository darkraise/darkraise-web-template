// packages/ui/src/theme/presets/neon/neon.ts
import type { ThemePreset } from "../types"

/**
 * Neon: bright primary-color glow on dark surfaces. No preset-specific
 * axes — the common `elevation` and `buttonElevation` axes are
 * reinterpreted as glow radius in neon.css. Dark mode only; the
 * ThemeProvider enforces `supportedModes: ["dark"]` (picking Neon in
 * light mode auto-switches to dark; switching to light while on Neon
 * auto-resets the preset to default).
 *
 * No generateTokens: glow color is expressed in CSS as
 * `hsl(var(--primary) / N)`, which is dynamic at the cascade level —
 * the accent picker updates the glow without any JS recomputation.
 * Shadow tokens (--elevation-*, --card-elevation-*, --shadow-button,
 * --shadow-card, --shadow-dropdown) are rebound by neon.css attribute
 * selectors; they're listed in ownedTokenKeys so the provider's
 * clean-up logic doesn't need to remove style.cssText values (CSS
 * cascade handles it via specificity when leaving the preset).
 */
export const neon: ThemePreset<Record<string, never>> = {
  name: "neon",
  label: "Neon",
  description:
    "Bright primary-color glow on dark surfaces. Elevation drives glow radius. Dark mode only.",

  axes: {},
  supportedModes: ["dark"],

  surfaceRecipe: {
    // Dark, slightly lifted surfaces. Primary-colored glow does the
    // heavy lifting visually; surfaces stay near-black so the glow
    // pops. The light branch falls back to default-like values so the
    // recipe is type-safe — it's unreachable in normal use because
    // supportedModes blocks light mode.
    surfaceRaised: (s, m) => (m === "light" ? "0 0% 100%" : s[950]),
    surfaceOverlay: (s, m) => (m === "light" ? "0 0% 100%" : s[900]),
    surfaceSunken: (s, m) => (m === "light" ? s[100] : "0 0% 4%"),
    surfaceSidebar: (s, m) => (m === "light" ? s[50] : "0 0% 4%"),
    surfaceHeader: (s, m) => (m === "light" ? "0 0% 100%" : s[950]),
    borderSubtle: (s, m) => (m === "light" ? s[100] : s[800]),
    borderDefault: (s, m) => (m === "light" ? s[200] : s[700]),
    overrides: {
      // Drop-shadow tokens become inert under Neon. Depth comes from
      // the elevation glow tokens (rebound in neon.css), not from
      // shadowCard/shadowDropdown.
      shadowCard: "none",
      shadowDropdown: "none",
    },
  },

  ownedTokenKeys: [
    "--elevation-flat",
    "--elevation-low",
    "--elevation-medium",
    "--elevation-high",
    "--elevation-current",
    "--card-elevation-low",
    "--card-elevation-medium",
    "--card-elevation-high",
    "--shadow-button",
    "--shadow-card",
    "--shadow-dropdown",
  ] as const,
}
