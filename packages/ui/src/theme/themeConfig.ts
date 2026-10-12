import { AXES, AXIS_KEYS, type AxisKey, type AxisValues } from "./axes/registry"
import { resolveRegistry, type ThemeRegistry } from "./config/registry"
import type { ThemeDefinitions } from "./config/schema"

declare const process: { env: { NODE_ENV?: string } }

export interface ThemeConfig extends ThemeDefinitions {
  /** Default per axis; an axis left out takes the registry default. */
  defaults: Partial<AxisValues>
  switcher: {
    enabled: boolean
    /** `false` hides an axis's control; an axis left out is shown. */
    axes?: Partial<Record<AxisKey, boolean>>
    /** `false` removes the Advanced part of the switcher. */
    advanced?: boolean
    /**
     * The presets the Preset control offers beside `base`; left out, it
     * offers every preset of the active style. The active preset is listed
     * even when it is not named here.
     */
    presets?: readonly string[]
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
  ["sidebarActiveBar", "sidebarSelection"],
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

function presetWarning(
  value: unknown,
  style: string,
  registry: ThemeRegistry,
): string {
  const name = String(value)
  // 6.x took a style name here.
  if (registry.styles[name]?.builtIn) {
    return `[ThemeProvider] themeConfig.defaults.preset "${name}" names a style; preset now selects a preset, so use defaults.style. The key is ignored.`
  }
  const owner = registry.presets[name]?.style
  if (owner !== undefined) {
    return `[ThemeProvider] themeConfig.defaults.preset "${name}" belongs to style "${owner}", not "${style}"; using "base".`
  }
  return `[ThemeProvider] themeConfig.defaults.preset "${name}" is not a valid preset (expected one of: ${registry.values("preset").join(", ")}); using "base".`
}

function switcherPresetWarnings(
  config: ThemeConfig,
  registry: ThemeRegistry,
): string[] {
  return (config.switcher.presets ?? [])
    .filter((name) => !registry.isValue("preset", name))
    .map(
      (name) =>
        `[ThemeProvider] themeConfig.switcher.presets "${String(name)}" is not a preset (expected one of: ${registry.values("preset").join(", ")}). The name is ignored.`,
    )
}

/**
 * Every axis's default: the config's value when `registry` accepts it, else
 * the axis registry's. The preset must also belong to the resolved style.
 * Outside production it warns, once per distinct config content, about each
 * removed key, each invalid value and each `switcher.presets` name that is
 * not a preset; all are ignored.
 */
export function resolveDefaults(
  config: ThemeConfig,
  registry: ThemeRegistry = resolveRegistry(config),
): AxisValues {
  const given: Readonly<Record<string, unknown>> = config.defaults
  const resolved = {} as Record<AxisKey, string>
  const invalid: string[] = []
  for (const key of AXIS_KEYS) {
    const value = given[key]
    // The style precedes the preset in AXIS_KEYS, so it is resolved here.
    if (key === "preset") {
      resolved.preset = registry.presetFor(
        resolved.style,
        typeof value === "string" ? value : undefined,
      )
      if (value !== undefined && value !== resolved.preset) {
        invalid.push(presetWarning(value, resolved.style, registry))
      }
      continue
    }
    if (registry.isValue(key, value)) {
      resolved[key] = value
      continue
    }
    resolved[key] = AXES[key].default
    if (value !== undefined) {
      invalid.push(
        `[ThemeProvider] themeConfig.defaults.${key} "${String(value)}" is not a valid ${key} (expected one of: ${registry.values(key).join(", ")}); using "${AXES[key].default}".`,
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
        ...switcherPresetWarnings(config, registry),
      ]
      for (const message of warnings) console.warn(message)
    }
  }

  return resolved as AxisValues
}
