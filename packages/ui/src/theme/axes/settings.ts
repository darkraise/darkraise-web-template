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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

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

/**
 * Keeps only the registry's axes with valid values. Synced payloads come from
 * another device and may be from an older kit, so nothing in them is trusted.
 */
export function sanitizeSettings(input: unknown): ThemeSettings {
  const source = isRecord(input) ? input : {}
  const out: Record<string, unknown> = {}
  for (const key of AXIS_KEYS) {
    if (isAxisValue(key, source[key])) out[key] = source[key]
  }
  return out as ThemeSettings
}
