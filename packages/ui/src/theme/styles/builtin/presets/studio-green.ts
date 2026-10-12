import type { PresetDefinition } from "../../../config/schema"

/**
 * Studio Green: an emerald accent on pure greys, with Inter for the body.
 * Geist stands in for Manrope on headings.
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
}
