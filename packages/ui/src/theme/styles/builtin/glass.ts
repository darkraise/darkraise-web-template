import type { StyleDefinition, VarMap, WhenEntry } from "../../config/schema"
import type { GlassOpacity } from "../../types"

const LIGHT_TINT = "color-mix(in oklab, hsl(var(--primary-8)) 24%, white)"
const DARK_TINT =
  "color-mix(in oklab, hsl(var(--primary-8)) 40%, hsl(var(--neutral-1)))"

/** `--glass-fog-1` … `--glass-fog-6`: the tint at each alpha, in percent. */
function fogs(tint: string, alphas: readonly number[]): VarMap {
  return Object.fromEntries(
    alphas.map((alpha, i) => [
      `--glass-fog-${i + 1}`,
      `color-mix(in oklab, ${tint} ${alpha}%, transparent)`,
    ]),
  )
}

function specular(top: string, side: string): string {
  return `inset 0 1px 0 rgba(255, 255, 255, ${top}), inset 1px 0 0 rgba(255, 255, 255, ${side})`
}

/** The fog and edge-light tables for one mode at one opacity step. */
function opacityStep(
  mode: "light" | "dark",
  glassOpacity: GlassOpacity,
  alphas: readonly number[],
  [top, side, strongTop, strongSide]: readonly [string, string, string, string],
): WhenEntry {
  return {
    axes: { glassOpacity },
    mode,
    vars: {
      ...fogs(mode === "light" ? LIGHT_TINT : DARK_TINT, alphas),
      "--glass-inset": specular(top, side),
      "--glass-inset-strong": specular(strongTop, strongSide),
    },
  }
}

/** Glass frosts shell chrome and overlays; content keeps Quiet's recipe. */
export const glass: StyleDefinition = {
  label: "Glass",
  frosted: true,
  defaults: { backgroundStyle: "gradient" },
  vars: {
    shared: {
      "--glass-noise": `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.08 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
    },
  },
  tokens: {
    shared: {
      dropdownShadow:
        "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      chromeRailFill:
        "linear-gradient(135deg, var(--glass-fog-5), var(--glass-fog-3))",
      chromeBarFill:
        "linear-gradient(180deg, var(--glass-fog-5), var(--glass-fog-3))",
      chromeEdge: "var(--glass-fog-4)",
      chromeShadow: "var(--glass-inset)",
      overlayFillBlend: "overlay, normal",
      overlayBorder: "var(--glass-fog-4)",
    },
    // Light overlays drop one fog tier: at the dark tiers' alphas a light
    // overlay read as opaque white and hid the blur behind it. At rest
    // nothing scrolls under the chrome, so the light chrome fog has to let
    // its own canvas through to read as glass.
    light: {
      dropdownShadow:
        "0 10px 15px -3px rgb(16 24 40 / 0.1), 0 4px 6px -4px rgb(16 24 40 / 0.1)",
      overlayFillLayers:
        "var(--glass-noise), linear-gradient(135deg, var(--glass-fog-3), var(--glass-fog-1))",
      overlayShadow:
        "var(--elevation-medium), var(--glass-inset-strong), inset 0 0 32px color-mix(in oklab, hsl(var(--surface-tint)) 2%, transparent), var(--glow-outer), var(--glow-inner)",
      chromeRailFill:
        "linear-gradient(135deg, var(--glass-fog-3), var(--glass-fog-1))",
      chromeBarFill:
        "linear-gradient(180deg, var(--glass-fog-3), var(--glass-fog-1))",
    },
    dark: {
      overlayFillLayers:
        "var(--glass-noise), linear-gradient(135deg, var(--glass-fog-4), var(--glass-fog-2))",
      overlayShadow:
        "var(--elevation-medium), var(--glass-inset-strong), inset 0 0 40px color-mix(in oklab, hsl(var(--surface-tint)) 28%, transparent), var(--glow-outer), var(--glow-inner)",
    },
  },
  when: [
    opacityStep(
      "light",
      "subtle",
      [70, 80, 85, 90, 94, 98],
      ["0.75", "0.45", "0.94", "0.56"],
    ),
    opacityStep(
      "light",
      "medium",
      [55, 65, 72, 82, 90, 96],
      ["0.6", "0.36", "0.75", "0.45"],
    ),
    opacityStep(
      "light",
      "strong",
      [30, 40, 48, 58, 70, 82],
      ["0.4", "0.24", "0.5", "0.3"],
    ),
    opacityStep(
      "dark",
      "subtle",
      [7, 12, 17, 24, 32, 50],
      ["0.18", "0.11", "0.22", "0.13"],
    ),
    opacityStep(
      "dark",
      "medium",
      [4, 7, 10, 14, 20, 38],
      ["0.14", "0.08", "0.18", "0.11"],
    ),
    opacityStep(
      "dark",
      "strong",
      [2, 4, 6, 9, 13, 24],
      ["0.08", "0.05", "0.1", "0.06"],
    ),
    // The overlay keeps a popover-coloured base under its fog, so it stays
    // readable where the blur is unavailable.
    {
      axes: { glassOpacity: "subtle" },
      tokens: { overlayFillBase: "hsl(var(--popover) / 0.88)" },
    },
    {
      axes: { glassOpacity: "medium" },
      tokens: { overlayFillBase: "hsl(var(--popover) / 0.76)" },
    },
    {
      axes: { glassOpacity: "strong" },
      tokens: { overlayFillBase: "hsl(var(--popover) / 0.62)" },
    },
    // `none` rather than blur(0): any filter value creates a containing
    // block for fixed descendants. Chrome blurs half again as hard as
    // overlays.
    {
      axes: { glassBlur: "none" },
      tokens: { overlayBackdrop: "none", chromeBackdrop: "none" },
    },
    {
      axes: { glassBlur: "low" },
      tokens: {
        overlayBackdrop: "blur(6px) saturate(140%)",
        chromeBackdrop: "blur(9px) saturate(140%)",
      },
    },
    {
      axes: { glassBlur: "medium" },
      tokens: {
        overlayBackdrop: "blur(12px) saturate(140%)",
        chromeBackdrop: "blur(18px) saturate(140%)",
      },
    },
    {
      axes: { glassBlur: "high" },
      tokens: {
        overlayBackdrop: "blur(24px) saturate(140%)",
        chromeBackdrop: "blur(36px) saturate(140%)",
      },
    },
    {
      axes: { backgroundStyle: "gradient" },
      tokens: {
        chromeCanvas:
          "var(--canvas-blob-a), var(--canvas-blob-b), var(--canvas-blob-c), var(--canvas-blob-d), var(--canvas-ink)",
      },
    },
    // Pinned to the viewport so the rail and the bar show one field.
    {
      axes: { backgroundStyle: "gradient" },
      mode: "light",
      tokens: {
        chromeCanvas:
          "radial-gradient(520px 380px at 0% 0%, color-mix(in oklab, hsl(var(--primary-8)) 50%, transparent), transparent 70%) fixed, radial-gradient(700px 300px at 60% 0%, color-mix(in oklab, hsl(var(--primary-6)) 40%, transparent), transparent 70%) fixed, radial-gradient(480px 520px at 0% 85%, color-mix(in oklab, hsl(var(--primary-9)) 40%, transparent), transparent 70%) fixed, var(--canvas-ink)",
      },
    },
  ],
  forcedFallback: {
    tokens: {
      chromeRailFill: "hsl(var(--surface-sidebar))",
      chromeBarFill: "hsl(var(--surface-header))",
      chromeEdge: "hsl(var(--sidebar-border))",
      chromeBackdrop: "none",
      chromeCanvas: "none",
      overlayFillLayers: "",
      overlayFillBase: "hsl(var(--popover))",
      overlayFillBlend: "normal",
      overlayBorder: "hsl(var(--border))",
      overlayBackdrop: "none",
    },
  },
}
