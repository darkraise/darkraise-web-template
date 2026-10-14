import type { PresetDefinition } from "../../../config/schema"

/**
 * Studio Green: an emerald accent on pure greys, with Inter for the body.
 * Geist stands in for Manrope on headings.
 *
 * Built dark first. The rail and a low top bar share the page colour, and
 * the chrome's rule and every card's edge are the text colour at 8%, so in
 * dark they read as translucent white. The current nav row is a neutral
 * fill, banners sit on the card surface, and a field takes the fill of the
 * surface it sits on. Body text is set at weight 450 under tight 600
 * titles. Quiet draws no shadow on buttons, and the preset deepens menus
 * and dialogs.
 */
export const studioGreen: PresetDefinition = {
  label: "Studio Green",
  style: "quiet",
  axes: {
    accentColor: "emerald",
    surfaceColor: "neutral",
    tintWithAccent: "off",
    signalColor: "none",
    font: "inter",
    headingFont: "geist",
  },
  signatures: {
    navSelection: "pill",
    navMarker: "none",
    railTone: "page",
    barTone: "page",
    bannerSurface: "card",
    fieldFill: "surface",
    dialogHeader: "plain",
    dialogFooter: "ruled",
    avatarShape: "round",
    buttonStyle: "soft",
    switchStyle: "track",
    checkStyle: "round",
    tabStyle: "underline",
    sliderStyle: "knob",
  },
  tokens: {
    shared: {
      chromeEdge: "hsl(var(--foreground) / 0.08)",
      chromeBarHeight: "3rem",
      cardBorder: "hsl(var(--foreground) / 0.08)",
      badgeRadius: "calc(var(--radius-control) * 2)",
      menuItemRadius: "calc(var(--radius) - 2px)",
      pageTitleWeight: "600",
      pageTitleTracking: "-0.025em",
      sectionTitleTracking: "-0.025em",
      dialogTitleTracking: "-0.025em",
      uiWeight: "450",
      figureWeight: "600",
    },
    light: {
      buttonShadow: "0 1px 2px rgb(0 0 0 / 0.1)",
      buttonDangerShadow: "0 1px 2px rgb(0 0 0 / 0.1)",
      buttonNeutralShadow: "0 1px 2px rgb(0 0 0 / 0.05)",
      thumbShadow: "0 1px 2px rgb(0 0 0 / 0.2)",
      fieldFocusRing: "0 0 0 2px hsl(var(--primary) / 0.55)",
      dropdownShadow:
        "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      modalShadow:
        "0 0 0 1px var(--quiet-ring), 0 10px 15px -3px rgb(0 0 0 / 0.12), 0 4px 6px -4px rgb(0 0 0 / 0.12)",
      scrim: "rgb(0 0 0 / 0.4)",
    },
    dark: {
      buttonShadow: "0 1px 3px rgb(0 0 0 / 0.2)",
      buttonDangerShadow: "0 1px 3px rgb(0 0 0 / 0.2)",
      buttonNeutralShadow: "0 1px 3px rgb(0 0 0 / 0.2)",
      fieldFocusRing: "0 0 0 2px hsl(var(--primary) / 0.55)",
      dropdownShadow:
        "0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)",
      modalShadow:
        "0 0 0 1px var(--quiet-ring), 0 10px 15px -3px rgb(0 0 0 / 0.35), 0 4px 6px -4px rgb(0 0 0 / 0.35)",
      scrim: "rgb(0 0 0 / 0.6)",
    },
  },
}
