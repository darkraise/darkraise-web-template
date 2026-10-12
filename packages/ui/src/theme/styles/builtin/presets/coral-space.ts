import type { PresetDefinition } from "../../../config/schema"

/**
 * Coral Space: a rose accent whose hue tints the neutrals, in an inset
 * shell. The dark accent is calmed towards the direction's dusty rose.
 * Inter stands in for the system UI face.
 */
export const coralSpace: PresetDefinition = {
  label: "Coral Space",
  style: "glass",
  shellStyle: "inset",
  axes: {
    accentColor: "rose",
    surfaceColor: "olive",
    tintWithAccent: "on",
    signalColor: "none",
    font: "inter",
    headingFont: "body",
    darkAccentChroma: "calm",
  },
}
