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
type NeonAxes = {
  glow: readonly ["dim", "normal", "bright", "intense"]
}

export const neon: ThemePreset<NeonAxes> = {
  name: "neon",
  label: "Neon",
  description:
    "Bright primary-color glow on dark surfaces. Glow axis controls bloom intensity. Dark mode only.",

  axes: {
    glow: {
      values: ["dim", "normal", "bright", "intense"],
      default: "normal",
      label: "Glow",
      order: 1,
    },
  },
  supportedModes: ["dark"],
  hiddenCommonAxes: ["elevation", "buttonElevation"],

  // Neon override of the semantic surface-tier tokens. Each value is
  // a CSS expression that references --primary at use time, so the
  // accent picker (which updates --primary) automatically retunes
  // every consumer simultaneously. Writing via generateTokens (inline
  // style) is required to win against the engine's surfaceRecipe
  // defaults, which are also inline-style writes.
  //
  // Token semantics under Neon (vs Default/Glass):
  //   --accent           hover/focus/selected surface — primary 15%
  //   --accent-foreground text/icon for same — saturated primary
  //   --muted            passive low-emphasis surface — primary 6%
  //   --secondary        secondary interactive surface — primary 12%
  //   --secondary-fg     text on secondary — saturated primary
  // --muted-foreground stays at its engine default (a muted gray)
  // so `text-muted-foreground` keeps its "subdued text" semantic; if
  // it became primary too, muted helper text would read louder than
  // the body copy it's supposed to recede behind.
  generateTokens() {
    return {
      "--accent": "var(--primary) / 0.15",
      "--accent-foreground": "var(--primary)",
      "--muted": "var(--primary) / 0.06",
      "--secondary": "var(--primary) / 0.12",
      "--secondary-foreground": "var(--primary)",
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

  // Only what generateTokens writes. Every glow-bearing token Neon
  // owns (--elevation-*, --card-elevation-*, --shadow-button,
  // --affordance-glow*, --neon-text-shadow, --surface-overlay-*) is
  // set by neon.css attribute selectors, which self-clean via the
  // cascade. --shadow-card and --shadow-dropdown come from
  // surfaceRecipe.overrides (engine inline-style writes) and the
  // engine overwrites them with the next preset's recipe values on
  // switch-away — no manual cleanup needed.
  ownedTokenKeys: [
    "--accent",
    "--accent-foreground",
    "--muted",
    "--secondary",
    "--secondary-foreground",
  ] as const,
}
