import {
  ACCENT_COLORS,
  BACKGROUND_INTENSITIES,
  BACKGROUND_STYLES,
  CONTRASTS,
  DARK_ACCENT_CHROMAS,
  DENSITIES,
  ELEVATIONS,
  FONT_SIZES,
  GLOW_LEVELS,
  GRADIENT_PATTERNS,
  MODES,
  RADII,
  SIDEBAR_ACTIVE_BARS,
  SURFACE_COLORS,
  TINT_WITH_ACCENT,
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
  /** Colour scheme; `system` follows `prefers-color-scheme`. */
  mode: axis({
    values: MODES,
    default: "system",
    storageKey: "mode",
    attribute: "data-mode",
    layer: "brand",
  }),
  /** Accent hue for the primary fill, marks, focus ring and links. */
  accentColor: axis({
    values: ACCENT_COLORS,
    default: "blue",
    storageKey: "theme-accent",
    attribute: "data-accent",
    layer: "brand",
  }),
  /** Neutral ramp the page, cards and borders are drawn from; an accent name gives a tinted neutral. */
  surfaceColor: axis({
    values: SURFACE_COLORS,
    default: "slate",
    storageKey: "theme-surface-color",
    attribute: "data-surface",
    layer: "brand",
  }),
  /** Visual preset; `glass` adds frosted surfaces and its own axes. */
  preset: axis({
    values: PRESET_NAMES,
    default: "default",
    storageKey: "theme-preset",
    attribute: "data-preset",
    layer: "style",
  }),
  /** Page canvas: a `solid` fill or a `gradient`. */
  backgroundStyle: axis({
    values: BACKGROUND_STYLES,
    default: "solid",
    storageKey: "theme-bg-style",
    attribute: "data-background-style",
    layer: "advanced",
  }),
  /** How loud the gradient overlay is; only meaningful when backgroundStyle is `gradient`. */
  backgroundIntensity: axis({
    values: BACKGROUND_INTENSITIES,
    default: "vivid",
    storageKey: "theme-bg-intensity",
    attribute: "data-background-intensity",
    layer: "advanced",
  }),
  /** Which gradient shape the page paints; only meaningful when backgroundStyle is `gradient`. */
  gradientPattern: axis({
    values: GRADIENT_PATTERNS,
    default: "blobs",
    storageKey: "theme-gradient-pattern",
    attribute: "data-gradient-pattern",
    layer: "advanced",
  }),
  /** Control height and spacing scale. */
  density: axis({
    values: DENSITIES,
    default: "cozy",
    storageKey: "theme-density",
    attribute: "data-density",
    layer: "brand",
  }),
  /** Shadow depth of raised surfaces. */
  elevation: axis({
    values: ELEVATIONS,
    default: "standard",
    storageKey: "theme-elevation",
    attribute: "data-elevation",
    layer: "advanced",
  }),
  /** Corner radius scale. */
  radius: axis({
    values: RADII,
    default: "rounded",
    storageKey: "theme-radius",
    attribute: "data-radius",
    layer: "brand",
  }),
  /** Root font size scale. */
  fontSize: axis({
    values: FONT_SIZES,
    default: "medium",
    storageKey: "theme-font-size",
    attribute: "data-font-size",
    layer: "brand",
  }),
  /** Halo cast outward; the outer half of the glow effect. */
  outerGlow: axis({
    values: GLOW_LEVELS,
    default: "none",
    storageKey: "theme-outer-glow",
    attribute: "data-outer-glow",
    layer: "advanced",
  }),
  /** Rim light bled inward; the inner half of the glow effect. */
  innerGlow: axis({
    values: GLOW_LEVELS,
    default: "none",
    storageKey: "theme-inner-glow",
    attribute: "data-inner-glow",
    layer: "advanced",
  }),
  /** Indicator on the active sidebar item; `default` keeps the preset's own look. */
  sidebarActiveBar: axis({
    values: SIDEBAR_ACTIVE_BARS,
    default: "default",
    storageKey: "theme-sidebar-active-bar",
    layer: "advanced",
  }),
  /** Page-to-card separation and decorative edge strength; field edges hold 3:1 at every step. */
  contrast: axis({
    values: CONTRASTS,
    default: "standard",
    storageKey: "theme-contrast",
    attribute: "data-contrast",
    layer: "advanced",
  }),
  /** How saturated the accent reads in dark mode; fill lightness is always solved. */
  darkAccentChroma: axis({
    values: DARK_ACCENT_CHROMAS,
    default: "standard",
    storageKey: "theme-dark-accent-chroma",
    attribute: "data-dark-accent-chroma",
    layer: "advanced",
  }),
  /** Mixes the accent hue into the neutral at a capped chroma; off under the neutral accent. */
  tintWithAccent: axis({
    values: TINT_WITH_ACCENT,
    default: "off",
    storageKey: "theme-tint-with-accent",
    attribute: "data-tint-with-accent",
    layer: "brand",
  }),
}

export type AxisKey = keyof typeof AXES

export const AXIS_KEYS = Object.keys(AXES) as AxisKey[]

export type AxisValue<K extends AxisKey> = (typeof AXES)[K]["values"][number]

// Mapped over `keyof typeof AXES` rather than the `AxisKey` alias: only this
// form carries each entry's JSDoc onto ThemeSettings and ThemeContextValue.
export type AxisValues = { [K in keyof typeof AXES]: AxisValue<K> }

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
