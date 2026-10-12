import type { PresetDefinition } from "../../../config/schema"

/**
 * Smoked Obsidian: a warm amber on pure greys, in the classic shell the
 * layout already defaults to. The dark accent is calmed to the direction's
 * brass. Geist stands in for Manrope.
 */
export const smokedObsidian: PresetDefinition = {
  label: "Smoked Obsidian",
  style: "glass",
  axes: {
    accentColor: "amber",
    surfaceColor: "neutral",
    tintWithAccent: "off",
    signalColor: "none",
    font: "geist",
    headingFont: "body",
    darkAccentChroma: "calm",
  },
}
