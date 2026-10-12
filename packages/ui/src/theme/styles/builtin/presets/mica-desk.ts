import type { PresetDefinition } from "../../../config/schema"

/**
 * Mica Desk: a system blue on cool greys in an inset shell, with 4px
 * controls. Inter stands in for the system UI face.
 */
export const micaDesk: PresetDefinition = {
  label: "Mica Desk",
  style: "glass",
  shellStyle: "inset",
  axes: {
    accentColor: "blue",
    surfaceColor: "zinc",
    tintWithAccent: "off",
    signalColor: "none",
    font: "inter",
    headingFont: "body",
    radius: "subtle",
  },
}
