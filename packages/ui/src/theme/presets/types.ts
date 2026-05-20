import type {
  AccentColor,
  SurfaceColor,
  BackgroundStyle,
  ResolvedMode,
  ColorScale,
} from "@theme/types"

/**
 * Declares a single discrete-enum axis (e.g. Glass-Opacity, Neon-Glow).
 * Values is a readonly string tuple so callers get exhaustive type narrowing.
 */
export interface AxisDefinition<
  Values extends readonly string[] = readonly string[],
> {
  values: Values
  default: Values[number]
  label: string
  description?: string
  /** Switcher ordering; lower numbers render first. Defaults to 99. */
  order?: number
}

/**
 * Input to a preset's optional generateTokens function. Carries both the
 * raw common-axis settings AND the resolved palettes so generators don't
 * need to re-import them.
 */
export interface CommonAxisInput {
  accentColor: AccentColor
  surfaceColor: SurfaceColor
  backgroundStyle: BackgroundStyle
  mode: ResolvedMode
  accent: ColorScale
  surface: ColorScale
  neutral: ColorScale
}

/**
 * The 7 surface tokens every preset must produce, plus the optional
 * overrides for foreground / border / input / shadow tokens.
 *
 * Note: the legacy SurfaceStyleRecipe.overrides carries `radius`,
 * `backdropBlur`, and `surfaceOpacity` fields. `radius` is dead code
 * (theme.css [data-radius="…"] selectors own --radius, no one reads
 * the recipe field). `backdropBlur` and `surfaceOpacity` are moved to
 * per-axis CSS attribute selectors in glassmorphism.css. All three
 * are intentionally dropped here.
 */
export interface PresetSurfaceRecipe {
  surfaceRaised: (scale: ColorScale, mode: ResolvedMode) => string
  surfaceOverlay: (scale: ColorScale, mode: ResolvedMode) => string
  surfaceSunken: (scale: ColorScale, mode: ResolvedMode) => string
  surfaceSidebar: (scale: ColorScale, mode: ResolvedMode) => string
  surfaceHeader: (scale: ColorScale, mode: ResolvedMode) => string
  borderSubtle: (scale: ColorScale, mode: ResolvedMode) => string
  borderDefault: (scale: ColorScale, mode: ResolvedMode) => string
  overrides: {
    shadowCard: string
    shadowDropdown: string
    foreground?: (scale: ColorScale, mode: ResolvedMode) => string
    border?: (scale: ColorScale, mode: ResolvedMode) => string
    input?: (scale: ColorScale, mode: ResolvedMode) => string
  }
}

/**
 * A theme preset: visual language (Default / Glass / future Neon, Terminal,
 * Cartoon...) plus its own discrete axes that get exposed in the switcher
 * only when the preset is active.
 *
 * Type parameter `Axes` lets each preset declare a specific shape so
 * generateTokens receives strongly-typed axis values.
 */
export interface ThemePreset<
  Axes extends Record<string, readonly string[]> = Record<string, never>,
> {
  name: string
  label: string
  description: string

  axes: { [K in keyof Axes]: AxisDefinition<Axes[K]> }

  surfaceRecipe: PresetSurfaceRecipe

  /**
   * Optional cross-axis token math (e.g. fog tiers tinted by mode * opacity).
   * Provider calls this when any common axis or any of this preset's axes
   * change, and merges the returned tokens with the common-axis tokens.
   *
   * Scalar tokens (--surface-opacity, --backdrop-blur, --backdrop-filter)
   * should live in the preset's CSS file under attribute selectors, not here.
   */
  generateTokens?: (
    common: CommonAxisInput,
    axes: { [K in keyof Axes]: Axes[K][number] },
  ) => Record<string, string>

  /**
   * Keys that `generateTokens` may write. Provider uses this list to call
   * `removeProperty` on the documentElement when the user switches AWAY
   * from this preset, so leftover tokens don't bleed into the next preset.
   */
  ownedTokenKeys?: readonly string[]
}
