import type { PresetDefinition } from "../../../config/schema"

/**
 * Milk Glass: a deep orange on cool neutrals in a flat shell. Coral is the
 * nearest ramp: the orange ramp's light fill is a bright one under a dark
 * label. Geist stands in for Plus Jakarta Sans.
 */
export const milkGlass: PresetDefinition = {
  label: "Milk Glass",
  style: "glass",
  shellStyle: "flat",
  axes: {
    accentColor: "coral",
    surfaceColor: "cool",
    tintWithAccent: "off",
    signalColor: "none",
    font: "geist",
    headingFont: "body",
  },
}
