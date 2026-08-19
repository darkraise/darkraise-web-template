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
  hiddenCommonAxes: ["elevation", "buttonElevation", "radius", "density"],

  surfaceRecipe: {
    surfaceRaised: (_s, m) => (m === "light" ? "0 0% 100%" : "0 0% 6%"),
    surfaceOverlay: (_s, m) => (m === "light" ? "0 0% 100%" : "0 0% 8%"),
    surfaceSunken: (_s, m) => (m === "light" ? "0 0% 95%" : "0 0% 3%"),
    surfaceSidebar: (_s, m) => (m === "light" ? "0 0% 95%" : "0 0% 3%"),
    surfaceHeader: (_s, m) => (m === "light" ? "0 0% 100%" : "0 0% 6%"),
    borderSubtle: (_s, m) => (m === "light" ? "0 0% 80%" : "0 0% 15%"),
    borderDefault: (_s, m) => (m === "light" ? "0 0% 0%" : "0 0% 25%"),
    borderStrong: (_s, m) => (m === "light" ? "0 0% 0%" : "0 0% 45%"),
    overrides: {
      shadowCard: "none",
      shadowDropdown: "none",
    },
  },

  generateTokens(common) {
    return {
      // Terminal's light rail is 0 0% 95% — several steps darker than the
      // s[50] rail every other preset uses — so the engine's slate-500 muted
      // lands at 4.22:1 there, just under AA for the 12px uppercase group
      // labels. A grayscale muted at 40% lightness reads 5.14:1 on that rail
      // and suits the monochrome CRT palette better than a slate tint.
      ...(common.mode === "light"
        ? { "--sidebar-foreground-muted": "0 0% 40%" }
        : {}),
      // Hover/selected states tinted with primary at low alpha.
      "--accent": "var(--primary) / 0.12",
      "--accent-foreground": "var(--primary)",
      "--muted": "var(--primary) / 0.04",
      "--secondary": "var(--primary) / 0.08",
      "--secondary-foreground": "var(--primary)",
      // Sharp corners — overrides the [data-radius="..."] CSS selectors
      // via inline style precedence. BOTH --radius (used by Tailwind's
      // rounded-* utilities) AND --radius-button (read directly by
      // .dr-btn via `rounded-[var(--radius-button)]`) must be forced
      // to 0; otherwise Buttons (and Buttons inside ButtonGroup) keep
      // whatever non-zero value the data-radius axis last left behind.
      "--radius": "0px",
      "--radius-button": "0px",
      // Monospace stack — overrides the engine's default --font-sans
      // so all body text reads as terminal output.
      "--font-sans":
        "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace",
    }
  },

  // Only what generateTokens writes. The phosphor glow tokens
  // (--terminal-text-shadow, --card-elevation-*, --shadow-button,
  // --affordance-glow*, --surface-overlay-*) are set by terminal.css
  // attribute selectors, which self-clean via the cascade. --shadow-
  // card and --shadow-dropdown come from surfaceRecipe.overrides
  // (engine inline-style writes) and are overwritten on switch-away.
  ownedTokenKeys: [
    "--sidebar-foreground-muted",
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
