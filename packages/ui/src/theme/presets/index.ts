import { defaultPreset } from "./default/default"
import { glassmorphism } from "./glassmorphism/glassmorphism"

export const presets = {
  default: defaultPreset,
  glassmorphism,
} as const

export type PresetName = keyof typeof presets
export const PRESET_NAMES = Object.keys(presets) as PresetName[]

export type {
  AxisDefinition,
  CommonAxisInput,
  PresetSurfaceRecipe,
  ThemePreset,
} from "./types"
