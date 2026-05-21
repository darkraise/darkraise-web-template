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
 * Most of Neon is CSS-only: glow color comes from `hsl(var(--primary)
 * / N)` directly so the accent picker updates everything at the CSS-
 * cascade level. The one JS-computed override is the semantic
 * rebinding of `--accent` / `--accent-foreground` (see generateTokens
 * below): in Default/Glass these tokens drive a muted surface tier;
 * under Neon they should drive a *primary-tinted* hover/selected
 * state so every `bg-accent text-accent-foreground` consumer
 * (menu items, combobox items, command items, select items,
 * pagination hovers, tabs hovers, navigation-menu hovers, tree-view
 * selected items, calendar selected days, etc.) reads as Neon-styled
 * automatically without touching their CSS files. This is the same
 * "tokenize the affordance" pattern as --surface-overlay-* and
 * --affordance-glow.
 *
 * Shadow tokens (--elevation-*, --card-elevation-*, --shadow-button,
 * --shadow-card, --shadow-dropdown) are rebound by neon.css attribute
 * selectors; they're listed in ownedTokenKeys for documentation.
 */
export const neon: ThemePreset<Record<string, never>> = {
  name: "neon",
  label: "Neon",
  description:
    "Bright primary-color glow on dark surfaces. Elevation drives glow radius. Dark mode only.",

  axes: {},
  supportedModes: ["dark"],

  // Neon override of the semantic --accent tokens. The values are
  // CSS expressions that reference --primary at use time, so the
  // accent picker (which updates --primary) automatically retunes
  // every consumer of bg-accent / text-accent-foreground. Writing
  // these via generateTokens (inline style) is required to win
  // against the engine's surfaceRecipe-driven --accent defaults
  // which are also written as inline style.
  generateTokens() {
    return {
      "--accent": "var(--primary) / 0.15",
      "--accent-foreground": "var(--primary)",
    }
  },

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
    "--accent",
    "--accent-foreground",
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
