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

/**
 * Glass only where content passes under chrome: opaque, calm content on a
 * dot canvas, a docked solid rail, a top bar that dissolves what scrolls
 * beneath it, and menus as the one floating glass. The scrim frosts the app
 * rather than the dialog.
 */
export const glass: StyleDefinition = {
  label: "Glass",
  signatures: {
    navSelection: "chip",
    barEdge: "veil",
    menuHighlight: "tint",
    tooltipTone: "inverse",
    bannerMark: "icon",
    fieldFill: "surface",
    tableHead: "plain",
  },
  frosted: true,
  defaults: { backgroundStyle: "gradient", gradientPattern: "dots" },
  // The fog and edge-light tables are no longer painted by Glass itself; a
  // style that extends Glass reads them for its own frosted surfaces.
  vars: {
    shared: {
      "--glass-noise": `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.08 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
    },
  },
  tokens: {
    shared: {
      chromeBarFill: "hsl(var(--surface-header))",
      chromeEdge: "hsl(var(--sidebar-border))",
      cardRadius: "calc(var(--radius) * 1.5)",
      overlayRadius: "calc(var(--radius) * 1.25)",
      dialogRadius: "calc(var(--radius) * 1.75)",
      overlayBorder: "hsl(var(--foreground) / 0.08)",
      dialogFill: "hsl(var(--popover))",
      buttonNeutralFill: "hsl(var(--card))",
      fieldFocusRing: "0 0 0 3px hsl(var(--primary) / 0.15)",
      scrim: "hsl(var(--foreground) / 0.3)",
    },
    // The docked rail is solid on the grounds every selection look clears at
    // 1.2:1: the page in light, the card tone in dark.
    light: {
      chromeRailFill: "hsl(var(--background))",
      cardBorder: "hsl(var(--border))",
      cardEdge: "0 1px 2px rgb(0 0 0 / 0.04)",
      dialogBorder: "hsl(var(--border))",
      dropdownShadow: "0 10px 30px -10px rgb(0 0 0 / 0.25)",
    },
    dark: {
      chromeRailFill: "hsl(var(--card))",
      dialogBorder: "hsl(var(--foreground) / 0.1)",
      dropdownShadow: "0 10px 30px -10px rgb(0 0 0 / 0.6)",
      fieldFocusRing: "0 0 0 3px hsl(var(--primary) / 0.2)",
      scrim: "rgb(0 0 0 / 0.5)",
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
    // The overlay is the popover colour itself, let through by the opacity
    // step, so it stays readable where the blur is unavailable.
    {
      axes: { glassOpacity: "subtle" },
      tokens: { overlayFillBase: "hsl(var(--popover) / 0.88)" },
    },
    {
      axes: { glassOpacity: "medium" },
      tokens: { overlayFillBase: "hsl(var(--popover) / 0.8)" },
    },
    {
      axes: { glassOpacity: "strong" },
      tokens: { overlayFillBase: "hsl(var(--popover) / 0.62)" },
    },
    // `none` rather than blur(0): any filter value creates a containing
    // block for fixed descendants. The scrim blurs the app a fifth as hard
    // as an overlay blurs what it covers.
    {
      axes: { glassBlur: "none" },
      tokens: { overlayBackdrop: "none", scrimBackdrop: "none" },
    },
    {
      axes: { glassBlur: "low" },
      tokens: {
        overlayBackdrop: "blur(10px) saturate(160%)",
        scrimBackdrop: "blur(2px)",
      },
    },
    {
      axes: { glassBlur: "medium" },
      tokens: {
        overlayBackdrop: "blur(20px) saturate(180%)",
        scrimBackdrop: "blur(4px)",
      },
    },
    {
      axes: { glassBlur: "high" },
      tokens: {
        overlayBackdrop: "blur(32px) saturate(180%)",
        scrimBackdrop: "blur(8px)",
      },
    },
  ],
  forcedFallback: {
    tokens: {
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
