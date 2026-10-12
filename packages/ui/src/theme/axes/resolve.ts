import type { ThemeRegistry } from "../config/registry"
import { AXIS_KEYS, type AxisKey, type AxisValues } from "./registry"

const belongs = (
  registry: ThemeRegistry,
  style: string,
  preset: string | undefined,
): preset is string =>
  preset !== undefined && registry.presetFor(style, preset) === preset

/**
 * The value each axis paints with. Mode and style resolve first, then the
 * preset, which must belong to the style, then every other axis: the user's
 * own value, else the preset's, else the style's default (inherited through
 * `extends`), else the config default. An axis the user never set stays
 * absent from `stored`, which is what lets a preset or style value apply.
 */
export function effectiveSettings(
  stored: Partial<AxisValues>,
  defaults: AxisValues,
  registry: ThemeRegistry,
): AxisValues {
  const style = registry.isValue("style", stored.style)
    ? stored.style
    : defaults.style
  const preset = belongs(registry, style, stored.preset)
    ? stored.preset
    : belongs(registry, style, defaults.preset)
      ? defaults.preset
      : "base"
  const presetAxes: Partial<Record<AxisKey, string>> =
    registry.presets[preset]?.axes ?? {}
  const styleDefaults: Partial<Record<AxisKey, string>> =
    registry.styles[style]?.defaults ?? {}
  const out = {} as Record<AxisKey, string>
  for (const key of AXIS_KEYS) {
    out[key] =
      stored[key] ?? presetAxes[key] ?? styleDefaults[key] ?? defaults[key]
  }
  out.style = style
  out.preset = preset
  return out as AxisValues
}

/**
 * The axes on which the user's own value hides one the active preset or
 * style sets: the preset's `axes` and the style's defaults, its own and
 * inherited. No definition can set mode, style or preset, so they are
 * never among them.
 */
export function presetOverrides(
  stored: Partial<AxisValues>,
  defaults: AxisValues,
  registry: ThemeRegistry,
): AxisKey[] {
  const { style, preset } = effectiveSettings(stored, defaults, registry)
  const set: Partial<Record<AxisKey, string>> = {
    ...registry.styles[style]?.defaults,
    ...registry.presets[preset]?.axes,
  }
  return AXIS_KEYS.filter(
    (key) => stored[key] !== undefined && set[key] !== undefined,
  )
}

/**
 * The stored values after the user picks `value` for `key`. A preset other
 * than `base` brings its style along; a new style starts from its base.
 */
export function applyAxisChange(
  stored: Partial<AxisValues>,
  key: AxisKey,
  value: string,
  registry: ThemeRegistry,
): Partial<AxisValues> {
  if (key === "style") return { ...stored, style: value, preset: "base" }
  const next: Partial<Record<AxisKey, string>> = { ...stored, [key]: value }
  if (key === "preset") {
    const style = registry.presets[value]?.style
    if (style !== undefined) next.style = style
  }
  return next as Partial<AxisValues>
}
