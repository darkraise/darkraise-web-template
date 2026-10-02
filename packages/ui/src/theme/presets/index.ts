import { defaultPreset } from "./default/default"
import { glass } from "./glass/glass"

export const presets = {
  default: defaultPreset,
  glass,
} as const

export type PresetName = keyof typeof presets
export const PRESET_NAMES = Object.keys(presets) as PresetName[]

export type { AxisDefinition, CommonAxisInput, ThemePreset } from "./types"
