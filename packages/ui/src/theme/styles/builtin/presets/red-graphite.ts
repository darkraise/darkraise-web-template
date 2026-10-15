import type { PresetDefinition } from "../../../config/schema"

/**
 * Red Graphite: a red accent on cool graphite greys, in the classic shell
 * the layout already defaults to. Geist stands in for Nunito Sans.
 *
 * A graphite rail stands beside a workspace whose top bar is the page
 * itself. The accent marks rather than fills: the current nav row is a
 * neutral lift, a selected table row and a banner carry a 3px stripe on a
 * grey fill, and tags are grey chips. Fields are grey wells with no
 * border, and titles and figures are set bold.
 *
 * The neutral button is clear in light, because Quiet's card fill would put
 * a white search trigger under the rail's light ink.
 */
export const redGraphite: PresetDefinition = {
  label: "Red Graphite",
  style: "quiet",
  axes: {
    accentColor: "red",
    surfaceColor: "zinc",
    tintWithAccent: "off",
    signalColor: "none",
    font: "geist",
    headingFont: "body",
  },
  signatures: {
    navSelection: "pill",
    navMarker: "none",
    railTone: "inverse",
    barTone: "page",
    tooltipTone: "inverse",
    labelCase: "none",
    bannerMark: "rule",
    badgeStyle: "chip",
    fieldBorder: "none",
    rowSelection: "stripe",
    dialogHeader: "plain",
    avatarShape: "round",
    switchStyle: "marked",
    tabStyle: "outline",
    sliderStyle: "bar",
  },
  tokens: {
    shared: {
      thumbShadow: "0 1px 2px rgb(0 0 0 / 0.25)",
      selectedViewShadow: "0 1px 2px rgb(0 0 0 / 0.1)",
      cardRadius: "calc(var(--radius) + 2px)",
      badgeRadius: "calc(var(--radius-control) * 2)",
      bannerRadius: "calc(var(--radius) - 2px)",
      bannerFill: "hsl(var(--muted))",
      pageTitleWeight: "700",
      pageTitleTracking: "-0.01em",
      sectionTitleWeight: "700",
      dialogTitleWeight: "700",
      figureWeight: "700",
    },
    light: {
      buttonNeutralFill: "transparent",
      dropdownShadow: "0 8px 24px rgb(0 0 0 / 0.12)",
      modalShadow: "0 0 0 1px var(--quiet-ring), 0 13px 34px rgb(0 0 0 / 0.18)",
    },
    dark: {
      dropdownShadow: "0 8px 24px rgb(0 0 0 / 0.45)",
      modalShadow: "0 0 0 1px var(--quiet-ring), 0 13px 34px rgb(0 0 0 / 0.55)",
    },
  },
}
