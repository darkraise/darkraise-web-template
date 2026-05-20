import type { PresetName, ThemePreset } from "@theme/presets"

export const ACCENT_COLORS = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const
export type AccentColor = (typeof ACCENT_COLORS)[number]

export const SURFACE_COLORS = ["slate", ...ACCENT_COLORS] as const
export type SurfaceColor = (typeof SURFACE_COLORS)[number]

export const BACKGROUND_STYLES = ["solid", "gradient"] as const
export type BackgroundStyle = (typeof BACKGROUND_STYLES)[number]

export const DENSITIES = ["compact", "cozy", "comfortable", "spacious"] as const
export type Density = (typeof DENSITIES)[number]

export const ELEVATIONS = ["flat", "low", "medium", "high"] as const
export type Elevation = (typeof ELEVATIONS)[number]

export const RADII = ["sharp", "subtle", "rounded", "pill"] as const
export type Radius = (typeof RADII)[number]

export const MODES = ["light", "dark", "system"] as const
export type Mode = (typeof MODES)[number]

export type ResolvedMode = "light" | "dark"

export type ColorScale = Record<
  50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950,
  string
>

export interface ThemeSettings {
  accentColor: AccentColor
  surfaceColor: SurfaceColor
  preset: PresetName
  backgroundStyle: BackgroundStyle
  mode: Mode
  density?: Density
  elevation?: Elevation
  buttonElevation?: Elevation
  radius?: Radius
  /** Per-preset axis values; outer key = preset name, inner key = axis name. */
  presetAxisValues?: Record<string, Record<string, string>>
}

export interface ThemePersistenceAdapter {
  load(): Promise<ThemeSettings | null>
  save(settings: ThemeSettings): Promise<void>
}

export type ThemeSyncStatus = "idle" | "loading" | "saving" | "error"

export interface ThemeContextValue {
  accentColor: AccentColor
  surfaceColor: SurfaceColor
  preset: PresetName
  backgroundStyle: BackgroundStyle
  mode: Mode
  density: Density
  elevation: Elevation
  buttonElevation: Elevation
  radius: Radius
  resolvedMode: ResolvedMode
  config: import("./themeConfig").ThemeConfig
  syncStatus: ThemeSyncStatus
  /** Active preset object (config metadata + axes). */
  activePreset: ThemePreset
  /** All preset-axis values, keyed by preset name → axis name → enum value. */
  presetAxisValues: Record<string, Record<string, string>>
  setAccentColor: (color: AccentColor) => void
  setSurfaceColor: (color: SurfaceColor) => void
  setPreset: (preset: PresetName) => void
  setBackgroundStyle: (style: BackgroundStyle) => void
  setMode: (mode: Mode) => void
  setDensity: (density: Density) => void
  setElevation: (elevation: Elevation) => void
  setButtonElevation: (elevation: Elevation) => void
  setRadius: (radius: Radius) => void
  /**
   * Update one preset-specific axis on the active preset. No-ops with a
   * console.warn (dev-only) when the axis is not valid for the active preset.
   */
  setPresetAxis: (axisName: string, value: string) => void
}
