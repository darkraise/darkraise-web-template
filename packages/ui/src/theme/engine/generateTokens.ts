import type {
  AccentColor,
  AccentIntensity,
  BackgroundStyle,
  BackgroundIntensity,
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
  accentIntensity: AccentIntensity
  backgroundIntensity?: BackgroundIntensity
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

/**
 * A surface name is an accent exactly when it is not one of the neutral ramps
 * registered in palettes/surfaceColors. Written as a predicate so the accent
 * branches narrow to AccentColor instead of needing a cast.
 */
export function isAccentSurface(name: SurfaceColor): name is AccentColor {
  return !(name in surfaceColors)
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

  if (!isAccentSurface(surfaceColor)) {
    const registered = surfaceColors[surfaceColor] as ColorScale
    return {
      "--sf-hue": `hsl(${registered[500]})`,
      "--sf-hue-2": `hsl(${registered[400]})`,
      "--sf-hue-3": `hsl(${registered[300]})`,
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
  // A registered ramp is already neutral, so it is used as-is. Tinting one
  // against slate would drag every warm ground back toward slate's hue, which
  // is the whole reason the other eleven were unreachable.
  if (!isAccentSurface(surfaceColor)) {
    return surfaceColors[surfaceColor] as ColorScale
  }
  return tintScale(
    accentColors[surfaceColor],
    surfaceColors.slate as ColorScale,
    mode === "light" ? 0.4 : 0.35,
    mode === "dark",
  )
}

/**
 * The scale the text tiers and borders are measured against. A chosen neutral
 * carries its own hue here too, so a warm ground does not end up under
 * slate-derived text; an accent surface keeps slate, as it always has.
 */
export function resolveNeutralScale(surfaceColor: SurfaceColor): ColorScale {
  return (surfaceColors[surfaceColor] ?? surfaceColors.slate) as ColorScale
}

/** Body-text AA, with a shade of headroom so rounding cannot drop under it. */
const LEGEND_TARGET_RATIO = 4.6
/** Far enough above the legend tier that the two read as different ranks. */
const MUTED_TARGET_RATIO = 7

const tierCache = new Map<string, string>()

/**
 * The quietest colour on this ramp's hue that still clears `target` against the
 * background.
 *
 * Computed rather than snapped to a ramp step, because the steps are too coarse
 * to carry three tiers: measured across the twelve neutral ramps, light step 500
 * lands at 4.31:1 and step 600 at 6.61:1, so a third tier below 500 has nowhere
 * to sit above the 4.5:1 floor. Snapping also left `--muted-foreground` itself
 * under AA on the warmer ramps.
 */
function tierClearing(
  ramp: ColorScale,
  background: string,
  target: number,
): string {
  const base = ramp[500] ?? "0 0% 50%"
  const key = `${base}|${background}|${target}`
  const cached = tierCache.get(key)
  if (cached !== undefined) return cached

  const parts = base.split(" ")
  const hue = parts[0] ?? "0"
  const saturation = parts[1] ?? "0%"
  let best = ramp[950] as string
  let bestRatio = Infinity
  for (let l = 0; l <= 100; l++) {
    const candidate = `${hue} ${saturation} ${l}%`
    const ratio = contrastRatio(candidate, background)
    if (ratio >= target && ratio < bestRatio) {
      bestRatio = ratio
      best = candidate
    }
  }
  tierCache.set(key, best)
  return best
}

function isSidebarDark(mode: ResolvedMode): boolean {
  return mode === "dark"
}

// `--focus-ring` reads accent[100..500] and `--sidebar-hover-bg` reads
// accent[50..500]. Their OKLCH chroma runs 0.03-0.18, below every ceiling in
// VIBRANCY, so the chroma treatment `--primary` receives would return these
// shades unchanged at every step. The axis ramps the palette step instead.
// `balanced` is today's value in both modes, so the default look is unchanged.
const FOCUS_RING_SHADE: Record<
  AccentIntensity,
  { light: 200 | 300 | 400 | 500; dark: 100 | 200 | 300 | 400 }
> = {
  calm: { light: 200, dark: 100 },
  balanced: { light: 300, dark: 200 },
  vivid: { light: 400, dark: 300 },
  intense: { light: 500, dark: 400 },
}

// Dark ramps alpha at a fixed shade rather than the shade itself: the token is
// composed as `${accent[500]} / 0.15`, so the ramp has to be applied before the
// alpha is appended, and moving both at once would double the step size.
const SIDEBAR_HOVER: Record<
  AccentIntensity,
  { light: 50 | 100 | 200 | 300; darkAlpha: number }
> = {
  calm: { light: 50, darkAlpha: 0.1 },
  balanced: { light: 100, darkAlpha: 0.15 },
  vivid: { light: 200, darkAlpha: 0.22 },
  intense: { light: 300, darkAlpha: 0.3 },
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
  AccentIntensity,
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
const CANVAS_SATURATION_CAP: Record<BackgroundIntensity, number | null> = {
  neutral: 0,
  subtle: 8,
  balanced: 16,
  vivid: null,
  intense: null,
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

function vibrancyFill(hsl: string, vibrancy: AccentIntensity): string {
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

/**
 * Linear blend of two `H S% L%` triplets. Hue is interpolated only when both
 * ends are chromatic: white is stored as `0 0% 100%`, and interpolating from
 * that hue would swing a light field's midpoint through red rather than
 * keeping it on the surface colour.
 */
export function mixHsl(a: string, b: string, t: number): string {
  const pa = a.split(" ")
  const pb = b.split(" ")
  const ha = parseFloat(pa[0] ?? "0")
  const hb = parseFloat(pb[0] ?? "0")
  const sa = parseFloat(pa[1] ?? "0")
  const sb = parseFloat(pb[1] ?? "0")
  const la = parseFloat(pa[2] ?? "0")
  const lb = parseFloat(pb[2] ?? "0")
  const hue = sa === 0 ? hb : sb === 0 ? ha : ha + (hb - ha) * t
  const sat = sa + (sb - sa) * t
  const lig = la + (lb - la) * t
  return `${Math.round(hue)} ${Math.round(sat)}% ${round1(lig)}%`
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** Replaces a triplet's lightness, keeping its hue and saturation. */
function withLightness(hsl: string, lightness: number): string {
  const parts = hsl.split(" ")
  return `${parts[0] ?? "0"} ${parts[1] ?? "0%"} ${round1(lightness)}%`
}

/**
 * The rung a form control paints when it sits inside a raised surface, one
 * step per `controlDepth`. `flush` is the container's own rung (no recess);
 * `recessed` is the sunken rung, which is what the palette bottoms out at.
 *
 * `subtle` and `deep` have no palette step of their own, so both are derived
 * from the two that do. `deep` continues past `sunken` by the same lightness
 * distance that separates it from `raised`, which in light mode lands a rung
 * below the sunken grey. In dark that subtraction goes negative — the palette
 * has almost no headroom under surface[950] — so a floor at 40% of the sunken
 * lightness keeps the well dark without collapsing it to a hueless black hole.
 */
export function controlWells(
  raised: string,
  sunken: string,
): { subtle: string; deep: string } {
  const raisedL = parseFloat(raised.split(" ")[2] ?? "0")
  const sunkenL = parseFloat(sunken.split(" ")[2] ?? "0")
  const deepL = Math.max(sunkenL - (raisedL - sunkenL), sunkenL * 0.4)
  return {
    subtle: mixHsl(raised, sunken, 0.5),
    deep: withLightness(sunken, deepL),
  }
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
    accentIntensity,
    backgroundIntensity = "balanced",
  } = input

  const sfHueTokens = resolveSfHueTokens(surfaceColor, backgroundStyle)

  const accent: ColorScale = accentColors[accentColor]
  const surface: ColorScale = resolveSurfaceScale(surfaceColor, mode)
  const neutral: ColorScale = resolveNeutralScale(surfaceColor)
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
      ? capChroma(primaryBase, VIBRANCY[accentIntensity].primaryChroma)
      : primaryBase
  const primaryFill =
    mode === "dark" ? vibrancyFill(primaryBase, accentIntensity) : primaryBase
  const primaryForeground = pickForeground(primaryFill)
  const ringValue = primaryValue
  const focusRingShade = FOCUS_RING_SHADE[accentIntensity][mode]
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

  // Dark fields ride the subtle rung. Their fill now sits a rung BELOW the
  // card (see `--control-surface`), so the fill already separates the field
  // from its container and the border only has to trace the edge; at
  // `border` it read as an outline drawn on top. Light keeps `border`,
  // because there the field is surface[100] on a white card and the border
  // is the only thing carrying the shape.
  const inputValue = recipe.overrides.input
    ? recipe.overrides.input(surface, mode)
    : mode === "light"
      ? border
      : recipe.borderSubtle(surface, mode)

  // Saturated mid-tone of the chosen surface color, regardless of
  // backgroundStyle. Drives the Glass preset's inner glow (and any
  // future surface-color-following effects) so the rim hue matches the
  // page's color story rather than the brand accent. For any of the registered
  // neutral ramps this resolves to that ramp's own mid-tone, keeping a warm
  // ground warm; for an accent used as a surface it's that colour's 500 shade.
  const surfaceTint = isAccentSurface(surfaceColor)
    ? accentColors[surfaceColor][500]
    : neutral[500]

  const controlWell = controlWells(
    recipe.surfaceRaised(surface, mode),
    recipe.surfaceSunken(surface, mode),
  )

  const background = capCanvasSaturation(
    mode === "light" ? surface[50] : surface[950],
    CANVAS_SATURATION_CAP[backgroundIntensity],
  )
  const mutedForeground = tierClearing(
    neutral,
    background,
    MUTED_TARGET_RATIO,
  )

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

    "--background": background,
    "--foreground": foreground,

    "--card": mode === "light" ? "0 0% 100%" : surface[900],
    "--card-foreground": mode === "light" ? neutral[900] : neutral[50],

    "--popover": mode === "light" ? "0 0% 100%" : surface[900],
    "--popover-foreground": mode === "light" ? neutral[900] : neutral[50],

    "--secondary": mode === "light" ? surface[100] : surface[800],
    "--secondary-foreground": mode === "light" ? neutral[900] : neutral[50],

    "--muted": mode === "light" ? surface[100] : surface[800],
    "--muted-foreground": mutedForeground,
    "--legend": tierClearing(neutral, background, LEGEND_TARGET_RATIO),

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

    "--surface-base": capCanvasSaturation(
      mode === "light" ? surface[50] : surface[950],
      CANVAS_SATURATION_CAP[backgroundIntensity],
    ),
    "--surface-raised": recipe.surfaceRaised(surface, mode),
    "--surface-overlay": recipe.surfaceOverlay(surface, mode),
    "--surface-sunken": recipe.surfaceSunken(surface, mode),
    // Derived rungs for the controlDepth axis. Emitted unconditionally so the
    // axis itself stays a pure data attribute -- CSS picks one of these, and
    // nothing about the axis has to reach the token engine.
    "--control-well-subtle": controlWell.subtle,
    "--control-well-deep": controlWell.deep,
    "--surface-sidebar": recipe.surfaceSidebar(surface, mode),
    "--sidebar-foreground": isSidebarDark(mode) ? neutral[300] : neutral[600],
    "--sidebar-foreground-hover": isSidebarDark(mode)
      ? "0 0% 100%"
      : neutral[900],
    // Same polarity as --muted-foreground (light → 500, dark → 400). The
    // branches were the other way round, which put the lighter grey on the
    // near-white light rail: sidebar group labels measured 2.43:1 in light
    // (2.29:1 under Terminal) against a 4.5:1 requirement.
    "--sidebar-foreground-muted": mutedForeground,
    "--sidebar-border": isSidebarDark(mode) ? "0 0% 100% / 0.1" : surface[200],
    "--sidebar-hover-bg": isSidebarDark(mode)
      ? `${accent[500]} / ${SIDEBAR_HOVER[accentIntensity].darkAlpha}`
      : accent[SIDEBAR_HOVER[accentIntensity].light],
    "--surface-header": recipe.surfaceHeader(surface, mode),

    "--border-subtle": recipe.borderSubtle(surface, mode),
    "--border-default": recipe.borderDefault(surface, mode),
    "--border-strong": recipe.borderStrong(surface, mode),

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
