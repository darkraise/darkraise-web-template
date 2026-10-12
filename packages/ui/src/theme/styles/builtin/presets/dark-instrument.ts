import type { PresetDefinition } from "../../../config/schema"

/**
 * Dark Instrument: an orange accent on blue-black graphite, set in IBM Plex
 * Sans. Coral is the nearest ramp to the direction's deep orange: the orange
 * ramp's light fill is a bright one under a dark label.
 */
export const darkInstrument: PresetDefinition = {
  label: "Dark Instrument",
  style: "tactile",
  axes: {
    accentColor: "coral",
    surfaceColor: "graphite",
    tintWithAccent: "off",
    signalColor: "none",
    font: "ibm-plex-sans",
    headingFont: "body",
  },
}
