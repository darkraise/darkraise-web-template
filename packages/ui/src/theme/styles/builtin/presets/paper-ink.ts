import type { PresetDefinition } from "../../../config/schema"

/**
 * Paper & Ink: warm paper under an ink navy, with serif titles. The navy
 * carries about half the blue ramp's chroma, which only dark mode can calm.
 * Geist stands in for Instrument Sans.
 *
 * The app reads as a set page: the chrome is the paper itself, the current
 * nav row is ink text beside a 2px rule, and card footers drop back to the
 * page tone like margin notes. Where Quiet draws no shadow at all, this
 * preset draws short ones in the text colour, so they read as paper rather
 * than grey; dark mode has no paper to tint and uses black.
 */
export const paperInk: PresetDefinition = {
  label: "Paper & Ink",
  style: "quiet",
  shellStyle: "flat",
  axes: {
    accentColor: "blue",
    surfaceColor: "sand",
    tintWithAccent: "off",
    signalColor: "none",
    font: "geist",
    headingFont: "newsreader",
    darkAccentChroma: "calm",
  },
  signatures: {
    navSelection: "rule",
    railTone: "page",
    barTone: "page",
    tooltipTone: "inverse",
    cardFooter: "inset",
    bannerMark: "stripe",
    badgeStyle: "tint",
    fieldFill: "surface",
    tableHead: "ruled",
    dialogHeader: "plain",
    dialogFooter: "ruled",
    avatarShape: "round",
  },
  tokens: {
    shared: {
      chromeFlatFill: "hsl(var(--background))",
      buttonEdge: "inset 0 1px 0 rgb(255 255 255 / 0.1)",
      buttonShadow: "0 1px 1px hsl(var(--foreground) / 0.2)",
      buttonDangerShadow: "0 1px 1px hsl(var(--foreground) / 0.2)",
      buttonNeutralShadow: "0 1px 0 hsl(var(--foreground) / 0.05)",
      thumbShadow: "0 1px 2px hsl(var(--foreground) / 0.25)",
      cardEdge: "0 1px 0 hsl(var(--foreground) / 0.04)",
      dropdownShadow:
        "0 2px 4px hsl(var(--foreground) / 0.05), 0 12px 28px -8px hsl(var(--foreground) / 0.18)",
      modalShadow:
        "0 0 0 1px var(--quiet-ring), 0 4px 8px hsl(var(--foreground) / 0.04), 0 32px 64px -16px hsl(var(--foreground) / 0.28)",
      bannerBorder: "transparent",
      badgeRadius: "calc(var(--radius-control) * 2)",
      menuItemRadius: "calc(var(--radius) - 2px)",
      pageTitleWeight: "500",
      pageTitleTracking: "-0.01em",
      sectionTitleWeight: "500",
      dialogTitleWeight: "500",
      figureWeight: "500",
    },
    dark: {
      buttonShadow: "0 1px 1px rgb(0 0 0 / 0.5)",
      buttonDangerShadow: "0 1px 1px rgb(0 0 0 / 0.5)",
      buttonNeutralShadow: "0 1px 0 rgb(0 0 0 / 0.125)",
      thumbShadow: "0 1px 2px rgb(0 0 0 / 0.5)",
      cardEdge: "0 1px 0 rgb(0 0 0 / 0.1)",
      dropdownShadow:
        "0 2px 4px rgb(0 0 0 / 0.125), 0 12px 28px -8px rgb(0 0 0 / 0.45)",
      modalShadow:
        "0 0 0 1px var(--quiet-ring), 0 4px 8px rgb(0 0 0 / 0.1), 0 32px 64px -16px rgb(0 0 0 / 0.6)",
    },
  },
}
