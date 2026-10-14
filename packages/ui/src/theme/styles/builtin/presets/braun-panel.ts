import type { PresetDefinition } from "../../../config/schema"

/**
 * Braun Panel: a near-black accent on warm greys in a framed shell, with a
 * yellow signal for the lamp marks. Geist stands in for Instrument Sans.
 *
 * The bar and the rail share the housing's grey, parts join at a seam (a
 * dark line over a light one) and every key is lit from above with a soft
 * drop below, where Tactile bevels all four sides. A value that holds a
 * black, white or ink shadow is written per mode: this layer sits above
 * Tactile's dark values, so a shared one would reach dark mode as well.
 *
 * The card sheen opens with its white alpha, top down: the lifted field edge
 * is solved for a card face no lighter than the elevation lift plus that
 * alpha, which caps it near 0.016.
 */
export const braunPanel: PresetDefinition = {
  label: "Braun Panel",
  style: "tactile",
  shellStyle: "framed",
  axes: {
    accentColor: "neutral",
    surfaceColor: "sand",
    tintWithAccent: "off",
    signalColor: "yellow",
    font: "geist",
    headingFont: "body",
  },
  signatures: {
    barTone: "page",
    barSpan: "content",
    labelCase: "lower",
    tooltipTone: "inverse",
    cardDivider: "seam",
    tableHead: "seam",
    bannerMark: "lamp",
    bannerSurface: "card",
    badgeStyle: "outline",
    fieldFill: "well",
    dialogFooter: "plain",
    avatarShape: "round",
    switchStyle: "slide",
    tabStyle: "outline",
    sliderStyle: "bar",
  },
  tokens: {
    shared: {
      buttonSheen: "none",
      fieldFocusRing: "0 0 0 3px hsl(var(--signal-fill) / 0.55)",
      switchRadius: "calc(var(--radius) / 2)",
      cardBorder: "hsl(var(--border))",
      cardRadius: "calc(var(--radius) * 1.75)",
      overlayRadius: "calc(var(--radius) * 1.25)",
      dialogRadius: "calc(var(--radius) * 2.25)",
      navSelectionEdge: "hsl(var(--border))",
      bannerRadius: "calc(var(--radius) * 1.75)",
      bannerBorder: "hsl(var(--border))",
      badgeRadius: "calc(var(--radius) / 2)",
      pageTitleWeight: "600",
      sectionTitleWeight: "600",
      dialogTitleWeight: "600",
      figureWeight: "500",
    },
    light: {
      buttonEdge:
        "inset 0 1px 0 rgb(255 255 255 / 0.12), inset 0 0 0 1px rgb(0 0 0 / 0.3)",
      buttonShadow: "0 1px 1px rgb(0 0 0 / 0.25), 0 2px 4px rgb(0 0 0 / 0.12)",
      buttonDangerShadow:
        "0 1px 1px rgb(0 0 0 / 0.25), 0 2px 4px rgb(0 0 0 / 0.12)",
      buttonNeutralEdge:
        "inset 0 1px 0 rgb(255 255 255), inset 0 -2px 0 rgb(0 0 0 / 0.06)",
      buttonNeutralSheen:
        "radial-gradient(120% 90% at 50% 0%, transparent, rgb(0 0 0 / 0.03) 60%, rgb(0 0 0 / 0.07))",
      buttonNeutralShadow:
        "0 1px 1px hsl(var(--foreground) / 0.12), 0 2px 4px hsl(var(--foreground) / 0.08)",
      fieldShadow: "inset 0 1px 2px hsl(var(--foreground) / 0.12)",
      thumbShadow:
        "0 1px 2px hsl(var(--foreground) / 0.3), inset 0 1px 0 rgb(255 255 255), 0 0 0 0.5px hsl(var(--foreground) / 0.25)",
      selectedViewFill: "hsl(var(--card))",
      selectedViewShadow:
        "inset 0 1px 0 rgb(255 255 255), 0 1px 1px hsl(var(--foreground) / 0.15), 0 0 0 1px hsl(var(--border))",
      cardEdge:
        "inset 0 1px 0 rgb(255 255 255 / 0.9), 0 1px 2px hsl(var(--foreground) / 0.08), 0 6px 16px -6px hsl(var(--foreground) / 0.12)",
      seamHighlight: "rgb(255 255 255)",
      dropdownShadow:
        "0 0 0 1px hsl(var(--foreground) / 0.12), 0 8px 24px -6px hsl(var(--foreground) / 0.22)",
      modalShadow:
        "0 0 0 1px hsl(var(--foreground) / 0.1), 0 24px 48px -12px hsl(var(--foreground) / 0.28), inset 0 1px 0 rgb(255 255 255)",
      scrim: "hsl(var(--foreground) / 0.28)",
      chromeBarFill: "hsl(var(--neutral-5))",
      chromeEdge: "hsl(var(--foreground) / 0.12)",
      navSelectionShadow:
        "inset 0 1px 0 rgb(255 255 255), inset 0 -2px 0 rgb(0 0 0 / 0.06), 0 1px 1px hsl(var(--foreground) / 0.12), 0 2px 4px hsl(var(--foreground) / 0.08)",
    },
    dark: {
      buttonEdge:
        "inset 0 1px 0 rgb(255 255 255), inset 0 -2px 0 rgb(0 0 0 / 0.08), inset 0 0 0 1px rgb(0 0 0 / 0.3)",
      buttonShadow: "0 1px 1px rgb(0 0 0 / 0.5), 0 2px 4px rgb(0 0 0 / 0.35)",
      buttonDangerShadow:
        "0 1px 1px rgb(0 0 0 / 0.5), 0 2px 4px rgb(0 0 0 / 0.3)",
      buttonNeutralEdge:
        "inset 0 1px 0 rgb(255 255 255 / 0.08), inset 0 -2px 0 rgb(0 0 0 / 0.25)",
      buttonNeutralSheen:
        "radial-gradient(120% 90% at 50% 0%, rgb(255 255 255 / 0.06), transparent 60%, rgb(0 0 0 / 0.1))",
      buttonNeutralShadow:
        "0 1px 1px rgb(0 0 0 / 0.4), 0 2px 4px rgb(0 0 0 / 0.3)",
      fieldShadow: "inset 0 1px 2px rgb(0 0 0 / 0.5)",
      thumbShadow:
        "0 1px 2px rgb(0 0 0 / 0.6), inset 0 1px 0 rgb(255 255 255 / 0.1)",
      selectedViewFill: "hsl(var(--muted))",
      selectedViewShadow:
        "inset 0 1px 0 rgb(255 255 255 / 0.08), 0 1px 1px rgb(0 0 0 / 0.5), 0 0 0 1px hsl(var(--border))",
      cardEdge:
        "inset 0 1px 0 rgb(255 255 255 / 0.05), 0 1px 2px rgb(0 0 0 / 0.4), 0 6px 16px -6px rgb(0 0 0 / 0.5)",
      cardSheen:
        "linear-gradient(180deg, rgb(255 255 255 / 0.015), rgb(0 0 0 / 0.08))",
      seam: "rgb(0 0 0 / 0.5)",
      seamHighlight: "rgb(255 255 255 / 0.05)",
      dropdownShadow:
        "0 0 0 1px rgb(0 0 0 / 0.5), 0 8px 24px -6px rgb(0 0 0 / 0.6), inset 0 1px 0 rgb(255 255 255 / 0.05)",
      modalShadow:
        "0 0 0 1px rgb(0 0 0 / 0.5), 0 24px 48px -12px rgb(0 0 0 / 0.6), inset 0 1px 0 rgb(255 255 255 / 0.06)",
      scrim: "rgb(0 0 0 / 0.5)",
      navSelectionShadow:
        "inset 0 1px 0 rgb(255 255 255 / 0.08), inset 0 -2px 0 rgb(0 0 0 / 0.25), 0 1px 1px rgb(0 0 0 / 0.4), 0 2px 4px rgb(0 0 0 / 0.3)",
    },
  },
}
