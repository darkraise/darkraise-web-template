/**
 * What darkraise-ui 6.9.6 could leave in storage and in a synced payload,
 * read from tag v6.9.6. Test-only: the legacy table's input.
 */

const ACCENTS = [
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

// 6.9.6 offered every accent as a surface colour after its twelve neutrals.
const SURFACES = [
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
  ...ACCENTS,
] as const

const MODES = ["light", "dark", "system"] as const
const PRESETS = ["default", "glass", "scifi"] as const
const BACKGROUND_STYLES = ["solid", "gradient"] as const
const BACKGROUND_INTENSITIES = [
  "neutral",
  "subtle",
  "balanced",
  "vivid",
  "intense",
] as const
const GRADIENT_PATTERNS = ["blobs", "aurora", "spotlight", "mesh"] as const
const DENSITIES = ["compact", "cozy", "comfortable", "spacious"] as const
const ELEVATIONS = ["flat", "low", "medium", "high"] as const
const SURFACE_INTENSITIES = ["flat", "subtle", "balanced", "bold"] as const
const RADII = ["sharp", "subtle", "rounded", "pill"] as const
const FONT_SIZES = ["small", "medium", "large", "extra-large"] as const
const ACCENT_INTENSITIES = ["calm", "balanced", "vivid", "intense"] as const
const CONTROL_DEPTHS = ["flush", "subtle", "recessed", "deep"] as const
const GLOW_LEVELS = ["none", "subtle", "balanced", "vivid"] as const
const SHELL_STYLES = [
  "classic",
  "inset",
  "island",
  "floating",
  "framed",
  "flat",
] as const
const SIDEBAR_ACTIVE_BARS = ["default", "bar", "ring", "both"] as const
const GLASS_OPACITIES = ["subtle", "medium", "strong"] as const
const GLASS_BLURS = ["none", "low", "medium", "high"] as const

/** Every storage key 6.9.6 could write, with every value it could hold. */
export const V696_KEYS: Readonly<Record<string, readonly string[]>> = {
  mode: MODES,
  "theme-accent": ACCENTS,
  "theme-surface-color": SURFACES,
  "theme-preset": PRESETS,
  "theme-bg-style": BACKGROUND_STYLES,
  "theme-bg-intensity": BACKGROUND_INTENSITIES,
  "theme-gradient-pattern": GRADIENT_PATTERNS,
  "theme-density": DENSITIES,
  "theme-elevation": ELEVATIONS,
  "theme-button-elevation": ELEVATIONS,
  "theme-surface-intensity": SURFACE_INTENSITIES,
  "theme-radius": RADII,
  "theme-font-size": FONT_SIZES,
  "theme-accent-intensity": ACCENT_INTENSITIES,
  "theme-control-depth": CONTROL_DEPTHS,
  "theme-outer-glow": GLOW_LEVELS,
  "theme-inner-glow": GLOW_LEVELS,
  "theme-shell-style": SHELL_STYLES,
  "theme-sidebar-active-bar": SIDEBAR_ACTIVE_BARS,
  "theme-glass-opacity": GLASS_OPACITIES,
  "theme-glass-blur": GLASS_BLURS,
  "theme-scifi-frame": ["clean", "notched", "bracketed"],
  "layout-variant": ["sidebar", "top-nav", "stacked", "split-panel"],
}

/**
 * Every field a 6.9.6 synced payload could carry. Each save sent every field
 * but the glow pair, which rode along only on the save its own setter made.
 * `presetAxisValues` is an object keyed by preset, then axis, with the
 * `theme-<preset>-<axis>` values above.
 */
export const V696_PAYLOAD_FIELDS: Readonly<Record<string, readonly string[]>> =
  {
    accentColor: ACCENTS,
    surfaceColor: SURFACES,
    preset: PRESETS,
    backgroundStyle: BACKGROUND_STYLES,
    backgroundIntensity: BACKGROUND_INTENSITIES,
    gradientPattern: GRADIENT_PATTERNS,
    mode: MODES,
    density: DENSITIES,
    elevation: ELEVATIONS,
    buttonElevation: ELEVATIONS,
    surfaceIntensity: SURFACE_INTENSITIES,
    radius: RADII,
    shellStyle: SHELL_STYLES,
    sidebarActiveBar: SIDEBAR_ACTIVE_BARS,
    fontSize: FONT_SIZES,
    accentIntensity: ACCENT_INTENSITIES,
    controlDepth: CONTROL_DEPTHS,
    outerGlow: GLOW_LEVELS,
    innerGlow: GLOW_LEVELS,
    presetAxisValues: ["*"],
  }

/**
 * Keys only kits before 6.9.6 wrote. 6.9.6 migrated them on load, but a
 * browser that went from an older kit straight to 7.0 still holds them.
 */
export const PRE_V696_KEYS: Readonly<Record<string, readonly string[]>> = {
  "theme-preset": ["glassmorphism"],
  "theme-glassmorphism-opacity": GLASS_OPACITIES,
  "theme-glassmorphism-blur": GLASS_BLURS,
  "theme-canvas-tint": ["neutral", "subtle", "balanced", "vivid"],
  "theme-glass-halo": ["none", "soft", "pronounced"],
  "theme-scifi-intensity": ["dim", "normal", "bright", "intense"],
  "theme-accent-vibrancy": ACCENT_INTENSITIES,
}

/**
 * Payload fields only older kits sent: the pre-rename preset name (dev builds
 * before 6.0) and the accent axis under its 6.0-6.2 name.
 */
export const PRE_V696_PAYLOAD_FIELDS: Readonly<
  Record<string, readonly string[]>
> = {
  preset: ["glassmorphism"],
  accentVibrancy: ACCENT_INTENSITIES,
}
