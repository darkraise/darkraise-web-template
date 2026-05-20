import { defaultPreset } from "./default/default"

export const presets = {
  default: defaultPreset,
} as const

export type PresetName = keyof typeof presets
export const PRESET_NAMES = Object.keys(presets) as PresetName[]

export type {
  AxisDefinition,
  CommonAxisInput,
  PresetSurfaceRecipe,
  ThemePreset,
} from "./types"
