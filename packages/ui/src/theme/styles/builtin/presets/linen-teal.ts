import type { PresetDefinition } from "../../../config/schema"

/**
 * Linen & Teal: near-white neutrals under a deep teal, which sits between
 * the teal and cyan ramps; cyan is the nearer. Geist stands in for Hanken
 * Grotesk.
 *
 * Every grey is the text colour at a low alpha: the chrome is the page under
 * a 3.5% wash, and cards are white panels ringed at 8% that lift on a soft
 * shadow of the same ink. A focused field glows in the accent where Quiet
 * rings it, the modal scrim is a grey wash, not black, and panels round one
 * step past the controls. Dark mode sets body text and titles a little
 * lighter, since light text on dark reads heavier.
 */
export const linenTeal: PresetDefinition = {
  label: "Linen & Teal",
  style: "quiet",
  shellStyle: "flat",
  axes: {
    accentColor: "cyan",
    surfaceColor: "neutral",
    tintWithAccent: "off",
    signalColor: "none",
    font: "geist",
    headingFont: "body",
  },
  signatures: {
    navSelection: "pill",
    navMarker: "none",
    railTone: "page",
    barTone: "page",
    tooltipTone: "inverse",
    labelCase: "none",
    badgeStyle: "tint",
    fieldFill: "surface",
    dialogHeader: "plain",
    avatarShape: "round",
    buttonStyle: "soft",
    iconButton: "round",
    tabStyle: "pill",
  },
  tokens: {
    shared: {
      chromeFlatFill:
        "color-mix(in oklab, hsl(var(--foreground)) 3.5%, hsl(var(--background)))",
      fieldFocusRing: "0 0 24px 2px hsl(var(--primary) / 0.22)",
      thumbShadow: "0 1px 2px hsl(var(--foreground) / 0.2)",
      cardBorder: "hsl(var(--foreground) / 0.08)",
      cardEdge:
        "0 2px 6px -2px hsl(var(--foreground) / 0.14), 0 6px 20px -5px hsl(var(--foreground) / 0.1)",
      cardRadius: "calc(var(--radius) + 0.25rem)",
      overlayRadius: "calc(var(--radius) + 0.25rem)",
      dropdownShadow:
        "0 2px 6px -2px hsl(var(--foreground) / 0.14), 0 6px 20px -5px hsl(var(--foreground) / 0.1)",
      modalShadow:
        "0 0 0 1px var(--quiet-ring), 0 5px 20px -4px hsl(var(--foreground) / 0.22), 0 15px 48px -12px hsl(var(--foreground) / 0.2)",
      dialogRadius: "calc(var(--radius) + 0.5rem)",
      scrim: "hsl(var(--neutral-6) / 0.7)",
      navItemRadius: "var(--radius)",
      badgeRadius: "calc(var(--radius-control) * 2)",
      bannerRadius: "calc(var(--radius) + 0.25rem)",
      segmentRadius: "calc(var(--radius-control) * 3)",
      menuItemRadius: "var(--radius)",
      pageTitleWeight: "400",
      pageTitleTracking: "-0.01em",
      sectionTitleWeight: "500",
      dialogTitleWeight: "500",
      figureWeight: "400",
    },
    dark: {
      fieldFocusRing: "0 0 24px 2px hsl(var(--primary) / 0.25)",
      thumbShadow: "0 0 transparent",
      cardBorder: "hsl(var(--foreground) / 0.1)",
      cardEdge:
        "0 2px 6px -2px rgb(0 0 0 / 0.5), 0 6px 20px -5px rgb(0 0 0 / 0.4)",
      dropdownShadow:
        "0 2px 6px -2px rgb(0 0 0 / 0.5), 0 6px 20px -5px rgb(0 0 0 / 0.4)",
      modalShadow:
        "0 0 0 1px var(--quiet-ring), 0 5px 20px -4px rgb(0 0 0 / 0.5), 0 15px 48px -12px rgb(0 0 0 / 0.7)",
      scrim: "hsl(var(--background) / 0.7)",
      buttonWeight: "470",
      pageTitleWeight: "360",
      sectionTitleWeight: "470",
      dialogTitleWeight: "470",
      uiWeight: "360",
      figureWeight: "360",
    },
  },
}
