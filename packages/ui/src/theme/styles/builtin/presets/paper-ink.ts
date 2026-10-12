import type { PresetDefinition } from "../../../config/schema"

/**
 * Paper & Ink: warm paper under an ink navy, with serif titles. The navy
 * carries about half the blue ramp's chroma, which only dark mode can calm.
 * Geist stands in for Instrument Sans.
 */
export const paperInk: PresetDefinition = {
  label: "Paper & Ink",
  style: "quiet",
  shellStyle: "flat",
  axes: {
    accentColor: "blue",
    surfaceColor: "sand",
    tintWithAccent: "off",
    signalColor: "none",
    font: "geist",
    headingFont: "newsreader",
    darkAccentChroma: "calm",
  },
}
