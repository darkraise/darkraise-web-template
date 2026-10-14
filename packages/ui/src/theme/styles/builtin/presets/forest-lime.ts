import type { PresetDefinition } from "../../../config/schema"

/**
 * Forest & Lime: the rail and the bar are one frame in the accent's deep
 * green around white content, with lime pill buttons a step taller than the
 * default, ringed white fields and hairline cards. The frame's seams and
 * ring take its own fill, so it reads as one piece. In dark the content
 * stands on the accent's deepest step. The kit has no heavy display face,
 * so the page title is the body face at its heaviest.
 */
export const forestLime: PresetDefinition = {
  label: "Forest & Lime",
  style: "flat",
  shellStyle: "framed",
  axes: {
    accentColor: "lime",
    surfaceColor: "olive",
    tintWithAccent: "off",
    signalColor: "none",
    font: "inter",
    headingFont: "body",
    radius: "pill",
    density: "comfortable",
  },
  signatures: {
    railTone: "accent",
    barTone: "accent",
    navSelection: "tint",
    menuHighlight: "neutral",
    labelCase: "auto",
    fieldFill: "surface",
    fieldBorder: "box",
    dialogHeader: "plain",
    iconButton: "round",
    switchStyle: "track",
    tabStyle: "pill",
  },
  tokens: {
    shared: {
      shellGroundFill: "hsl(var(--card))",
      shellShadow: "0 0 transparent",
      chromeEdge: "hsl(var(--surface-sidebar))",
      shellFrameEdge: "hsl(var(--surface-sidebar))",
      navItemRadius: "var(--radius-control)",
      cardBorder: "hsl(var(--border))",
      cardRadius: "calc(var(--radius) * 1.5)",
      overlayRadius: "var(--radius)",
      dialogRadius: "calc(var(--radius) * 2)",
      dialogBorder: "transparent",
      menuItemRadius: "calc(var(--radius) * 0.625)",
      bannerRadius: "var(--radius)",
      bannerBorder: "transparent",
      segmentRadius: "var(--radius-control)",
      buttonNeutralFill: "hsl(var(--foreground) / 0.08)",
      buttonWeight: "600",
      scrim: "hsl(var(--foreground) / 0.55)",
      pageTitleWeight: "800",
      pageTitleTracking: "-0.01em",
      sectionTitleTracking: "-0.01em",
      dialogTitleTracking: "-0.01em",
      figureWeight: "800",
    },
    dark: {
      shellGroundFill: "hsl(var(--primary-1))",
      cardBorder: "transparent",
      dialogBorder: "rgb(255 255 255 / 0.2)",
      scrim: "rgb(0 0 0 / 0.7)",
    },
  },
}
