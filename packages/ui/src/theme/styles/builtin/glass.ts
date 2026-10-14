import type { StyleDefinition } from "../../config/schema"
import { TRANSPARENCY_SCALE } from "../../config/transparency"
import { GLASS_TRANSPARENCIES } from "../../types"

/**
 * A backdrop the Blur setting sizes: `blur` defaults to the step's
 * `--glass-blur`, `filters` follow it, and the `none` step's
 * `--glass-backdrop-off` replaces the whole value with `none`.
 */
export function glassBackdrop(
  filters = "",
  blur = "var(--glass-blur)",
): string {
  return `var(--glass-backdrop-off, blur(${blur})${filters ? ` ${filters}` : ""})`
}

/**
 * Glass over accent-tinted blobs: cards, menus, popovers and dialogs let a
 * blurred view of what lies behind them through, as far as the Transparency
 * and Blur settings say, and turn opaque under more contrast. The rail is
 * docked and solid, the top bar dissolves what scrolls beneath it, and the
 * scrim frosts the app behind a dialog.
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
  defaults: { backgroundStyle: "gradient", gradientPattern: "blobs" },
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
      dialogFill: "hsl(var(--popover) / var(--overlay-alpha))",
      overlayFillBase: "hsl(var(--popover) / var(--overlay-alpha))",
      overlayFillAlpha: "0.6",
      buttonNeutralFill: "hsl(var(--card))",
      fieldFocusRing: "0 0 0 3px hsl(var(--primary) / 0.15)",
      scrim: "hsl(var(--foreground) / 0.3)",
      surfaceBackdrop: glassBackdrop("saturate(180%)"),
      overlayBackdrop: glassBackdrop("saturate(180%)"),
      scrimBackdrop: glassBackdrop("", "var(--glass-scrim-blur)"),
    },
    // The docked rail is solid on the grounds every selection look clears at
    // 1.2:1: the page in light, the card tone in dark.
    light: {
      chromeRailFill: "hsl(var(--background))",
      surfaceFillAlpha: "0.55",
      cardBorder: "rgb(255 255 255 / 0.7)",
      cardEdge:
        "inset 0 1px 0 rgb(255 255 255 / 0.6), 0 1px 2px rgb(0 0 0 / 0.04)",
      overlayBorder: "rgb(255 255 255 / 0.7)",
      dialogBorder: "rgb(255 255 255 / 0.7)",
      dropdownShadow: "0 10px 30px -10px rgb(0 0 0 / 0.25)",
    },
    dark: {
      chromeRailFill: "hsl(var(--card))",
      surfaceFillAlpha: "0.6",
      cardBorder: "rgb(255 255 255 / 0.14)",
      cardEdge: "inset 0 1px 0 rgb(255 255 255 / 0.08)",
      overlayBorder: "rgb(255 255 255 / 0.14)",
      dialogBorder: "rgb(255 255 255 / 0.14)",
      dropdownShadow: "0 10px 30px -10px rgb(0 0 0 / 0.6)",
      fieldFocusRing: "0 0 0 3px hsl(var(--primary) / 0.2)",
      scrim: "rgb(0 0 0 / 0.5)",
    },
  },
  when: [
    // The Transparency step scales the see-through share of every declared
    // alpha; the kit reads it in --surface-alpha and --overlay-alpha.
    ...GLASS_TRANSPARENCIES.map((step) => ({
      axes: { glassTransparency: step },
      vars: {
        "--glass-transparency-scale": String(TRANSPARENCY_SCALE[step]),
      },
    })),
    // The blur steps write sizes, not backdrops, so a preset keeps its own
    // filters. `none` switches every glass backdrop to the keyword `none`
    // rather than blur(0): any filter value creates a containing block for
    // fixed descendants. The scrim blurs the app a quarter as hard as an
    // overlay blurs what it covers.
    { axes: { glassBlur: "none" }, vars: { "--glass-backdrop-off": "none" } },
    {
      axes: { glassBlur: "low" },
      vars: { "--glass-blur": "4px", "--glass-scrim-blur": "1px" },
    },
    {
      axes: { glassBlur: "medium" },
      vars: { "--glass-blur": "8px", "--glass-scrim-blur": "2px" },
    },
    {
      axes: { glassBlur: "high" },
      vars: { "--glass-blur": "32px", "--glass-scrim-blur": "8px" },
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
      cardBorder: "hsl(var(--border-subtle))",
      cardEdge: "0 0 transparent",
      dialogBorder: "hsl(var(--border))",
    },
  },
}
