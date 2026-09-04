import type { PresetName, ThemePreset } from "@theme/presets"

export const ACCENT_COLORS = [
  "red",
  "coral",
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

// The twelve neutral ramps registered in palettes/surfaceColors.ts, then every
// accent. Spelled out rather than derived from the registry because that module
// imports this one for ColorScale, and a value-level import back would close a
// cycle at module init. surfaceColors.test.ts keeps the two lists in step.
export const SURFACE_COLORS = [
  "slate",
  "gray",
  "cool",
  "zinc",
  "neutral",
  "iron",
  "mauve",
  "graphite",
  "stone",
  "sand",
  "olive",
  "sepia",
  ...ACCENT_COLORS,
] as const
export type SurfaceColor = (typeof SURFACE_COLORS)[number]

export const BACKGROUND_STYLES = ["solid", "gradient"] as const
export type BackgroundStyle = (typeof BACKGROUND_STYLES)[number]

export const BACKGROUND_INTENSITIES = [
  "neutral",
  "subtle",
  "balanced",
  "vivid",
  "intense",
] as const
export type BackgroundIntensity = (typeof BACKGROUND_INTENSITIES)[number]

export const GRADIENT_PATTERNS = [
  "blobs",
  "aurora",
  "spotlight",
  "mesh",
] as const
export type GradientPattern = (typeof GRADIENT_PATTERNS)[number]

export const DENSITIES = ["compact", "cozy", "comfortable", "spacious"] as const
export type Density = (typeof DENSITIES)[number]

export const ELEVATIONS = ["flat", "low", "medium", "high"] as const
export type Elevation = (typeof ELEVATIONS)[number]

export const SURFACE_INTENSITIES = [
  "flat",
  "subtle",
  "balanced",
  "bold",
] as const
export type SurfaceIntensity = (typeof SURFACE_INTENSITIES)[number]

export const RADII = ["sharp", "subtle", "rounded", "pill"] as const
export type Radius = (typeof RADII)[number]

export const FONT_SIZES = ["small", "medium", "large", "extra-large"] as const
export type FontSize = (typeof FONT_SIZES)[number]

/**
 * Chrome treatment of the app shell, orthogonal to which structure is in
 * use. `classic` is the welded, hairline-ruled look the package shipped
 * before this axis existed.
 */
export const SHELL_STYLES = [
  "classic",
  "inset",
  "island",
  "floating",
  "framed",
  "flat",
] as const
export type ShellStyle = (typeof SHELL_STYLES)[number]

/**
 * Indicator drawn beside the active sidebar item. `default` leaves each
 * preset's own look alone, which is what the sidebar did before this became
 * a theme axis; the other three force one look everywhere.
 */
export const SIDEBAR_ACTIVE_BARS = ["default", "bar", "ring", "both"] as const
export type SidebarActiveBarSetting = (typeof SIDEBAR_ACTIVE_BARS)[number]

/**
 * How far a form control recesses below the surface that contains it. Only
 * meaningful inside a raised surface: a control sitting on the bare page
 * canvas keeps the raised rung at every step, because recessing it there
 * would sink it into the background rather than into a container.
 */
export const CONTROL_DEPTHS = ["flush", "subtle", "recessed", "deep"] as const
export type ControlDepth = (typeof CONTROL_DEPTHS)[number]

export const ACCENT_INTENSITIES = [
  "calm",
  "balanced",
  "vivid",
  "intense",
] as const
export type AccentIntensity = (typeof ACCENT_INTENSITIES)[number]

/**
 * Glow strength. Shared by both glow axes because they are two halves of one
 * effect: `outerGlow` is the halo cast outward, `innerGlow` the rim light bled
 * inward. `none` is the floor so the axes ship invisible on the Default preset
 * — presets that own a glow declare their own default via `commonAxisDefaults`.
 */
export const GLOW_LEVELS = ["none", "subtle", "balanced", "vivid"] as const
export type GlowLevel = (typeof GLOW_LEVELS)[number]

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
  /** How loud the gradient blob overlays are; only meaningful when
   *  backgroundStyle === "gradient". Defaults to "balanced". */
  backgroundIntensity?: BackgroundIntensity
  /** Which gradient shape the page paints; only meaningful when
   *  backgroundStyle === "gradient". Defaults to "blobs". */
  gradientPattern?: GradientPattern
  mode: Mode
  density?: Density
  elevation?: Elevation
  buttonElevation?: Elevation
  surfaceIntensity?: SurfaceIntensity
  radius?: Radius
  fontSize?: FontSize
  /** How loud the accent reads in dark mode; ignored in light. Defaults to
   *  "balanced". */
  accentIntensity?: AccentIntensity
  /** How deep form controls sit inside a raised surface. Defaults to
   *  "recessed". */
  controlDepth?: ControlDepth
  outerGlow?: GlowLevel
  innerGlow?: GlowLevel
  shellStyle?: ShellStyle
  sidebarActiveBar?: SidebarActiveBarSetting
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
  backgroundIntensity: BackgroundIntensity
  gradientPattern: GradientPattern
  mode: Mode
  density: Density
  elevation: Elevation
  buttonElevation: Elevation
  surfaceIntensity: SurfaceIntensity
  radius: Radius
  shellStyle: ShellStyle
  sidebarActiveBar: SidebarActiveBarSetting
  fontSize: FontSize
  accentIntensity: AccentIntensity
  controlDepth: ControlDepth
  outerGlow: GlowLevel
  innerGlow: GlowLevel
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
  setBackgroundIntensity: (intensity: BackgroundIntensity) => void
  setGradientPattern: (pattern: GradientPattern) => void
  setMode: (mode: Mode) => void
  setDensity: (density: Density) => void
  setElevation: (elevation: Elevation) => void
  setButtonElevation: (elevation: Elevation) => void
  setSurfaceIntensity: (intensity: SurfaceIntensity) => void
  setRadius: (radius: Radius) => void
  setShellStyle: (style: ShellStyle) => void
  setSidebarActiveBar: (value: SidebarActiveBarSetting) => void
  setFontSize: (size: FontSize) => void
  setAccentIntensity: (intensity: AccentIntensity) => void
  setControlDepth: (depth: ControlDepth) => void
  setOuterGlow: (level: GlowLevel) => void
  setInnerGlow: (level: GlowLevel) => void
  /**
   * Update one preset-specific axis on the active preset. No-ops with a
   * console.warn (dev-only) when the axis is not valid for the active preset.
   */
  setPresetAxis: (axisName: string, value: string) => void
}
