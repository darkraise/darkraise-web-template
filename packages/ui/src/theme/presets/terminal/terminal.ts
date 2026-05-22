// packages/ui/src/theme/presets/terminal/terminal.ts
import type { ThemePreset } from "../types"

type TerminalAxes = {
  phosphor: readonly ["off", "dim", "bright"]
  scanlines: readonly ["off", "subtle", "visible"]
}

/**
 * Terminal preset: retro CRT aesthetic. Near-black surfaces, sharp
 * corners forced via --radius override, monospace font, optional
 * phosphor text glow + scanline overlay. Dark mode only — the look
 * doesn't read on light surfaces.
 *
 * Hides common axes that conflict with the aesthetic: elevation +
 * buttonElevation (drop shadows don't fit a CRT) and radius (forced
 * sharp). The `phosphor` and `scanlines` preset axes take their place
 * conceptually.
 */
export const terminal: ThemePreset<TerminalAxes> = {
  name: "terminal",
  label: "Terminal",
  description:
    "Retro CRT aesthetic. Monospace, sharp corners, phosphor glow. Dark mode only.",

  axes: {
    phosphor: {
      values: ["off", "dim", "bright"],
      default: "dim",
      label: "Phosphor",
      order: 1,
    },
    scanlines: {
      values: ["off", "subtle", "visible"],
      default: "off",
      label: "Scanlines",
      order: 2,
    },
  },

  supportedModes: ["dark"],
  hiddenCommonAxes: ["elevation", "buttonElevation", "radius"],

  surfaceRecipe: {
    surfaceRaised: (_s, m) => (m === "light" ? "0 0% 100%" : "0 0% 6%"),
    surfaceOverlay: (_s, m) => (m === "light" ? "0 0% 100%" : "0 0% 8%"),
    surfaceSunken: (_s, m) => (m === "light" ? "0 0% 95%" : "0 0% 3%"),
    surfaceSidebar: (_s, m) => (m === "light" ? "0 0% 95%" : "0 0% 3%"),
    surfaceHeader: (_s, m) => (m === "light" ? "0 0% 100%" : "0 0% 6%"),
    borderSubtle: (_s, m) => (m === "light" ? "0 0% 80%" : "0 0% 15%"),
    borderDefault: (_s, m) => (m === "light" ? "0 0% 0%" : "0 0% 25%"),
    overrides: {
      shadowCard: "none",
      shadowDropdown: "none",
    },
  },

  generateTokens() {
    return {
      // Hover/selected states tinted with primary at low alpha.
      "--accent": "var(--primary) / 0.12",
      "--accent-foreground": "var(--primary)",
      "--muted": "var(--primary) / 0.04",
      "--secondary": "var(--primary) / 0.08",
      "--secondary-foreground": "var(--primary)",
      // Sharp corners — overrides the [data-radius="..."] CSS selectors
      // via inline style precedence.
      "--radius": "0px",
      // Monospace stack — overrides the engine's default --font-sans
      // so all body text reads as terminal output.
      "--font-sans":
        "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace",
    }
  },

  ownedTokenKeys: [
    "--accent",
    "--accent-foreground",
    "--muted",
    "--secondary",
    "--secondary-foreground",
    "--radius",
    "--font-sans",
    "--terminal-text-shadow",
    "--card-elevation-low",
    "--card-elevation-medium",
    "--card-elevation-high",
    "--shadow-button",
    "--shadow-card",
    "--shadow-dropdown",
    "--affordance-glow",
    "--affordance-glow-bottom",
    "--surface-overlay-shadow",
    "--surface-overlay-bg",
    "--surface-overlay-border",
  ] as const,
}
