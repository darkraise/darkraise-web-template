import type { PresetDefinition } from "../../../config/schema"

/**
 * Red Graphite: a red accent on cool graphite greys, in the classic shell
 * the layout already defaults to. Geist stands in for Nunito Sans.
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
}
