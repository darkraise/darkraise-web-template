import type { StyleDefinition } from "../../config/schema"

/**
 * Ledger: depth made of tint steps and 1px rules, never shadows. Chrome sits
 * on the card tone above a tinted page, the current nav row is a tint with an
 * accent cue, dialogs are ringed rather than bordered, and figures and page
 * titles are set light.
 *
 * Popovers keep a real border, since their arrow copies it, and set only the
 * dropdown shadow, so the overlay keeps the elevation lift and the glow axes.
 * The outline button keeps the kit's 3:1 edge.
 */
export const quiet: StyleDefinition = {
  label: "Quiet",
  signatures: {
    navSelection: "tint",
    railTone: "raised",
    barTone: "raised",
    dialogHeader: "band",
    tableHead: "plain",
    avatarShape: "square",
    bannerMark: "icon",
  },
  vars: {
    shared: {
      "--quiet-rule":
        "color-mix(in oklab, hsl(var(--border)) 72%, hsl(var(--border-strong)))",
      "--quiet-ring":
        "color-mix(in oklab, hsl(var(--border)) 85%, hsl(var(--border-strong)))",
    },
    dark: {
      "--quiet-ring": "var(--quiet-rule)",
    },
  },
  tokens: {
    shared: {
      buttonEdge: "0 0 transparent",
      buttonSheen: "none",
      buttonShadow: "0 0 transparent",
      buttonDangerShadow: "0 0 transparent",
      buttonNeutralEdge: "0 0 transparent",
      buttonNeutralSheen: "none",
      buttonNeutralShadow: "0 0 transparent",
      buttonNeutralFill: "hsl(var(--card))",
      fieldShadow: "0 0 transparent",
      fieldFocusRing: "0 0 0 3px hsl(var(--primary) / 0.12)",
      selectedViewShadow: "0 0 0 1px var(--quiet-rule)",
      cardBorder: "hsl(var(--border))",
      overlayBorder: "var(--quiet-ring)",
      dropdownShadow: "0 6px 16px hsl(var(--foreground) / 0.08)",
      dialogBorder: "transparent",
      modalShadow:
        "0 0 0 1px var(--quiet-ring), 0 16px 40px hsl(var(--foreground) / 0.14)",
      dialogRadius: "calc(var(--radius) + 0.25rem)",
      scrim: "hsl(var(--foreground) / 0.3)",
      figureWeight: "300",
      pageTitleWeight: "300",
      pageTitleTracking: "-0.02em",
    },
    dark: {
      fieldFocusRing: "0 0 0 3px hsl(var(--primary) / 0.18)",
      dropdownShadow: "0 6px 16px rgb(0 0 0 / 0.5)",
      modalShadow: "0 0 0 1px var(--quiet-ring), 0 16px 40px rgb(0 0 0 / 0.5)",
      scrim: "rgb(0 0 0 / 0.5)",
    },
  },
}
