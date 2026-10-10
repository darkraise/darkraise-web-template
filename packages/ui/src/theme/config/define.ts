import type { ThemeConfig } from "../themeConfig"
import type { PresetDefinition, StyleDefinition } from "./schema"

export function defineStyle(d: StyleDefinition): StyleDefinition {
  return d
}

export function definePreset(d: PresetDefinition): PresetDefinition {
  return d
}

export function defineThemeConfig<T extends ThemeConfig>(config: T): T {
  return config
}
