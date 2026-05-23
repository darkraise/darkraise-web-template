// packages/ui/src/theme/presets/scifi/scifi.ts
import type { ThemePreset } from "../types"

type ScifiAxes = {
  intensity: readonly ["dim", "normal", "bright"]
  frame: readonly ["clean", "notched", "bracketed"]
}

/**
 * Sci-fi HUD preset: angular, glowing, data-readout aesthetic. Near-
 * black surfaces with primary-color glow on edges and text; optional
 * clip-path corner notches or corner-bracket frames. Tech monospace
 * for numerics and labels. Dark mode only — the look depends on lit
 * elements over a deep background.
 *
 * Hides elevation + buttonElevation (intensity takes their place
 * with multi-layer glow recipes) and radius (frame axis chooses
 * between sharp/notched/bracketed).
 */
export const scifi: ThemePreset<ScifiAxes> = {
  name: "scifi",
  label: "Sci-fi",
  description:
    "Angular HUD aesthetic. Glowing edges, clipped corners, data-readout typography. Dark only.",

  axes: {
    intensity: {
      values: ["dim", "normal", "bright"],
      default: "normal",
      label: "Intensity",
      order: 1,
    },
    frame: {
      values: ["clean", "notched", "bracketed"],
      default: "notched",
      label: "Frame",
      order: 2,
    },
  },

  supportedModes: ["dark"],
  hiddenCommonAxes: ["elevation", "buttonElevation", "radius"],

  surfaceRecipe: {
    // Near-black with a hint of blue-grey, so surfaces feel like cool
    // matte plastic rather than pure void. Sharp 1px borders carry
    // the structural weight; glow comes from the per-component CSS.
    surfaceRaised: (_s, m) => (m === "light" ? "0 0% 100%" : "215 28% 7%"),
    surfaceOverlay: (_s, m) => (m === "light" ? "0 0% 100%" : "215 28% 9%"),
    surfaceSunken: (_s, m) => (m === "light" ? "0 0% 96%" : "215 32% 5%"),
    surfaceSidebar: (_s, m) => (m === "light" ? "0 0% 98%" : "215 32% 5%"),
    surfaceHeader: (_s, m) => (m === "light" ? "0 0% 100%" : "215 28% 7%"),
    borderSubtle: (_s, m) => (m === "light" ? "0 0% 88%" : "215 25% 18%"),
    borderDefault: (_s, m) => (m === "light" ? "0 0% 75%" : "215 25% 28%"),
    overrides: {
      shadowCard: "none",
      shadowDropdown: "none",
    },
  },

  generateTokens() {
    return {
      // Primary-tinted hover/selected states (same pattern as Neon).
      "--accent": "var(--primary) / 0.14",
      "--accent-foreground": "var(--primary)",
      "--muted": "var(--primary) / 0.05",
      "--secondary": "var(--primary) / 0.1",
      "--secondary-foreground": "var(--primary)",
      // Sharp corners forced — frame axis handles shape via clip-path
      // pseudo-elements instead of border-radius.
      "--radius": "0px",
      "--radius-button": "0px",
      // Tech-y monospace stack for the data-readout feel.
      "--font-sans":
        "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace",
    }
  },

  // Only what generateTokens writes. The HUD glow tokens
  // (--scifi-glow-*, --card-elevation-*, --shadow-*,
  // --surface-overlay-*, --affordance-glow*) are set by scifi.css
  // attribute selectors and self-clean via the cascade.
  ownedTokenKeys: [
    "--accent",
    "--accent-foreground",
    "--muted",
    "--secondary",
    "--secondary-foreground",
    "--radius",
    "--radius-button",
    "--font-sans",
  ] as const,
}
