import type { PresetDefinition } from "../../../config/schema"

/**
 * Pastel Soft-Flat: warm cream neutrals under an indigo accent, with pill
 * controls. Geist stands in for Figtree.
 */
export const pastelSoft: PresetDefinition = {
  label: "Pastel Soft-Flat",
  style: "flat",
  shellStyle: "flat",
  axes: {
    accentColor: "indigo",
    surfaceColor: "sand",
    tintWithAccent: "off",
    signalColor: "none",
    font: "geist",
    headingFont: "body",
    radius: "pill",
  },
}
