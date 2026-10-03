import {
  AXES,
  AXIS_KEYS,
  isAxisValue,
  type AxisKey,
  type AxisValues,
} from "./axes/registry"

declare const process: { env: { NODE_ENV?: string } }

export interface ThemeConfig {
  /** Default per axis; an axis left out takes the registry default. */
  defaults: Partial<AxisValues>
  switcher: {
    enabled: boolean
    /** `false` hides an axis's control; an axis left out is shown. */
    axes?: Partial<Record<AxisKey, boolean>>
    /** `false` removes the Advanced part of the switcher. */
    advanced?: boolean
  }
}

export const themeConfig: ThemeConfig = {
  defaults: {},
  switcher: { enabled: true },
}

const REMOVED_DEFAULTS = new Map<string, string | null>([
  ["surfaceIntensity", "contrast"],
  ["borderIntensity", "contrast"],
  ["accentIntensity", "darkAccentChroma"],
  ["controlDepth", null],
  ["buttonElevation", null],
  ["shellStyle", "the layout's defaultShellStyle prop"],
  ["preset", "style"],
])

const REMOVED_SWITCHER_AXES = new Map<string, string | null>([
  ...REMOVED_DEFAULTS,
  ["presetAxes", null],
])

function removedKeyWarnings(
  path: string,
  record: object | undefined,
  removed: ReadonlyMap<string, string | null>,
): string[] {
  return Object.keys(record ?? {})
    .filter((key) => removed.has(key))
    .map((key) => {
      const replacement = removed.get(key)
      return replacement
        ? `[ThemeProvider] themeConfig.${path}.${key} was removed; use ${replacement} instead. The key is ignored.`
        : `[ThemeProvider] themeConfig.${path}.${key} was removed and has no replacement. The key is ignored.`
    })
}

// Keyed by the config's JSON: a provider re-rendered with an equal inline
// config, or rendered twice by StrictMode, must not repeat its warnings.
const checkedConfigs = new Set<string>()

/**
 * Every axis's default: the config's value when it is one of the axis's
 * values, else the registry's. Outside production it warns, once per distinct
 * config content, about each removed key and each invalid value; both are
 * ignored.
 */
export function resolveDefaults(config: ThemeConfig): AxisValues {
  const given: Readonly<Record<string, unknown>> = config.defaults
  const resolved = {} as Record<AxisKey, string>
  const invalid: string[] = []
  for (const key of AXIS_KEYS) {
    const value = given[key]
    if (isAxisValue(key, value)) {
      resolved[key] = value
      continue
    }
    resolved[key] = AXES[key].default
    if (value !== undefined) {
      invalid.push(
        `[ThemeProvider] themeConfig.defaults.${key} "${String(value)}" is not a valid ${key} (expected one of: ${AXES[key].values.join(", ")}); using "${AXES[key].default}".`,
      )
    }
  }

  if (process.env.NODE_ENV !== "production") {
    const content = JSON.stringify(config)
    if (!checkedConfigs.has(content)) {
      checkedConfigs.add(content)
      const warnings = [
        ...removedKeyWarnings("defaults", config.defaults, REMOVED_DEFAULTS),
        ...removedKeyWarnings(
          "switcher.axes",
          config.switcher.axes,
          REMOVED_SWITCHER_AXES,
        ),
        ...invalid,
      ]
      for (const message of warnings) console.warn(message)
    }
  }

  return resolved as AxisValues
}
