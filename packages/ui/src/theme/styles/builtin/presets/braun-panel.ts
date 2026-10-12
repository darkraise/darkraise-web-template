import type { PresetDefinition } from "../../../config/schema"

/**
 * Braun Panel: a near-black accent on warm greys in a framed shell, with a
 * yellow signal for the lamp marks. Geist stands in for Instrument Sans.
 */
export const braunPanel: PresetDefinition = {
  label: "Braun Panel",
  style: "tactile",
  shellStyle: "framed",
  axes: {
    accentColor: "neutral",
    surfaceColor: "sand",
    tintWithAccent: "off",
    signalColor: "yellow",
    font: "geist",
    headingFont: "body",
  },
}
