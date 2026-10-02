import {
  ACCENT_COLORS,
  ACCENT_INTENSITIES,
  BACKGROUND_INTENSITIES,
  BACKGROUND_STYLES,
  BORDER_INTENSITIES,
  CONTROL_DEPTHS,
  DENSITIES,
  ELEVATIONS,
  FONT_SIZES,
  GLOW_LEVELS,
  GRADIENT_PATTERNS,
  MODES,
  RADII,
  SHELL_STYLES,
  SIDEBAR_ACTIVE_BARS,
  SURFACE_COLORS,
  SURFACE_INTENSITIES,
} from "@theme/types"
import { PRESET_NAMES } from "@theme/presets"

export type AxisLayer = "brand" | "style" | "advanced"

interface AxisSpec<V extends readonly string[]> {
  readonly values: V
  readonly default: V[number]
  /** Exact localStorage key. Several predate any naming rule, so none is derived. */
  readonly storageKey: string
  readonly attribute?: string
  readonly layer: AxisLayer
}

function axis<const V extends readonly string[]>(
  spec: AxisSpec<V>,
): AxisSpec<V> {
  return spec
}

export const AXES = {
  mode: axis({
    values: MODES,
    default: "system",
    storageKey: "mode",
    attribute: "data-mode",
    layer: "brand",
  }),
  accentColor: axis({
    values: ACCENT_COLORS,
    default: "blue",
    storageKey: "theme-accent",
    attribute: "data-accent",
    layer: "brand",
  }),
  surfaceColor: axis({
    values: SURFACE_COLORS,
    default: "slate",
    storageKey: "theme-surface-color",
    attribute: "data-surface",
    layer: "brand",
  }),
  preset: axis({
    values: PRESET_NAMES,
    default: "default",
    storageKey: "theme-preset",
    attribute: "data-preset",
    layer: "style",
  }),
  backgroundStyle: axis({
    values: BACKGROUND_STYLES,
    default: "solid",
    storageKey: "theme-bg-style",
    attribute: "data-background-style",
    layer: "advanced",
  }),
  backgroundIntensity: axis({
    values: BACKGROUND_INTENSITIES,
    default: "vivid",
    storageKey: "theme-bg-intensity",
    attribute: "data-background-intensity",
    layer: "advanced",
  }),
  gradientPattern: axis({
    values: GRADIENT_PATTERNS,
    default: "blobs",
    storageKey: "theme-gradient-pattern",
    attribute: "data-gradient-pattern",
    layer: "advanced",
  }),
  density: axis({
    values: DENSITIES,
    default: "cozy",
    storageKey: "theme-density",
    attribute: "data-density",
    layer: "brand",
  }),
  elevation: axis({
    values: ELEVATIONS,
    default: "medium",
    storageKey: "theme-elevation",
    attribute: "data-elevation",
    layer: "advanced",
  }),
  buttonElevation: axis({
    values: ELEVATIONS,
    default: "flat",
    storageKey: "theme-button-elevation",
    attribute: "data-button-elevation",
    layer: "advanced",
  }),
  surfaceIntensity: axis({
    values: SURFACE_INTENSITIES,
    default: "balanced",
    storageKey: "theme-surface-intensity",
    attribute: "data-surface-intensity",
    layer: "advanced",
  }),
  borderIntensity: axis({
    values: BORDER_INTENSITIES,
    default: "balanced",
    storageKey: "theme-border-intensity",
    layer: "advanced",
  }),
  radius: axis({
    values: RADII,
    default: "rounded",
    storageKey: "theme-radius",
    attribute: "data-radius",
    layer: "brand",
  }),
  fontSize: axis({
    values: FONT_SIZES,
    default: "medium",
    storageKey: "theme-font-size",
    attribute: "data-font-size",
    layer: "brand",
  }),
  accentIntensity: axis({
    values: ACCENT_INTENSITIES,
    default: "balanced",
    storageKey: "theme-accent-intensity",
    layer: "advanced",
  }),
  controlDepth: axis({
    values: CONTROL_DEPTHS,
    default: "recessed",
    storageKey: "theme-control-depth",
    attribute: "data-control-depth",
    layer: "advanced",
  }),
  outerGlow: axis({
    values: GLOW_LEVELS,
    default: "none",
    storageKey: "theme-outer-glow",
    attribute: "data-outer-glow",
    layer: "advanced",
  }),
  innerGlow: axis({
    values: GLOW_LEVELS,
    default: "none",
    storageKey: "theme-inner-glow",
    attribute: "data-inner-glow",
    layer: "advanced",
  }),
  shellStyle: axis({
    values: SHELL_STYLES,
    default: "classic",
    storageKey: "theme-shell-style",
    attribute: "data-shell-style",
    layer: "advanced",
  }),
  sidebarActiveBar: axis({
    values: SIDEBAR_ACTIVE_BARS,
    default: "default",
    storageKey: "theme-sidebar-active-bar",
    layer: "advanced",
  }),
}

export type AxisKey = keyof typeof AXES

export const AXIS_KEYS = Object.keys(AXES) as AxisKey[]

export type AxisValue<K extends AxisKey> = (typeof AXES)[K]["values"][number]

export type AxisValues = { [K in AxisKey]: AxisValue<K> }

export type AxisSetters = {
  [K in AxisKey as `set${Capitalize<K>}`]: (value: AxisValue<K>) => void
}

export function isAxisValue<K extends AxisKey>(
  key: K,
  value: unknown,
): value is AxisValue<K> {
  return (
    typeof value === "string" &&
    (AXES[key].values as readonly string[]).includes(value)
  )
}
