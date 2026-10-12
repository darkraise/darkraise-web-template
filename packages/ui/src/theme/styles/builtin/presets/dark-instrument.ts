import type { PresetDefinition } from "../../../config/schema"

/**
 * Dark Instrument: an orange accent on blue-black graphite, set in IBM Plex
 * Sans. Coral is the nearest ramp to the direction's deep orange: the orange
 * ramp's light fill is a bright one under a dark label.
 *
 * An instrument panel: the chrome is flush with its ground behind a double
 * seam, every raised part carries a hard specular top edge inside a dark
 * rim, the filled key glows in the accent, and labels are uppercase and
 * figures are monospace readouts. A value that holds a black, white or ink
 * shadow is written per mode: this layer sits above Tactile's dark values, so
 * a shared one would reach dark mode as well.
 *
 * Each card sheen opens with its white alpha, top down, even at 0: the
 * lifted field edge is solved for a card face no lighter than the elevation
 * lift plus that alpha, which caps it near 0.016.
 */
export const darkInstrument: PresetDefinition = {
  label: "Dark Instrument",
  style: "tactile",
  axes: {
    accentColor: "coral",
    surfaceColor: "graphite",
    tintWithAccent: "off",
    signalColor: "none",
    font: "ibm-plex-sans",
    headingFont: "body",
  },
  signatures: {
    barTone: "page",
    barSpan: "content",
    labelCase: "upper",
    figureFamily: "mono",
    cardDivider: "seam",
    tableHead: "seam",
    bannerMark: "lamp",
    bannerSurface: "card",
    fieldFill: "well",
    dialogFooter: "plain",
  },
  tokens: {
    shared: {
      buttonSheen: "none",
      fieldFocusRing: "0 0 0 3px hsl(var(--primary) / 0.25)",
      fieldFocusBorder: "hsl(var(--primary-text))",
      switchRadius: "calc(var(--radius) / 2)",
      overlayRadius: "calc(var(--radius) * 1.25)",
      dialogRadius: "calc(var(--radius) * 1.75)",
      badgeRadius: "calc(var(--radius) / 2)",
      chromeBarHeight: "2.75rem",
      pageTitleWeight: "600",
      sectionTitleWeight: "600",
      dialogTitleWeight: "600",
      figureWeight: "500",
    },
    light: {
      buttonEdge:
        "inset 0 -1px 0.4px rgb(0 0 0 / 0.25), inset 0 1px 0.4px rgb(255 255 255 / 0.45)",
      buttonShadow:
        "0 0 0 1px rgb(0 0 0 / 0.35), 0 0 12px hsl(var(--primary) / 0.25)",
      buttonDangerShadow: "0 0 0 1px rgb(0 0 0 / 0.35)",
      buttonNeutralEdge:
        "inset 0 -1px 0.4px rgb(0 0 0 / 0.2), inset 0 1px 0.4px rgb(255 255 255)",
      buttonNeutralSheen:
        "linear-gradient(180deg, transparent, rgb(0 0 0 / 0.08))",
      buttonNeutralShadow: "0 1px 2px hsl(var(--foreground) / 0.2)",
      fieldShadow:
        "inset 0 1px 2px hsl(var(--foreground) / 0.2), 0 1px 0 rgb(255 255 255 / 0.7)",
      thumbShadow:
        "0 0 0 1px hsl(var(--foreground) / 0.3), 0 1px 2px hsl(var(--foreground) / 0.3), inset 0 1px 0 rgb(255 255 255)",
      selectedViewFill: "hsl(var(--card))",
      selectedViewShadow:
        "0 0 0 1px hsl(var(--foreground) / 0.32), 0 1px 2px hsl(var(--foreground) / 0.2), inset 0 1px 0.4px rgb(255 255 255)",
      cardEdge:
        "inset 0 1px 0 rgb(255 255 255), 0 0 0 1px hsl(var(--foreground) / 0.12), 0 8px 20px -8px hsl(var(--foreground) / 0.18)",
      cardSheen:
        "linear-gradient(180deg, rgb(255 255 255 / 0), rgb(0 0 0 / 0.04)), repeating-linear-gradient(90deg, transparent 0 1px, rgb(0 0 0 / 0.025) 1px 2px)",
      seam: "hsl(var(--foreground) / 0.22)",
      seamHighlight: "rgb(255 255 255 / 0.7)",
      dropdownShadow:
        "0 0 0 1px hsl(var(--foreground) / 0.16), 0 12px 32px -8px hsl(var(--foreground) / 0.3), inset 0 1px 0 rgb(255 255 255)",
      modalShadow:
        "0 0 0 1px hsl(var(--foreground) / 0.16), 0 30px 50px -12px hsl(var(--foreground) / 0.4), inset 0 1px 0 rgb(255 255 255)",
      scrim: "hsl(var(--foreground) / 0.35)",
      chromeBarFill: "hsl(var(--neutral-5))",
      chromeEdge: "hsl(var(--foreground) / 0.22)",
      chromeShadow: "1px 1px 0 rgb(255 255 255 / 0.7)",
      navSelectionShadow:
        "0 0 0 1px hsl(var(--foreground) / 0.32), 0 1px 2px hsl(var(--foreground) / 0.2), inset 0 -1px 0.4px rgb(0 0 0 / 0.2), inset 0 1px 0.4px rgb(255 255 255)",
    },
    dark: {
      buttonEdge:
        "inset 0 -1px 0.4px rgb(0 0 0 / 0.25), inset 0 1px 0.4px rgb(255 255 255 / 0.55)",
      buttonShadow:
        "0 0 0 1px rgb(0 0 0 / 0.6), 0 0 14px hsl(var(--primary) / 0.25)",
      buttonDangerShadow:
        "0 0 0 1px rgb(0 0 0 / 0.6), 0 0 12px hsl(var(--destructive-solid) / 0.2)",
      buttonNeutralFill: "hsl(var(--card))",
      buttonNeutralEdge:
        "inset 0 2px 1px 1px rgb(0 0 0 / 0.25), inset 0 1px 1px 1px rgb(255 255 255 / 0.2)",
      buttonNeutralSheen:
        "radial-gradient(75% 75% at 50% 92%, rgb(255 255 255 / 0.04), transparent)",
      buttonNeutralShadow:
        "0 1.5px 0.5px 2.5px rgb(0 0 0 / 0.4), 0 0 0.5px 1px rgb(0 0 0)",
      fieldShadow:
        "inset 0 1px 2px rgb(0 0 0 / 0.6), 0 1px 0 rgb(255 255 255 / 0.05)",
      thumbShadow:
        "0 1px 0.5px 1px rgb(0 0 0 / 0.5), 0 0 0.5px 1px rgb(0 0 0), inset 0 1px 1px rgb(255 255 255 / 0.22)",
      selectedViewShadow:
        "0 1.5px 0.5px 2.5px rgb(0 0 0 / 0.4), 0 0 0.5px 1px rgb(0 0 0), inset 0 1px 1px 1px rgb(255 255 255 / 0.2)",
      cardEdge:
        "inset 0 1px 0 rgb(255 255 255 / 0.08), inset 0 0 0 1px rgb(255 255 255 / 0.06), 0 0 0 1px rgb(0 0 0 / 0.6), 0 8px 24px rgb(0 0 0 / 0.35)",
      cardSheen:
        "linear-gradient(180deg, rgb(255 255 255 / 0.015), rgb(0 0 0 / 0.15) 76%)",
      seam: "rgb(0 0 0)",
      seamHighlight: "rgb(255 255 255 / 0.04)",
      dropdownShadow:
        "0 4px 40px 8px rgb(0 0 0 / 0.4), 0 0 0 0.5px rgb(0 0 0 / 0.8), inset 0 0.5px 0 rgb(255 255 255 / 0.3), inset 0 0 0 1px rgb(255 255 255 / 0.06)",
      modalShadow:
        "0 4px 40px 8px rgb(0 0 0 / 0.4), 0 30px 50px rgb(0 0 0 / 0.5), 0 0 0 0.5px rgb(0 0 0 / 0.8), inset 0 0.5px 0 rgb(255 255 255 / 0.3), inset 0 0 0 1px rgb(255 255 255 / 0.06)",
      chromeBarFill: "hsl(var(--background))",
      chromeEdge: "rgb(0 0 0)",
      chromeShadow: "1px 1px 0 rgb(255 255 255 / 0.06)",
      navSelectionFill: "hsl(var(--card))",
      navSelectionShadow:
        "0 1.5px 0.5px 2.5px rgb(0 0 0 / 0.4), 0 0 0.5px 1px rgb(0 0 0), inset 0 2px 1px 1px rgb(0 0 0 / 0.25), inset 0 1px 1px 1px rgb(255 255 255 / 0.2)",
    },
  },
}
