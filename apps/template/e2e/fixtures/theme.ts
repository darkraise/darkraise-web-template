export const STYLES = ["flat", "quiet", "tactile", "glass"] as const
export type Style = (typeof STYLES)[number]

/**
 * Styles the per-page matrices (05, 12) run under. Flat and Tactile differ
 * from Quiet only in control shadows, which the kitchen sink baseline and 16
 * check.
 */
export const MATRIX_STYLES = [
  "quiet",
  "glass",
] as const satisfies readonly Style[]

/** Styles the screenshot baseline (18) records every page under. */
export const BASELINE_STYLES = [
  "quiet",
  "glass",
] as const satisfies readonly Style[]

export const GLASS_OPACITIES = ["subtle", "medium", "strong"] as const
export const GLASS_BLURS = ["none", "low", "medium", "high"] as const

export const PRESETS = ["default", "glass"] as const
export type Preset = (typeof PRESETS)[number]

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

// The twelve neutral ramps the kit registers, mirroring SURFACE_COLORS in
// packages/ui/src/theme/types.ts.
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

export const MODES = ["light", "dark", "system"] as const
export const BACKGROUND_STYLES = ["solid", "gradient"] as const
export const BACKGROUND_INTENSITIES = [
  "neutral",
  "subtle",
  "balanced",
  "vivid",
  "intense",
] as const
export const GRADIENT_PATTERNS = [
  "blobs",
  "aurora",
  "spotlight",
  "mesh",
] as const
export const DENSITIES = ["compact", "cozy", "comfortable", "spacious"] as const
export const ELEVATIONS = ["flat", "standard", "high"] as const
export const RADII = ["sharp", "subtle", "rounded", "pill"] as const
export const FONT_SIZES = ["small", "medium", "large", "extra-large"] as const
export const CONTRASTS = ["low", "standard", "high"] as const
export const DARK_ACCENT_CHROMAS = ["calm", "standard", "vivid"] as const
export const TINT_WITH_ACCENT = ["off", "on"] as const

/** Labels the theme switcher renders for each preset. */
export const PRESET_LABELS: Record<Preset, string> = {
  default: "Default",
  glass: "Glass",
}

/** Common axes each preset hides from the switcher (and that its own axes replace). */
export const HIDDEN_COMMON_AXES: Record<Preset, string[]> = {
  default: [],
  glass: [],
}

export interface PresetAxis {
  name: string
  label: string
  values: string[]
  default: string
}

/** Preset-specific axes, keyed by preset. Attribute name is `data-<preset>-<axis>`. */
export const PRESET_AXES: Record<Preset, PresetAxis[]> = {
  default: [],
  glass: [
    {
      name: "opacity",
      label: "Opacity",
      values: ["subtle", "medium", "strong"],
      default: "medium",
    },
    {
      name: "blur",
      label: "Backdrop Blur",
      values: ["none", "low", "medium", "high"],
      default: "medium",
    },
  ],
}

/** localStorage keys the ThemeProvider reads on boot. */
export const LS_KEYS = {
  accent: "theme-accent",
  surface: "theme-surface-color",
  preset: "theme-preset",
  style: "theme-preset",
  glassOpacity: "theme-glass-opacity",
  glassBlur: "theme-glass-blur",
  backgroundStyle: "theme-bg-style",
  backgroundIntensity: "theme-bg-intensity",
  gradientPattern: "theme-gradient-pattern",
  mode: "mode",
  density: "theme-density",
  elevation: "theme-elevation",
  radius: "theme-radius",
  sidebarActiveBar: "theme-sidebar-active-bar",
  fontSize: "theme-font-size",
  contrast: "theme-contrast",
  darkAccentChroma: "theme-dark-accent-chroma",
  tintWithAccent: "theme-tint-with-accent",
} as const

/** localStorage key the layout store reads on boot for the user's shell style. */
export const SHELL_STYLE_KEY = "theme-shell-style"
