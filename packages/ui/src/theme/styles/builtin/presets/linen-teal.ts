import type { PresetDefinition } from "../../../config/schema"

/**
 * Linen & Teal: near-white neutrals under a deep teal, which sits between
 * the teal and cyan ramps; cyan is the nearer. Geist stands in for Hanken
 * Grotesk.
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
}
