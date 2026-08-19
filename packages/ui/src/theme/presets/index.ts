import { defaultPreset } from "./default/default"
import { glass } from "./glass/glass"
import { scifi } from "./scifi/scifi"

export const presets = {
  default: defaultPreset,
  glass,
  scifi,
} as const

export type PresetName = keyof typeof presets
export const PRESET_NAMES = Object.keys(presets) as PresetName[]

export type {
  AxisDefinition,
  CommonAxisInput,
  PresetSurfaceRecipe,
  ThemePreset,
} from "./types"
