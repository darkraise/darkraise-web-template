// packages/ui/src/theme/presets/playful/playful.ts
import type { ThemePreset } from "../types"

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

  hiddenCommonAxes: ["elevation", "buttonElevation"],

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

  generateTokens() {
    return {
      // Generous radius — the rounded "bubble" feel is core to Playful.
      // Overrides the [data-radius="..."] CSS selectors via inline
      // style precedence.
      "--radius": "1rem",
      // Hover/selected states get a vibrant primary tint, slightly
      // stronger than Glass and Neon so the playful aesthetic reads
      // as energetic rather than restrained.
      "--accent": "var(--primary) / 0.18",
      "--accent-foreground": "var(--primary)",
      "--muted": "var(--primary) / 0.07",
      "--secondary": "var(--primary) / 0.14",
      "--secondary-foreground": "var(--primary)",
    }
  },

  ownedTokenKeys: [
    "--radius",
    "--accent",
    "--accent-foreground",
    "--muted",
    "--secondary",
    "--secondary-foreground",
    "--card-elevation-low",
    "--card-elevation-medium",
    "--card-elevation-high",
    "--shadow-button",
    "--shadow-card",
    "--shadow-dropdown",
    "--affordance-glow",
    "--affordance-glow-bottom",
    "--surface-overlay-shadow",
  ] as const,
}
