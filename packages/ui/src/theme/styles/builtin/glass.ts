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
      surfaceBackdrop: glassBackdrop("saturate(180%)"),
      overlayBackdrop: glassBackdrop("saturate(180%)"),
      scrimBackdrop: glassBackdrop("", "var(--glass-scrim-blur)"),
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
    // The overlay is the popover colour itself, let through by the opacity
    // step, so it stays readable where the blur is unavailable.
    {
      axes: { glassTransparency: "low" },
      tokens: { overlayFillBase: "hsl(var(--popover) / 0.88)" },
    },
    {
      axes: { glassTransparency: "medium" },
      tokens: { overlayFillBase: "hsl(var(--popover) / 0.8)" },
    },
    {
      axes: { glassTransparency: "high" },
      tokens: { overlayFillBase: "hsl(var(--popover) / 0.62)" },
    },
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
    // fixed descendants. The scrim blurs the app a fifth as hard as an
    // overlay blurs what it covers, or a quarter at the highest step.
    { axes: { glassBlur: "none" }, vars: { "--glass-backdrop-off": "none" } },
    {
      axes: { glassBlur: "low" },
      vars: { "--glass-blur": "10px", "--glass-scrim-blur": "2px" },
    },
    {
      axes: { glassBlur: "medium" },
      vars: { "--glass-blur": "20px", "--glass-scrim-blur": "4px" },
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
    },
  },
}
