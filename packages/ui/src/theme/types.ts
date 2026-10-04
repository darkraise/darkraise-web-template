import type {
  AxisKey,
  AxisSetters,
  AxisValue,
  AxisValues,
} from "./axes/registry"

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
  "neutral",
] as const
export type AccentColor = (typeof ACCENT_COLORS)[number]
export type ChromaticAccent = Exclude<AccentColor, "neutral">

// The twelve neutral ramps registered in palettes/surfaceColors.ts. Spelled
// out rather than derived from the registry because that module imports this
// one for ColorScale, and a value-level import back would close a cycle at
// module init. surfaceColors.test.ts keeps the two lists in step.
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

export const ELEVATIONS = ["flat", "standard", "high"] as const
export type Elevation = (typeof ELEVATIONS)[number]

export const RADII = ["sharp", "subtle", "rounded", "pill"] as const
export type Radius = (typeof RADII)[number]

export const CONTRASTS = ["low", "standard", "high"] as const
export type Contrast = (typeof CONTRASTS)[number]

export const DARK_ACCENT_CHROMAS = ["calm", "standard", "vivid"] as const
export type DarkAccentChroma = (typeof DARK_ACCENT_CHROMAS)[number]

/** A string pair rather than a boolean: registry values are strings. */
export const TINT_WITH_ACCENT = ["off", "on"] as const
export type TintWithAccent = (typeof TINT_WITH_ACCENT)[number]

export const FONT_SIZES = ["small", "medium", "large", "extra-large"] as const
export type FontSize = (typeof FONT_SIZES)[number]

export const FONTS = ["inter", "geist", "ibm-plex-sans"] as const
export type Font = (typeof FONTS)[number]

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
 * Indicator drawn on the active sidebar item. `default` marks the row with a
 * tint one step stronger than hover and a bolder label, with no bar, under
 * every style. The other three force a rail, a ring or both.
 */
export const SIDEBAR_ACTIVE_BARS = ["default", "bar", "ring", "both"] as const
export type SidebarActiveBarSetting = (typeof SIDEBAR_ACTIVE_BARS)[number]

/**
 * How the active sidebar row is drawn. `auto` follows the style: Quiet draws
 * a chip, Flat a pill, Tactile a tile and Glass a frosted chip.
 */
export const SIDEBAR_SELECTIONS = [
  "auto",
  "chip",
  "pill",
  "tile",
  "frosted",
] as const
export type SidebarSelectionSetting = (typeof SIDEBAR_SELECTIONS)[number]
/** A look a nav can draw; `auto` is resolved to one of these first. */
export type SidebarSelection = Exclude<SidebarSelectionSetting, "auto">

/**
 * Glow strength. Shared by both glow axes because they are two halves of one
 * effect: `outerGlow` is the halo cast outward, `innerGlow` the rim light bled
 * inward. `none` is the floor, and no style defaults a glow, so the axes ship
 * invisible until the user sets one.
 */
export const GLOW_LEVELS = ["none", "subtle", "balanced", "vivid"] as const
export type GlowLevel = (typeof GLOW_LEVELS)[number]

/** How much of the canvas Glass's frosted chrome lets through. */
export const GLASS_OPACITIES = ["subtle", "medium", "strong"] as const
export type GlassOpacity = (typeof GLASS_OPACITIES)[number]

/** Backdrop blur behind Glass's frosted chrome. */
export const GLASS_BLURS = ["none", "low", "medium", "high"] as const
export type GlassBlur = (typeof GLASS_BLURS)[number]

export const MODES = ["light", "dark", "system"] as const
export type Mode = (typeof MODES)[number]

export type ResolvedMode = "light" | "dark"

export type ColorScale = Record<
  50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950,
  string
>

/**
 * A stored or synced theme. Every axis is optional: an absent axis is one the
 * user never set, so the active style's or the config's default applies.
 */
export type ThemeSettings = Partial<AxisValues> & {
  /**
   * Payload format, set on every payload the provider emits. A loaded payload
   * without it came from a 6.x kit and is migrated before it is applied.
   */
  version?: number
}

export interface ThemePersistenceAdapter {
  load(): Promise<ThemeSettings | null>
  /**
   * `signal` aborts when the provider gives up on the save after 15 seconds.
   * An adapter that ignores it may land a timed-out save after a newer one.
   */
  save(
    settings: ThemeSettings,
    options?: { signal: AbortSignal },
  ): Promise<void>
}

export type ThemeSyncStatus = "idle" | "loading" | "saving" | "error"

export interface ThemeContextValue extends AxisValues, AxisSetters {
  resolvedMode: ResolvedMode
  config: import("./themeConfig").ThemeConfig
  syncStatus: ThemeSyncStatus
  /** Sets any axis by key; the named setters are shorthands for it. */
  setAxis: <K extends AxisKey>(key: K, value: AxisValue<K>) => void
}
