import type {
  AccentColor,
  AccentIntensity,
  BackgroundStyle,
  BackgroundIntensity,
  BorderIntensity,
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
  mixedContrast,
  oklchToHslString,
} from "@theme/engine/oklch"
import {
  CANVAS_SATURATION_CAP,
  capCanvasSaturation,
  contentStripGround,
  gradientCanvasPeak,
} from "./canvas"

export {
  CANVAS_BLOB_SCALE,
  CANVAS_PEAK_SHARE,
  capCanvasSaturation,
  contentStripGround,
  gradientCanvasPeak,
} from "./canvas"

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

  const neutral = resolveNeutralScale(surfaceColor)
  return {
    "--sf-hue": `hsl(${neutral[500]})`,
    "--sf-hue-2": `hsl(${neutral[400]})`,
    "--sf-hue-3": `hsl(${neutral[300]})`,
  }
}

/** The ramp every neutral step and text tier is drawn from. */
export function resolveNeutralScale(surfaceColor: SurfaceColor): ColorScale {
  return surfaceColors[surfaceColor]
}

/** A shape or boundary must be distinguishable from its ground. */
const MARK_FLOOR = 3
/**
 * The field edge's floor under glass. A glass card is translucent over the
 * gradient canvas, so the ground a field really sits on drifts from the
 * opaque values the edge is solved against. 3.5 kept the rendered edge at
 * 3:1 on medium and strong glass cards for the default accent and surface
 * (the template's control-contract e2e spec); other accents, surfaces and
 * background intensities are not measured.
 */
const GLASS_EDGE_FLOOR = 3.5
/** Text must be readable, whatever else the colour is also used for. */
const TEXT_FLOOR = 4.5
/**
 * Strongest --primary tint that primary-coloured text sits on: bg-primary/10
 * under selected toggle, pagination, listbox and tree items, /20 under steps,
 * timeline, highlight and the sidebar count. The ceiling keeps 24% so the
 * token does not move again now that the strongest remaining tint is 20%.
 */
const PRIMARY_TINT_CEILING = 0.24
/**
 * Strongest tint of its own colour that status text sits on: alert titles at
 * 6%, toast titles at 10-12%.
 */
const STATUS_TINT_CEILING = 0.12
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
  return tierClearingAll(ramp, [background], target)
}

/**
 * `tierClearing` against several grounds: the quietest lightness on the
 * ramp's hue that clears `target` against every listed surface.
 */
function tierClearingAll(
  ramp: ColorScale,
  backgrounds: readonly string[],
  target: number,
): string {
  const base = ramp[500] ?? "0 0% 50%"
  const key = `${base}|${backgrounds.join("|")}|${target}`
  const cached = tierCache.get(key)
  if (cached !== undefined) return cached

  const parts = base.split(" ")
  const hue = parts[0] ?? "0"
  const saturation = parts[1] ?? "0%"
  let best = ramp[950] as string
  let bestRatio = Infinity
  for (let l = 0; l <= 100; l++) {
    const candidate = `${hue} ${saturation} ${l}%`
    const ratio = Math.min(
      ...backgrounds.map((bg) => contrastRatio(candidate, bg)),
    )
    if (ratio >= target && ratio < bestRatio) {
      bestRatio = ratio
      best = candidate
    }
  }
  tierCache.set(key, best)
  return best
}

const clearingCache = new Map<string, string>()

/**
 * `value` unchanged when `clears` accepts it, otherwise the nearest lightness
 * on the same hue and saturation that it accepts, searched outward from the
 * original lightness. Returns `value` unchanged when nothing clears, and
 * passes alpha values through untouched. `key` names the test for the cache.
 */
function nearestClearing(
  value: string,
  key: string,
  clears: (candidate: string) => boolean,
): string {
  if (value.includes("/")) return value
  const cacheKey = `${value}|${key}`
  const cached = clearingCache.get(cacheKey)
  if (cached !== undefined) return cached

  let result = value
  if (!clears(value)) {
    const parts = value.split(" ")
    const hue = parts[0] ?? "0"
    const saturation = parts[1] ?? "0%"
    const start = Math.round(parseFloat(parts[2] ?? "50"))
    outer: for (let delta = 1; delta <= 100; delta++) {
      for (const l of [start - delta, start + delta]) {
        if (l < 0 || l > 100) continue
        const candidate = `${hue} ${saturation} ${l}%`
        if (clears(candidate)) {
          result = candidate
          break outer
        }
      }
    }
  }
  clearingCache.set(cacheKey, result)
  return result
}

/**
 * `value` unchanged when it already clears `target` against every ground,
 * otherwise the nearest lightness on the same hue that does.
 *
 * A repair rather than a recomputation: a value that was already sound keeps
 * its exact place on the accent ladder, so raising a floor moves only what was
 * under it. Values carrying an alpha channel are returned untouched, because
 * their effective contrast depends on what they are composited over.
 */
function ensureContrastAll(
  value: string,
  backgrounds: readonly string[],
  target: number,
): string {
  return nearestClearing(
    value,
    `all|${backgrounds.join("|")}|${target}`,
    (candidate) =>
      backgrounds.every((bg) => contrastRatio(candidate, bg) >= target),
  )
}

/**
 * Text that also sits on a tint of `tint` at up to `amount` over each ground,
 * as `hsl(var(--x) / amount)` backgrounds paint it. Contrast falls
 * monotonically as the tint strengthens, so clearing the ceiling clears every
 * weaker tint. `tint` null means the text's own colour.
 */
function ensureContrastOnTint(
  value: string,
  grounds: readonly string[],
  tint: string | null,
  amount: number,
  target: number,
): string {
  return nearestClearing(
    value,
    `tint|${grounds.join("|")}|${tint ?? "self"}|${amount}|${target}`,
    (candidate) =>
      grounds.every(
        (ground) =>
          contrastRatio(candidate, ground) >= target &&
          mixedContrast(candidate, ground, tint ?? candidate, amount) >= target,
      ),
  )
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

// The active sidebar row is one step stronger than its hover on the same
// ramp, so hover and active always differ by fill: light takes the next shade
// up, dark adds 0.1 alpha.
const SIDEBAR_ACTIVE: Record<
  AccentIntensity,
  { light: 100 | 200 | 300 | 400; darkAlpha: number }
> = {
  calm: { light: 100, darkAlpha: 0.2 },
  balanced: { light: 200, darkAlpha: 0.25 },
  vivid: { light: 300, darkAlpha: 0.32 },
  intense: { light: 400, darkAlpha: 0.4 },
}

/**
 * How loud the dark-mode accent reads. The fill takes the step's lightness and
 * chroma cap; `--primary` keeps its palette lightness and takes the cap only,
 * which is what stops the bright warm accents from being dragged down.
 *
 * Each step's lightness is a ceiling, not a fixed value: `solveWhiteFill`
 * lowers any fill whose white label would miss 4.5:1, so neighbouring steps
 * can land on the same fill where a hue's 4.5:1 point sits below them (dark
 * mode on slate: orange, emerald, teal and fuchsia at `vivid` and `intense`,
 * sky at `balanced` and `vivid`). Below ~0.535 the fill would drop under 3:1
 * against `--card`; the deepest solve measured (lime at `intense`) sits about
 * 0.09 under its step and still clears that floor. A chroma cap above ~0.26 never
 * binds, because that is the sRGB gamut ceiling at these lightnesses — hence
 * the nulls rather than decorative large numbers.
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
 * Decides which label a hue keeps: white wherever white clears 3:1 on the
 * unsolved fill, ink everywhere else. The fill is then solved so the label
 * reaches LABEL_SOLVE_TARGET, which is how labels stay put per hue while
 * clearing AA for 14px text.
 */
const FOREGROUND_MIN_RATIO = 3
/** AA for body-size text, with headroom so integer HSL rounding cannot land under 4.5. */
const LABEL_SOLVE_TARGET = 4.6
const WHITE = "0 0% 100%"
const INK = "222 47% 11%"
const BLACK = "0 0% 0%"

/**
 * What a hover or press mixes into a fill: the end of the lightness range away
 * from its label. A fill sits at its label's contrast floor, so mixing toward
 * the label (the old translucent and label-coloured hovers) dropped under AA.
 */
function washFor(label: string): string {
  return label === WHITE ? BLACK : WHITE
}

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

const whiteFillCache = new Map<string, string>()

/**
 * The fill nearest `base` that carries a white label at LABEL_SOLVE_TARGET:
 * hue and chroma kept, OKLCH lightness lowered in 0.002 steps, each candidate
 * measured as the triplet actually emitted. `base` itself when it already
 * clears.
 */
function solveWhiteFill(base: string): string {
  const cached = whiteFillCache.get(base)
  if (cached !== undefined) return cached
  let result = base
  if (contrastRatio(WHITE, base) < LABEL_SOLVE_TARGET) {
    const { L, C, h } = hslStringToOklch(base)
    for (let l = L - 0.002; l > 0; l -= 0.002) {
      const candidate = oklchToHslString({ L: l, C, h })
      if (contrastRatio(WHITE, candidate) >= LABEL_SOLVE_TARGET) {
        result = candidate
        break
      }
    }
  }
  whiteFillCache.set(base, result)
  return result
}

/**
 * Keeps today's label per hue and solves the fill to carry it: a white label
 * darkens the fill just enough; an ink label leaves it alone, because ink
 * clears at least 5.9:1 on any fill where white is under 3:1.
 */
function primaryFillAndLabel(base: string): {
  fill: string
  foreground: string
} {
  if (contrastRatio(WHITE, base) >= FOREGROUND_MIN_RATIO) {
    return { fill: solveWhiteFill(base), foreground: WHITE }
  }
  return { fill: base, foreground: INK }
}

/** White or ink, whichever reads better on `fill`; white on a tie. */
function bestLabel(fill: string): string {
  return contrastRatio(WHITE, fill) >= contrastRatio(INK, fill) ? WHITE : INK
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

const BORDER_TOKENS = [
  "--border",
  "--input",
  "--border-subtle",
  "--border-default",
  "--border-strong",
  "--sidebar-border",
] as const

/**
 * How each `borderIntensity` step moves a border. An opaque border moves its
 * OKLCH lightness toward the page (`subtle`) or the text colour (`strong`,
 * `bold`) by `mix`, keeping its own chroma and hue: blending in HSL carried
 * the ink's saturation across and tinted a grey border blue. A translucent
 * one, such as dark glass's white hairline, has no fixed ground to move
 * against, so its alpha scales by `alpha` instead.
 */
const BORDER_SHIFT: Record<
  BorderIntensity,
  { toward: "--background" | "--foreground"; mix: number; alpha: number }
> = {
  subtle: { toward: "--background", mix: 0.5, alpha: 0.55 },
  balanced: { toward: "--background", mix: 0, alpha: 1 },
  strong: { toward: "--foreground", mix: 0.2, alpha: 1.7 },
  bold: { toward: "--foreground", mix: 0.4, alpha: 2.5 },
}

const HSL_TRIPLET = /^-?[\d.]+ [\d.]+% [\d.]+%$/
const HSL_WITH_ALPHA = /^(-?[\d.]+ [\d.]+% [\d.]+%) \/ ([\d.]+)$/

/**
 * Rewrites the border tokens of an already-merged token set. Runs after the
 * preset's own tokens are merged in, so a preset that replaces a border
 * (glass does, with a translucent one) is scaled rather than bypassed. A
 * value in any other shape, such as a `var()` reference, passes through.
 */
export function applyBorderIntensity(
  tokens: Record<string, string>,
  intensity: BorderIntensity,
): Record<string, string> {
  // A config written before this axis existed passes `undefined` at runtime.
  if (intensity === "balanced" || !(intensity in BORDER_SHIFT)) return tokens
  const shift = BORDER_SHIFT[intensity]
  const target = tokens[shift.toward]
  const next = { ...tokens }
  for (const key of BORDER_TOKENS) {
    const value = tokens[key]
    if (value === undefined) continue
    const translucent = HSL_WITH_ALPHA.exec(value)
    if (translucent) {
      const alpha = Math.min(1, parseFloat(translucent[2] ?? "1") * shift.alpha)
      next[key] = `${translucent[1]} / ${Math.round(alpha * 100) / 100}`
    } else if (target && HSL_TRIPLET.test(value) && HSL_TRIPLET.test(target)) {
      const from = hslStringToOklch(value)
      const toL = hslStringToOklch(target).L
      next[key] = oklchToHslString({
        ...from,
        L: from.L + (toL - from.L) * shift.mix,
      })
    }
  }
  return next
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
  const surface: ColorScale = resolveNeutralScale(surfaceColor)
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
  const { fill: primaryFill, foreground: primaryForeground } =
    primaryFillAndLabel(
      mode === "dark"
        ? vibrancyFill(primaryBase, accentIntensity)
        : primaryBase,
    )
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
  // page's color story rather than the brand accent: the chosen neutral ramp's
  // own mid-tone, keeping a warm ground warm.
  const surfaceTint = neutral[500]

  const controlWell = controlWells(
    recipe.surfaceRaised(surface, mode),
    recipe.surfaceSunken(surface, mode),
  )

  const background = capCanvasSaturation(
    mode === "light" ? surface[50] : surface[950],
    CANVAS_SATURATION_CAP[backgroundIntensity],
  )
  // The default preset repaints the canvas over the top of the content area,
  // where page titles, toolbars and the first fields sit, so the tokens read
  // there are also solved against that strip. Glass paints no strip.
  const paintsStrip = backgroundStyle === "gradient" && preset !== "glass"
  const stripGrounds = paintsStrip
    ? [contentStripGround(background, surfaceTint, mode, backgroundIntensity)]
    : []
  const mutedOnPage = tierClearing(neutral, background, MUTED_TARGET_RATIO)
  // The strip needs only the 4.5:1 text floor where the page solve aims for
  // 7:1, so whichever result sits further from the page wins.
  const mutedOnStrip = paintsStrip
    ? tierClearingAll(neutral, [background, ...stripGrounds], TEXT_FLOOR)
    : mutedOnPage
  const mutedForeground =
    contrastRatio(mutedOnStrip, background) >
    contrastRatio(mutedOnPage, background)
      ? mutedOnStrip
      : mutedOnPage
  const card = mode === "light" ? "0 0% 100%" : surface[900]
  // Popovers paint the card rung; named so the text solves can list it.
  const popover = card
  const muted = mode === "light" ? surface[100] : surface[800]
  // Status colours are read mostly as text, so each clears 4.5:1 against the
  // page and the card. In dark, ink is listed too, which makes the ink label
  // exact on ramps whose step 900 sits darker than ink itself.
  const statusSurfaces =
    mode === "light" ? [background, card] : [background, card, INK]
  // Status text also sits on its own tint, so the solve holds it there too.
  const statusText = (source: string) =>
    ensureContrastOnTint(
      ensureContrastAll(source, statusSurfaces, TEXT_FLOOR),
      [background, card],
      null,
      STATUS_TINT_CEILING,
      TEXT_FLOOR,
    )
  const destructiveSource = isRedishAccent
    ? mode === "light"
      ? "25 95% 53%"
      : "21 90% 48%"
    : mode === "light"
      ? "0 84% 60%"
      : "0 72% 51%"
  const destructive = statusText(destructiveSource)
  // Fills (the destructive button, badge and notification count) need a
  // white label, which a text-safe dark red cannot carry.
  const destructiveSolid = solveWhiteFill(destructiveSource)
  const success = statusText(
    mode === "light" ? accentColors.emerald[500] : accentColors.emerald[400],
  )
  const warning = statusText(
    mode === "light" ? accentColors.amber[500] : accentColors.amber[400],
  )
  const info = statusText(
    mode === "light" ? accentColors.blue[500] : accentColors.blue[400],
  )

  const primaryMark = ensureContrastAll(
    primaryValue,
    [background, ...stripGrounds],
    MARK_FLOOR,
  )
  // The 3:1 edge a field draws along its bottom and an unchecked checkbox,
  // radio or switch draws all round. It is one value per theme, so it is
  // solved against every ground a control can sit on. It stays out of
  // BORDER_TOKENS: borderIntensity is a taste axis, and its subtle step
  // would pull the edge back under 3:1. A gradient canvas paints the surface
  // hue over the page, so the page a field really sits on is listed at the
  // canvas's loudest point rather than as `background` alone.
  const fieldEdge = tierClearingAll(
    neutral,
    [
      background,
      card,
      recipe.surfaceSunken(surface, mode),
      controlWell.deep,
      recipe.surfaceSidebar(surface, mode),
      recipe.surfaceHeader(surface, mode),
      ...(backgroundStyle === "gradient"
        ? [
            gradientCanvasPeak(
              background,
              surfaceTint,
              mode,
              backgroundIntensity,
            ),
          ]
        : []),
      ...stripGrounds,
    ],
    preset === "glass" ? GLASS_EDGE_FLOOR : MARK_FLOOR,
  )

  const tokens: Record<string, string> = {
    "--primary": primaryMark,
    // Primary as text (links, selected tab and toggle labels), including on
    // --primary tints. `--primary` keeps its 3:1 mark floor for borders,
    // tints and preset surfaces.
    "--primary-text": ensureContrastOnTint(
      primaryValue,
      [background, card, ...stripGrounds],
      primaryMark,
      PRIMARY_TINT_CEILING,
      TEXT_FLOOR,
    ),
    "--primary-fill": primaryFill,
    "--primary-foreground": primaryForeground,
    "--primary-fill-wash": washFor(primaryForeground),
    "--ring": ensureContrastAll(
      ringValue,
      [background, ...stripGrounds],
      MARK_FLOOR,
    ),
    "--focus-ring": ensureContrastAll(
      focusRingValue,
      [background, ...stripGrounds],
      MARK_FLOOR,
    ),
    "--surface-tint": surfaceTint,

    "--chart-1": chartColors[0] ?? "",
    "--chart-2": chartColors[1] ?? "",
    "--chart-3": chartColors[2] ?? "",
    "--chart-4": chartColors[3] ?? "",
    "--chart-5": chartColors[4] ?? "",

    "--background": background,
    "--foreground": foreground,

    "--card": card,
    "--card-foreground": mode === "light" ? neutral[900] : neutral[50],

    "--popover": popover,
    "--popover-foreground": mode === "light" ? neutral[900] : neutral[50],

    "--secondary": mode === "light" ? surface[100] : surface[800],
    "--secondary-foreground": mode === "light" ? neutral[900] : neutral[50],

    "--muted": muted,
    "--muted-foreground": mutedForeground,
    // Solved against every surface it is used on. Not for muted fills, where
    // it measures 3.81–4.35:1; solving against those too left it nearly equal
    // to --muted-foreground in dark mode.
    "--legend": tierClearingAll(
      neutral,
      [background, card, popover],
      LEGEND_TARGET_RATIO,
    ),

    "--accent": mode === "light" ? surface[100] : surface[800],
    "--accent-foreground": mode === "light" ? neutral[900] : neutral[50],

    "--destructive": destructive,
    "--destructive-foreground": bestLabel(destructive),
    "--destructive-solid": destructiveSolid,
    "--destructive-solid-foreground": WHITE,
    "--destructive-solid-wash": washFor(WHITE),

    "--success": success,
    "--success-foreground": bestLabel(success),

    "--warning": warning,
    "--warning-foreground": bestLabel(warning),

    "--info": info,
    "--info-foreground": bestLabel(info),

    "--border": border,
    "--input": inputValue,
    "--field-edge-color": fieldEdge,

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
    // against a 4.5:1 requirement.
    "--sidebar-foreground-muted": mutedForeground,
    "--sidebar-border": isSidebarDark(mode) ? "0 0% 100% / 0.1" : surface[200],
    "--sidebar-hover-bg": isSidebarDark(mode)
      ? `${accent[500]} / ${SIDEBAR_HOVER[accentIntensity].darkAlpha}`
      : accent[SIDEBAR_HOVER[accentIntensity].light],
    "--sidebar-active-bg": isSidebarDark(mode)
      ? `${accent[500]} / ${SIDEBAR_ACTIVE[accentIntensity].darkAlpha}`
      : accent[SIDEBAR_ACTIVE[accentIntensity].light],
    "--surface-header": recipe.surfaceHeader(surface, mode),

    "--border-subtle": recipe.borderSubtle(surface, mode),
    "--border-default": recipe.borderDefault(surface, mode),
    "--border-strong": recipe.borderStrong(surface, mode),

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
    "--content-gradient-overlay": paintsStrip
      ? `var(--canvas-blob-a), var(--canvas-blob-b), var(--canvas-blob-c), var(--canvas-blob-d), var(--canvas-ink)`
      : "none",

    ...sfHueTokens,
  }

  return tokens
}
