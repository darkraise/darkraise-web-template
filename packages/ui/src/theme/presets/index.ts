import { defaultPreset } from "./default/default"
import { glass } from "./glass/glass"
import { neon } from "./neon/neon"
import { terminal } from "./terminal/terminal"
import { brutalist } from "./brutalist/brutalist"
import { playful } from "./playful/playful"

export const presets = {
  default: defaultPreset,
  glass,
  neon,
  terminal,
  brutalist,
  playful,
} as const

export type PresetName = keyof typeof presets
export const PRESET_NAMES = Object.keys(presets) as PresetName[]

export type {
  AxisDefinition,
  CommonAxisInput,
  PresetSurfaceRecipe,
  ThemePreset,
} from "./types"
