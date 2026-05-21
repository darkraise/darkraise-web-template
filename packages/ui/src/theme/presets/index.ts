import { defaultPreset } from "./default/default"
import { glassmorphism } from "./glassmorphism/glassmorphism"
import { neon } from "./neon/neon"

export const presets = {
  default: defaultPreset,
  glassmorphism,
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
