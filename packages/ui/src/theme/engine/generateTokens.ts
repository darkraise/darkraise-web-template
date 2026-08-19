import type {
  AccentColor,
  AccentVibrancy,
  BackgroundStyle,
  CanvasTint,
  SurfaceColor,
  ResolvedMode,
  ColorScale,
} from "@theme/types"
import { accentColors } from "@theme/palettes/accentColors"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import { presets, type PresetName } from "@theme/presets"
import { ACCENT_COLORS } from "@theme/types"
import {
  contrastRatio,
  hslStringToOklch,
  oklchToHslString,
} from "@theme/engine/oklch"

export interface GenerateTokensInput {
  accentColor: AccentColor
  surfaceColor: SurfaceColor
  preset: PresetName
  backgroundStyle: BackgroundStyle
  mode: ResolvedMode
  accentVibrancy: AccentVibrancy
  canvasTint?: CanvasTint
}

function getChartColors(
  accentColor: AccentColor,
  mode: ResolvedMode,
): string[] {
  const index = ACCENT_COLORS.indexOf(accentColor)
  const count = ACCENT_COLORS.length
  const step = Math.floor(count / 5)
  const shade = mode === "light" ? 500 : 400

  return Array.from({ length: 5 }, (_, i) => {
    const colorIndex = (index + i * step) % count
    const colorName = ACCENT_COLORS[colorIndex] ?? accentColor
    return `hsl(${accentColors[colorName][shade]})`
  })
}

function resolveSfHueTokens(
  surfaceColor: SurfaceColor,
  backgroundStyle: BackgroundStyle,
): { "--sf-hue": string; "--sf-hue-2": string; "--sf-hue-3": string } {
  if (backgroundStyle !== "gradient") {
    return {
      "--sf-hue": "transparent",
      "--sf-hue-2": "transparent",
      "--sf-hue-3": "transparent",
    }
  }

  if (surfaceColor === "slate") {
    const slate = surfaceColors.slate as ColorScale
    return {
      "--sf-hue": `hsl(${slate[500]})`,
      "--sf-hue-2": `hsl(${slate[400]})`,
      "--sf-hue-3": `hsl(${slate[300]})`,
    }
  }

  const color = accentColors[surfaceColor]
  const index = ACCENT_COLORS.indexOf(surfaceColor)
  const neighborIndex = (index + 3) % ACCENT_COLORS.length
  const neighborName = ACCENT_COLORS[neighborIndex] as AccentColor
  const neighbor = accentColors[neighborName]

  return {
    "--sf-hue": `hsl(${color[500]})`,
    "--sf-hue-2": `hsl(${neighbor[500]})`,
    "--sf-hue-3": `hsl(${color[300]})`,
  }
}

export function tintScale(
  scale: ColorScale,
  neutral: ColorScale,
  satFactor: number,
  useNeutralLightness: boolean,
): ColorScale {
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
  const result = {} as Record<number, string>
  for (const step of steps) {
    const parts = scale[step].split(" ")
    const h = parts[0] ?? "0"
    const s = parseFloat(parts[1] ?? "0")
    const l = useNeutralLightness
      ? (neutral[step].split(" ")[2] ?? "0%")
      : (parts[2] ?? "0%")
    result[step] = `${h} ${(s * satFactor).toFixed(0)}% ${l}`
  }
  return result as ColorScale
}

/**
 * Resolves the surface color palette for the given input. Used internally
 * by generateTokens AND by ThemeProvider when building the CommonAxisInput
 * for a preset's optional generateTokens callback. Centralizing here ensures
 * common-axis tokens and preset-owned tokens see the same surface scale.
 */
export function resolveSurfaceScale(
  surfaceColor: SurfaceColor,
  mode: ResolvedMode,
): ColorScale {
  const neutral = surfaceColors.slate as ColorScale
  if (surfaceColor === "slate") return neutral
  return tintScale(
    accentColors[surfaceColor],
    neutral,
    mode === "light" ? 0.4 : 0.35,
    mode === "dark",
  )
}

function isSidebarDark(mode: ResolvedMode): boolean {
  return mode === "dark"
}

/**
 * How loud the dark-mode accent reads. The fill takes the step's lightness and
 * chroma cap; `--primary` keeps its palette lightness and takes the cap only,
 * which is what stops the bright warm accents from being dragged down.
 *
 * Neither end of the lightness band is arbitrary. Below ~0.535 the fill drops
 * under 3:1 against `--card`; at ~0.645 accents start flipping to a dark label
 * as `pickForeground` crosses its threshold, which would make label colour
 * vary by accent. A chroma cap above ~0.26 never binds, because that is the
 * sRGB gamut ceiling at these lightnesses — hence the nulls rather than
 * decorative large numbers.
 */
const VIBRANCY: Record<
  AccentVibrancy,
  {
    fillLightness: number
    fillChroma: number | null
    primaryChroma: number | null
  }
> = {
  calm: { fillLightness: 0.54, fillChroma: 0.24, primaryChroma: 0.2 },
  balanced: { fillLightness: 0.57, fillChroma: null, primaryChroma: 0.24 },
  vivid: { fillLightness: 0.6, fillChroma: null, primaryChroma: null },
  intense: { fillLightness: 0.63, fillChroma: null, primaryChroma: null },
}

/**
 * How much of the surface colour's hue the page canvas may carry, as a maximum
 * saturation percentage. A cap rather than a multiplier so one step means the
 * same thing for every surface colour: `slate` starts at 84% saturation while
 * every tinted option is already damped to ~30% by `tintScale`, so a multiplier
 * would leave slate visibly blue at the same setting that neutralises the rest.
 * `null` means uncapped — the palette's own value, which is what preserving the
 * pre-axis appearance requires.
 */
const CANVAS_TINT_CAPS: Record<CanvasTint, number | null> = {
  neutral: 0,
  subtle: 8,
  balanced: 16,
  vivid: null,
}

/** Clamps an `H S% L%` triplet's saturation. Hue and lightness pass through. */
export function capCanvasSaturation(hsl: string, cap: number | null): string {
  if (cap === null) return hsl
  const [h, s, l] = hsl.split(" ")
  const saturation = Math.min(parseFloat(s ?? "0"), cap)
  return `${h} ${saturation.toFixed(0)}% ${l}`
}

/** WCAG floor for large text, which is what a filled control's label is. */
const FOREGROUND_MIN_RATIO = 3
const WHITE = "0 0% 100%"
const INK = "222 47% 11%"

function vibrancyFill(hsl: string, vibrancy: AccentVibrancy): string {
  const { C, h } = hslStringToOklch(hsl)
  const { fillLightness, fillChroma } = VIBRANCY[vibrancy]
  return oklchToHslString({
    L: fillLightness,
    C: fillChroma === null ? C : Math.min(C, fillChroma),
    h,
  })
}

function capChroma(hsl: string, max: number | null): string {
  if (max === null) return hsl
  const { L, C, h } = hslStringToOklch(hsl)
  if (C <= max) return hsl
  return oklchToHslString({ L, C: max, h })
}

function pickForeground(fill: string): string {
  return contrastRatio(WHITE, fill) >= FOREGROUND_MIN_RATIO ? WHITE : INK
}

export function generateTokens(
  input: GenerateTokensInput,
): Record<string, string> {
  const {
    accentColor,
    surfaceColor,
    preset,
    backgroundStyle,
    mode,
    accentVibrancy,
    canvasTint = "balanced",
  } = input

  const sfHueTokens = resolveSfHueTokens(surfaceColor, backgroundStyle)

  const accent: ColorScale = accentColors[accentColor]
  const surface: ColorScale = resolveSurfaceScale(surfaceColor, mode)
  const neutral: ColorScale = surfaceColors.slate as ColorScale
  const recipe = presets[preset].surfaceRecipe

  const isRedishAccent =
    accentColor === "red" || accentColor === "rose" || accentColor === "pink"

  const isLightGlass = mode === "light" && preset === "glass"
  const isDarkGlass = preset === "glass" && mode === "dark"
  // Dark non-glass picks shade 500 (same as light) rather than the brighter
  // shade 400 it used previously. The earlier `accent[400]` value sat at
  // L:68u201376% S:92u201395% for high-saturation pastels (blue/violet/rose),
  // which read as glaring on every `bg-primary` surface in dark mode
  // (default Button fill, Checkbox/Switch checked, Calendar selected day,
  // Tabs underline, Progress track, etc.). Shade 500 keeps WCAG-fine
  // contrast against the dark background while toning down the brightness.
  // Glass branches stay on their original shades because translucent
  // surfaces need the extra weight to read at all.
  const primaryShade = isLightGlass ? 600 : isDarkGlass ? 400 : 500
  const primaryBase = accent[primaryShade]
  const primaryValue =
    mode === "dark"
      ? capChroma(primaryBase, VIBRANCY[accentVibrancy].primaryChroma)
      : primaryBase
  const primaryFill =
    mode === "dark" ? vibrancyFill(primaryBase, accentVibrancy) : primaryBase
  const primaryForeground = pickForeground(primaryFill)
  const ringValue = primaryValue
  const focusRingShade = mode === "light" ? 300 : 200
  const focusRingValue = accent[focusRingShade]

  const chartColors = getChartColors(accentColor, mode)

  const foreground = recipe.overrides.foreground
    ? recipe.overrides.foreground(neutral, mode)
    : mode === "light"
      ? neutral[900]
      : neutral[50]

  const border = recipe.overrides.border
    ? recipe.overrides.border(surface, mode)
    : mode === "light"
      ? surface[200]
      : surface[700]

  // Dark `--border` deliberately lighter than `--muted`/`--secondary`/
  // `--accent` (all `surface[800]`) and `--border-subtle` (also 800). The
  // earlier value of `surface[800]` collapsed the standard border into the
  // subtle tier, so any outline drawn next to a muted surface (e.g. the
  // FloatingPanel header sitting on its own popover body) became invisible
  // in dark mode. Surface[700] also matches the `borderDefault` recipe step
  // already published as `--border-default`, keeping the two tokens
  // semantically aligned.

  const inputValue = recipe.overrides.input
    ? recipe.overrides.input(surface, mode)
    : border

  // Saturated mid-tone of the chosen surface color, regardless of
  // backgroundStyle. Drives the Glass preset's inner glow (and any
  // future surface-color-following effects) so the rim hue matches the
  // page's color story rather than the brand accent. For surfaceColor
  // "slate" this resolves to a neutral grey (slate is the design
  // system's no-brand baseline); for any accent color choice it's that
  // color's 500 shade.
  const surfaceTint =
    surfaceColor === "slate" ? neutral[500] : accentColors[surfaceColor][500]

  const tokens: Record<string, string> = {
    "--primary": primaryValue,
    "--primary-fill": primaryFill,
    "--primary-foreground": primaryForeground,
    "--ring": ringValue,
    "--focus-ring": focusRingValue,
    "--surface-tint": surfaceTint,

    "--chart-1": chartColors[0] ?? "",
    "--chart-2": chartColors[1] ?? "",
    "--chart-3": chartColors[2] ?? "",
    "--chart-4": chartColors[3] ?? "",
    "--chart-5": chartColors[4] ?? "",

    "--background":
      mode === "light"
        ? surface[50]
        : capCanvasSaturation(surface[950], CANVAS_TINT_CAPS[canvasTint]),
    "--foreground": foreground,

    "--card": mode === "light" ? "0 0% 100%" : surface[900],
    "--card-foreground": mode === "light" ? neutral[900] : neutral[50],

    "--popover": mode === "light" ? "0 0% 100%" : surface[900],
    "--popover-foreground": mode === "light" ? neutral[900] : neutral[50],

    "--secondary": mode === "light" ? surface[100] : surface[800],
    "--secondary-foreground": mode === "light" ? neutral[900] : neutral[50],

    "--muted": mode === "light" ? surface[100] : surface[800],
    "--muted-foreground": mode === "light" ? neutral[500] : neutral[400],

    "--accent": mode === "light" ? surface[100] : surface[800],
    "--accent-foreground": mode === "light" ? neutral[900] : neutral[50],

    "--destructive": isRedishAccent
      ? mode === "light"
        ? "25 95% 53%"
        : "21 90% 48%"
      : mode === "light"
        ? "0 84% 60%"
        : "0 72% 51%",
    "--destructive-foreground": "0 0% 100%",

    "--success":
      mode === "light" ? accentColors.emerald[500] : accentColors.emerald[400],
    "--success-foreground": "0 0% 100%",

    "--warning":
      mode === "light" ? accentColors.amber[500] : accentColors.amber[400],
    "--warning-foreground": "222 47% 11%",

    "--info":
      mode === "light" ? accentColors.blue[500] : accentColors.blue[400],
    "--info-foreground": "0 0% 100%",

    "--border": border,
    "--input": inputValue,

    "--surface-base":
      mode === "light"
        ? surface[50]
        : capCanvasSaturation(surface[950], CANVAS_TINT_CAPS[canvasTint]),
    "--surface-raised": recipe.surfaceRaised(surface, mode),
    "--surface-overlay": recipe.surfaceOverlay(surface, mode),
    "--surface-sunken": recipe.surfaceSunken(surface, mode),
    "--surface-sidebar": recipe.surfaceSidebar(surface, mode),
    "--sidebar-foreground": isSidebarDark(mode) ? neutral[300] : neutral[600],
    "--sidebar-foreground-hover": isSidebarDark(mode)
      ? "0 0% 100%"
      : neutral[900],
    // Same polarity as --muted-foreground (light → 500, dark → 400). The
    // branches were the other way round, which put the lighter grey on the
    // near-white light rail: sidebar group labels measured 2.43:1 in light
    // (2.29:1 under Terminal) against a 4.5:1 requirement.
    "--sidebar-foreground-muted": isSidebarDark(mode)
      ? neutral[400]
      : neutral[500],
    "--sidebar-border": isSidebarDark(mode) ? "0 0% 100% / 0.1" : surface[200],
    "--sidebar-hover-bg": isSidebarDark(mode)
      ? `${accent[500]} / 0.15`
      : accent[100],
    "--surface-header": recipe.surfaceHeader(surface, mode),

    "--border-subtle": recipe.borderSubtle(surface, mode),
    "--border-default": recipe.borderDefault(surface, mode),

    "--shadow-card": isLightGlass
      ? recipe.overrides.shadowCard.replace(/rgb\(0 0 0 \//g, "rgb(16 24 40 /")
      : recipe.overrides.shadowCard,
    "--shadow-dropdown": isLightGlass
      ? recipe.overrides.shadowDropdown.replace(
          /rgb\(0 0 0 \//g,
          "rgb(16 24 40 /",
        )
      : recipe.overrides.shadowDropdown,

    "--bg-style": backgroundStyle,
    "--noise-opacity":
      backgroundStyle === "gradient" ? (mode === "light" ? "0.6" : "0.5") : "0",

    // Glass keeps the main-content overlay neutral regardless of
    // backgroundStyle. The previous Glass+solid linear accent fade
    // (accent[200]/accent[800] at 0.2 alpha over the top 300px) was
    // bleeding through main[data-content] as a colored glow at the
    // top of pages — most visible in dark mode on the Buttons demo
    // page (and any other page without dense Cards covering the top
    // area) where the gradient had nothing in front of it. Body bg
    // (or whatever sits behind main) is the canonical source of
    // page color under Glass; the overlay no longer adds its own.
    "--content-gradient-overlay":
      backgroundStyle === "gradient" && preset !== "glass"
        ? `var(--canvas-blob-a), var(--canvas-blob-b), var(--canvas-blob-c), var(--canvas-blob-d), var(--canvas-ink)`
        : "none",

    ...sfHueTokens,
  }

  return tokens
}
