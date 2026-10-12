import type { PresetDefinition } from "../../../config/schema"

/** Aurora Night: a teal accent on blue-tinted greys in a flat shell, set in Geist. */
export const auroraNight: PresetDefinition = {
  label: "Aurora Night",
  style: "glass",
  shellStyle: "flat",
  axes: {
    accentColor: "teal",
    surfaceColor: "gray",
    tintWithAccent: "off",
    signalColor: "none",
    font: "geist",
    headingFont: "body",
  },
}
