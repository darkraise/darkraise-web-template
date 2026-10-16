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
    fieldFill: "translucent",
    tableHead: "plain",
    buttonStyle: "glass",
    iconButton: "round",
    checkStyle: "round",
    sliderStyle: "knob",
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
      buttonNeutralFill: "hsl(var(--card) / var(--surface-alpha))",
      fieldFocusRing: "0 0 0 3px hsl(var(--primary) / 0.15)",
      scrim: "hsl(var(--foreground) / 0.3)",
      surfaceBackdrop: glassBackdrop("saturate(180%)"),
      overlayBackdrop: glassBackdrop("saturate(180%)"),
      scrimBackdrop: glassBackdrop("", "var(--glass-scrim-blur)"),
      viewTrackBackdrop: glassBackdrop("saturate(115%)"),
      // The current nav row is set into the rail, not lifted off it.
      navSelectionShadow: "0 0 transparent",
      navSelectionGlow: "0 0 transparent",
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
      wellFill: "rgb(255 255 255 / 0.35)",
      viewTrackSheen:
        "linear-gradient(180deg, rgb(255 255 255 / 0.5), transparent 75%)",
      viewTrackShadow:
        "inset 0 -1px 0 rgb(255 255 255 / 0.8), inset 0 0 0 1px hsl(var(--foreground) / 0.08)",
      selectedViewFill:
        "linear-gradient(hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.12)), linear-gradient(180deg, rgb(255 255 255 / 0.96), rgb(255 255 255 / 0.62))",
      // The pane's accent edge, composited at its alpha, clears 3:1 against
      // the track at the sheen's peak and the plain well in every look
      // (glass-selected-chip.test.ts, anatomy-contrast.test.ts).
      selectedViewShadow:
        "0 0 0 1px hsl(var(--primary) / 0.95), inset 0 1px 0 rgb(255 255 255 / 0.95), 0 6px 16px -8px hsl(var(--primary) / 0.5)",
      navSelectionFill:
        "linear-gradient(hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.12)), linear-gradient(rgb(255 255 255 / 0.7), rgb(255 255 255 / 0.7))",
      navSelectionEdge: "hsl(var(--primary) / 0.3)",
      dropdownShadow: "0 10px 30px -10px rgb(0 0 0 / 0.25)",
    },
    dark: {
      chromeRailFill: "hsl(var(--card))",
      surfaceFillAlpha: "0.6",
      cardBorder: "rgb(255 255 255 / 0.14)",
      cardEdge: "inset 0 1px 0 rgb(255 255 255 / 0.08)",
      overlayBorder: "rgb(255 255 255 / 0.14)",
      dialogBorder: "rgb(255 255 255 / 0.14)",
      wellFill: "rgb(255 255 255 / 0.06)",
      // The muted ink falls under 4.5:1 on a well only 6% white over a vivid
      // ground, so the inactive tab and segment labels lift toward the text.
      viewTrackLabel:
        "color-mix(in srgb, hsl(var(--muted-foreground)), hsl(var(--foreground)) 60%)",
      viewTrackSheen:
        "linear-gradient(180deg, rgb(255 255 255 / 0.07), transparent 75%)",
      viewTrackShadow:
        "inset 0 -1px 0 rgb(255 255 255 / 0.12), inset 0 0 0 1px rgb(255 255 255 / 0.09)",
      selectedViewFill:
        "linear-gradient(hsl(var(--primary-text) / 0.16), hsl(var(--primary-text) / 0.16)), linear-gradient(180deg, rgb(255 255 255 / 0.08), rgb(255 255 255 / 0.07))",
      selectedViewShadow:
        "0 0 0 1px hsl(var(--primary-text) / 0.9), inset 0 1px 0 rgb(255 255 255 / 0.26), 0 6px 18px -8px hsl(var(--primary) / 0.6)",
      navSelectionFill:
        "linear-gradient(hsl(var(--primary-text) / 0.16), hsl(var(--primary-text) / 0.16)), linear-gradient(rgb(255 255 255 / 0.11), rgb(255 255 255 / 0.11))",
      navSelectionEdge: "hsl(var(--primary-text) / 0.34)",
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
      cardBorder: "hsl(var(--border))",
      cardEdge: "0 0 transparent",
      dialogBorder: "hsl(var(--border))",
      selectedViewShadow: "0 0 transparent",
      selectedViewFill: "hsl(var(--card))",
    },
  },
}
