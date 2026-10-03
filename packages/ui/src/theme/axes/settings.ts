import { PRESET_NAMES, presets } from "@theme/presets"
import type { ThemeSettings } from "@theme/types"
import {
  AXES,
  AXIS_KEYS,
  isAxisValue,
  type AxisKey,
  type AxisValues,
} from "./registry"

/** Stamped on every payload the provider emits; 6.x payloads carry none. */
export const THEME_PAYLOAD_VERSION = 7

export type PresetAxisValues = Record<string, Record<string, string>>

type PresetAxisDefinitions = Record<
  string,
  { values: readonly string[]; default: string }
>

function axesOf(preset: string): PresetAxisDefinitions {
  const all = presets as unknown as Record<
    string,
    { axes: PresetAxisDefinitions }
  >
  return all[preset]?.axes ?? {}
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

export function presetAxisStorageKey(preset: string, axis: string): string {
  return `theme-${preset}-${axis}`
}

export function readStoredAxes(
  read: (key: string) => string | null,
): Partial<AxisValues> {
  const out: Partial<Record<AxisKey, string>> = {}
  for (const key of AXIS_KEYS) {
    const value = read(AXES[key].storageKey)
    if (isAxisValue(key, value)) out[key] = value
  }
  return out as Partial<AxisValues>
}

export function completePresetAxisValues(
  partial: PresetAxisValues = {},
): PresetAxisValues {
  const out: PresetAxisValues = {}
  for (const preset of PRESET_NAMES) {
    const axes: Record<string, string> = {}
    for (const [axis, definition] of Object.entries(axesOf(preset))) {
      const value = partial[preset]?.[axis]
      axes[axis] =
        value !== undefined && definition.values.includes(value)
          ? value
          : definition.default
    }
    out[preset] = axes
  }
  return out
}

export function readPresetAxisValues(
  read: (key: string) => string | null,
): PresetAxisValues {
  const partial: PresetAxisValues = {}
  for (const preset of PRESET_NAMES) {
    const axes: Record<string, string> = {}
    for (const axis of Object.keys(axesOf(preset))) {
      const value = read(presetAxisStorageKey(preset, axis))
      if (value !== null) axes[axis] = value
    }
    partial[preset] = axes
  }
  return completePresetAxisValues(partial)
}

/**
 * Keeps only the registry's axes with valid values, and preset axes that the
 * preset still declares. Synced payloads come from another device and may be
 * from an older kit, so nothing in them is trusted.
 */
export function sanitizeSettings(input: unknown): ThemeSettings {
  const source = isRecord(input) ? input : {}
  const out: Record<string, unknown> = {}
  for (const key of AXIS_KEYS) {
    if (isAxisValue(key, source[key])) out[key] = source[key]
  }
  const incoming = source.presetAxisValues
  if (isRecord(incoming)) {
    const kept: PresetAxisValues = {}
    for (const preset of PRESET_NAMES) {
      const values = incoming[preset]
      if (!isRecord(values)) continue
      const axes: Record<string, string> = {}
      for (const [axis, definition] of Object.entries(axesOf(preset))) {
        const value = values[axis]
        if (typeof value === "string" && definition.values.includes(value)) {
          axes[axis] = value
        }
      }
      kept[preset] = axes
    }
    out.presetAxisValues = kept
  }
  return out as ThemeSettings
}
