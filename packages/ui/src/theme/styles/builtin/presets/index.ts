import type { PresetDefinition } from "../../../config/schema"
import { auroraNight } from "./aurora-night"
import { braunPanel } from "./braun-panel"
import { cardStock } from "./card-stock"
import { coralSpace } from "./coral-space"
import { darkInstrument } from "./dark-instrument"
import { duskHaze } from "./dusk-haze"
import { forestLime } from "./forest-lime"
import { linenTeal } from "./linen-teal"
import { micaDesk } from "./mica-desk"
import { milkGlass } from "./milk-glass"
import { paperInk } from "./paper-ink"
import { pastelSoft } from "./pastel-soft"
import { redGraphite } from "./red-graphite"
import { smokedObsidian } from "./smoked-obsidian"
import { studioGreen } from "./studio-green"

/** Grouped by style: Quiet's four, Flat's two, Tactile's three, Glass's six. */
export const PRESET_NAMES = [
  "paper-ink",
  "linen-teal",
  "red-graphite",
  "studio-green",
  "pastel-soft",
  "forest-lime",
  "braun-panel",
  "dark-instrument",
  "card-stock",
  "mica-desk",
  "smoked-obsidian",
  "milk-glass",
  "aurora-night",
  "coral-space",
  "dusk-haze",
] as const

export type PresetName = (typeof PRESET_NAMES)[number]

/** Keyed in `PRESET_NAMES` order, which is the order the registry lists them. */
export const BUILTIN_PRESETS: Readonly<Record<PresetName, PresetDefinition>> = {
  "paper-ink": paperInk,
  "linen-teal": linenTeal,
  "red-graphite": redGraphite,
  "studio-green": studioGreen,
  "pastel-soft": pastelSoft,
  "forest-lime": forestLime,
  "braun-panel": braunPanel,
  "dark-instrument": darkInstrument,
  "card-stock": cardStock,
  "mica-desk": micaDesk,
  "smoked-obsidian": smokedObsidian,
  "milk-glass": milkGlass,
  "aurora-night": auroraNight,
  "coral-space": coralSpace,
  "dusk-haze": duskHaze,
}
