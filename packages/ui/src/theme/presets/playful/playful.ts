// packages/ui/src/theme/presets/playful/playful.ts
import type { ThemePreset, CommonAxisInput } from "../types"

type PlayfulAxes = {
  pop: readonly ["subtle", "lively", "exuberant"]
}

/**
 * Playful preset: bright, friendly, bouncy. Generous radius, soft
 * primary-tinted drop shadows (the "cloud" look). Works in both modes.
 *
 * Hides elevation + buttonElevation common axes because the `pop`
 * preset axis takes their place with a primary-tinted shadow recipe
 * that's conceptually different from the engine's neutral drop-
 * shadow ramp.
 */
export const playful: ThemePreset<PlayfulAxes> = {
  name: "playful",
  label: "Playful",
  description:
    "Bright and friendly. Soft primary-tinted shadows, generous radius, bouncy affordances.",

  axes: {
    pop: {
      values: ["subtle", "lively", "exuberant"],
      default: "lively",
      label: "Pop",
      order: 1,
    },
  },

  // Hides Elevation + ButtonElevation because the `pop` axis takes their
  // place with primary-tinted shadow recipes. Also hides Radius because
  // generateTokens forces --radius/--radius-button to 1rem unconditionally,
  // so the Radius picker would have zero effect under Playful.
  hiddenCommonAxes: ["elevation", "buttonElevation", "radius"],

  surfaceRecipe: {
    surfaceRaised: (s, m) => (m === "light" ? "0 0% 100%" : s[900]),
    surfaceOverlay: (s, m) => (m === "light" ? "0 0% 100%" : s[800]),
    surfaceSunken: (s, m) => (m === "light" ? s[50] : s[950]),
    surfaceSidebar: (s, m) => (m === "light" ? s[50] : s[950]),
    surfaceHeader: (s, m) => (m === "light" ? "0 0% 100%" : s[900]),
    borderSubtle: (s, m) => (m === "light" ? s[100] : s[700]),
    borderDefault: (s, m) => (m === "light" ? s[200] : s[600]),
    overrides: {
      shadowCard: "0 4px 12px -2px rgb(0 0 0 / 0.12)",
      shadowDropdown: "0 8px 24px -4px rgb(0 0 0 / 0.18)",
    },
  },

  generateTokens(common: CommonAxisInput) {
    // Mode-aware alpha treatment (same pattern as Glass). Light-mode
    // surfaces are mostly white, so a low alpha reads cleanly as a
    // primary tint; dark-mode surfaces are near-black and need a touch
    // more alpha to register visibly. Single-value alphas would either
    // look washed-out in dark or too saturated in light.
    //
    // Playful runs slightly bolder than Glass at every tier so the
    // aesthetic reads as energetic rather than restrained.
    const accentAlpha = common.mode === "light" ? 0.14 : 0.2
    const mutedAlpha = common.mode === "light" ? 0.06 : 0.08
    const secondaryAlpha = common.mode === "light" ? 0.11 : 0.16

    return {
      // Generous radius — the rounded "bubble" feel is core to Playful.
      // Overrides the [data-radius="..."] CSS selectors via inline
      // style precedence. BOTH --radius (Tailwind's rounded-*) AND
      // --radius-button (read directly by Buttons) are forced so
      // Buttons + ButtonGroup outer corners match Playful's bubble
      // aesthetic.
      "--radius": "1rem",
      "--radius-button": "1rem",
      "--accent": `var(--primary) / ${accentAlpha}`,
      "--accent-foreground": "var(--primary)",
      "--muted": `var(--primary) / ${mutedAlpha}`,
      "--secondary": `var(--primary) / ${secondaryAlpha}`,
      "--secondary-foreground": "var(--primary)",
    }
  },

  // Only what generateTokens actually writes. CSS-set tokens
  // (--card-elevation-*, --shadow-*, --affordance-glow*,
  // --surface-overlay-shadow) self-clean via the CSS cascade when
  // [data-preset="playful"] stops matching, so listing them here is
  // misleading. Per the type docstring: "Keys that generateTokens
  // may write."
  ownedTokenKeys: [
    "--radius",
    "--radius-button",
    "--accent",
    "--accent-foreground",
    "--muted",
    "--secondary",
    "--secondary-foreground",
  ] as const,
}
