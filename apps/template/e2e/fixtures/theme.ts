export const PRESETS = ["default", "glass", "scifi"] as const
export type Preset = (typeof PRESETS)[number]

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

export const SURFACE_COLORS = ["slate", ...ACCENT_COLORS] as const

export const MODES = ["light", "dark", "system"] as const
export const BACKGROUND_STYLES = ["solid", "gradient"] as const
export const BACKGROUND_INTENSITIES = [
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
export const ELEVATIONS = ["flat", "low", "medium", "high"] as const
export const RADII = ["sharp", "subtle", "rounded", "pill"] as const
export const FONT_SIZES = ["small", "medium", "large", "extra-large"] as const
export const ACCENT_INTENSITIES = [
  "calm",
  "balanced",
  "vivid",
  "intense",
] as const
export const SURFACE_INTENSITIES = [
  "flat",
  "subtle",
  "balanced",
  "bold",
] as const
export const CANVAS_TINTS = ["neutral", "subtle", "balanced", "vivid"] as const

/** Presets that force a single resolved mode regardless of the mode axis. */
export const DARK_ONLY_PRESETS: Preset[] = ["scifi"]

/** Labels the theme switcher renders for each preset. */
export const PRESET_LABELS: Record<Preset, string> = {
  default: "Default",
  glass: "Glass",
  scifi: "Sci-fi",
}

/** Common axes each preset hides from the switcher (and that its own axes replace). */
export const HIDDEN_COMMON_AXES: Record<Preset, string[]> = {
  default: [],
  glass: [],
  scifi: ["elevation", "buttonElevation", "radius"],
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
    {
      name: "halo",
      label: "Halo",
      values: ["none", "soft", "pronounced"],
      default: "soft",
    },
  ],
  scifi: [
    {
      name: "intensity",
      label: "Intensity",
      values: ["dim", "normal", "bright", "intense"],
      default: "normal",
    },
    {
      name: "frame",
      label: "Frame",
      values: ["clean", "notched", "bracketed"],
      default: "notched",
    },
  ],
}

/** localStorage keys the ThemeProvider reads on boot. */
export const LS_KEYS = {
  accent: "theme-accent",
  surface: "theme-surface-color",
  preset: "theme-preset",
  backgroundStyle: "theme-bg-style",
  backgroundIntensity: "theme-bg-intensity",
  gradientPattern: "theme-gradient-pattern",
  mode: "mode",
  density: "theme-density",
  elevation: "theme-elevation",
  buttonElevation: "theme-button-elevation",
  radius: "theme-radius",
  fontSize: "theme-font-size",
  accentIntensity: "theme-accent-intensity",
  surfaceIntensity: "theme-surface-intensity",
  canvasTint: "theme-canvas-tint",
} as const
