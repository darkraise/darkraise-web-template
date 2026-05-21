import { defaultPreset } from "./default/default"
import { glass } from "./glass/glass"
import { neon } from "./neon/neon"

export const presets = {
  default: defaultPreset,
  glass,
  neon,
} as const

export type PresetName = keyof typeof presets
export const PRESET_NAMES = Object.keys(presets) as PresetName[]

export type {
  AxisDefinition,
  CommonAxisInput,
  PresetSurfaceRecipe,
  ThemePreset,
} from "./types"
