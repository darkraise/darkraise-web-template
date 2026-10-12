import type { PresetDefinition } from "../../../config/schema"

/**
 * Forest & Lime: a lime accent on olive neutrals in a framed shell, with
 * pill controls a step taller than the default. The kit has no heavy
 * display face, so headings stay in the body face.
 */
export const forestLime: PresetDefinition = {
  label: "Forest & Lime",
  style: "flat",
  shellStyle: "framed",
  axes: {
    accentColor: "lime",
    surfaceColor: "olive",
    tintWithAccent: "off",
    signalColor: "none",
    font: "inter",
    headingFont: "body",
    radius: "pill",
    density: "comfortable",
  },
}
