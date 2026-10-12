import type { PresetDefinition } from "../../../config/schema"

/**
 * Card Stock: paper sheets on a warm desk under a muted navy, with serif
 * titles and tight corners. The navy carries about half the blue ramp's
 * chroma, which only dark mode can calm. Geist stands in for Figtree and
 * Newsreader for Fraunces.
 */
export const cardStock: PresetDefinition = {
  label: "Card Stock",
  style: "tactile",
  shellStyle: "inset",
  axes: {
    accentColor: "blue",
    surfaceColor: "sand",
    tintWithAccent: "off",
    signalColor: "none",
    font: "geist",
    headingFont: "newsreader",
    radius: "subtle",
    darkAccentChroma: "calm",
  },
}
