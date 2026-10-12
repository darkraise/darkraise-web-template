import type { PresetDefinition } from "../../../config/schema"

/**
 * Dusk Haze: an indigo accent whose hue tints the neutrals, in a flat shell
 * with pill controls. Geist stands in for Hanken Grotesk.
 */
export const duskHaze: PresetDefinition = {
  label: "Dusk Haze",
  style: "glass",
  shellStyle: "flat",
  axes: {
    accentColor: "indigo",
    surfaceColor: "sand",
    tintWithAccent: "on",
    signalColor: "none",
    font: "geist",
    headingFont: "body",
    radius: "pill",
  },
}
