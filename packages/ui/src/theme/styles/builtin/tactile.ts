import type { StyleDefinition } from "../../config/schema"

/**
 * Admin Bevel: every raised surface carries a four-line bevel (darker sides,
 * darkest bottom, light top) and every key is lit from below. The filled
 * key's sheen starts at 75% of its height, below the label's descenders, so
 * the fill keeps its label's 4.5:1 floor wherever the glyphs sit.
 */
export const tactile: StyleDefinition = {
  label: "Tactile",
  hairlines: "opaque",
  signatures: {
    navSelection: "chip",
    fieldFill: "surface",
    barTone: "inverse",
    barSpan: "full",
    labelCase: "none",
    bannerMark: "icon",
    badgeStyle: "tint",
    dialogFooter: "ruled",
    avatarShape: "square",
  },
  vars: {
    shared: {
      "--tactile-bevel":
        "inset 1px 0 0 rgb(0 0 0 / 0.13), inset -1px 0 0 rgb(0 0 0 / 0.13), inset 0 -1px 0 rgb(0 0 0 / 0.17), inset 0 1px 0 rgb(204 204 204 / 0.5)",
      "--tactile-lift": "0 1px 0 rgb(26 26 26 / 0.07)",
    },
    dark: {
      "--tactile-bevel":
        "inset 1px 0 0 rgb(204 204 204 / 0.08), inset -1px 0 0 rgb(204 204 204 / 0.08), inset 0 -1px 0 rgb(204 204 204 / 0.08), inset 0 1px 0 rgb(204 204 204 / 0.16)",
      "--tactile-lift": "0 1px 0 rgb(0 0 0 / 0.4)",
    },
  },
  tokens: {
    shared: {
      buttonEdge:
        "inset 0 -1px 0 1px rgb(0 0 0 / 0.45), inset 0 0.5px 0 1.5px rgb(255 255 255 / 0.25)",
      buttonSheen:
        "linear-gradient(180deg, transparent 75%, rgb(255 255 255 / 0.15))",
      buttonShadow: "0 0 transparent",
      buttonDangerShadow: "0 0 transparent",
      buttonBorder: "transparent",
      buttonNeutralFill: "hsl(var(--card))",
      buttonNeutralEdge:
        "inset 0 -1px 0 rgb(0 0 0 / 0.29), inset 0 0 0 1px rgb(0 0 0 / 0.1), inset 0 0.5px 0 1.5px rgb(255 255 255)",
      buttonNeutralSheen: "none",
      buttonNeutralShadow: "0 0 transparent",
      buttonWeight: "550",
      ghostHover: "0.05",
      fieldShadow: "0 0 transparent",
      fieldFocusRing:
        "0 0 0 1px hsl(var(--background)), 0 0 0 3px hsl(var(--ring))",
      fieldFocusBorder: "hsl(var(--foreground))",
      checkWellShadow: "inset 0 1px 0 rgb(0 0 0 / 0.06)",
      checkRadius: "calc(var(--radius) / 2)",
      thumbShadow:
        "inset 0 -1px 0 rgb(0 0 0 / 0.29), inset 0 0 0 1px rgb(0 0 0 / 0.1), 0 1px 1px rgb(26 26 26 / 0.2)",
      trackWell:
        "inset 0 1px 2px rgb(26 26 26 / 0.15), inset 0 1px 1px rgb(26 26 26 / 0.15)",
      selectedViewFill: "hsl(var(--neutral-5))",
      selectedViewShadow:
        "inset -1px 0 1px rgb(26 26 26 / 0.12), inset 1px 0 1px rgb(26 26 26 / 0.12), inset 0 2px 1px rgb(26 26 26 / 0.2)",
      segmentRadius: "var(--radius)",
      cardEdge: "var(--tactile-lift), var(--tactile-bevel)",
      cardBorder: "transparent",
      cardRadius: "calc(var(--radius) * 1.5)",
      overlayBorder: "transparent",
      dropdownShadow:
        "0 4px 6px -2px rgb(26 26 26 / 0.2), var(--tactile-bevel)",
      overlayRadius: "calc(var(--radius) * 1.5)",
      menuItemRadius: "var(--radius)",
      dialogBorder: "transparent",
      modalShadow:
        "0 20px 20px -8px rgb(26 26 26 / 0.28), var(--tactile-bevel)",
      dialogRadius: "calc(var(--radius) * 2)",
      scrim: "rgb(0 0 0 / 0.6)",
      chromeRailFill: "hsl(var(--neutral-5))",
      navSelectionFill: "hsl(var(--card))",
      navSelectionEdge: "transparent",
      navSelectionShadow: "var(--tactile-lift), var(--tactile-bevel)",
      navItemRadius: "var(--radius)",
      bannerRadius: "calc(var(--radius) * 1.5)",
      bannerBorder: "transparent",
      bannerShadow: "var(--tactile-lift)",
      badgeRadius: "var(--radius)",
      uiWeight: "450",
      pageTitleWeight: "650",
      pageTitleTracking: "-0.01em",
      sectionTitleWeight: "650",
      dialogTitleWeight: "650",
    },
    dark: {
      buttonEdge:
        "inset 0 -1px 0 1px rgb(0 0 0 / 0.28), inset 0 0.5px 0 1.5px rgb(255 255 255 / 0.5)",
      buttonNeutralFill: "hsl(var(--muted))",
      buttonNeutralEdge:
        "inset 0 -1px 0 rgb(0 0 0 / 0.45), inset 0 0 0 1px rgb(255 255 255 / 0.08), inset 0 0.5px 0 1.5px rgb(255 255 255 / 0.1)",
      ghostHover: "0.14",
      checkWellShadow: "inset 0 1px 1px rgb(0 0 0 / 0.4)",
      thumbShadow:
        "inset 0 -1px 0 rgb(0 0 0 / 0.4), 0 1px 1px rgb(0 0 0 / 0.5)",
      trackWell:
        "inset 0 1px 2px rgb(0 0 0 / 0.5), inset 0 1px 1px rgb(0 0 0 / 0.4)",
      selectedViewFill: "hsl(var(--card))",
      selectedViewShadow:
        "inset 0 2px 1px rgb(0 0 0 / 0.45), inset 1px 0 1px rgb(0 0 0 / 0.3), inset -1px 0 1px rgb(0 0 0 / 0.3)",
      dropdownShadow: "0 4px 6px -2px rgb(0 0 0 / 0.5), var(--tactile-bevel)",
      modalShadow: "0 20px 20px -8px rgb(0 0 0 / 0.6), var(--tactile-bevel)",
      chromeRailFill: "hsl(var(--background))",
      navSelectionFill: "hsl(var(--neutral-4))",
    },
  },
}
