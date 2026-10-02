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
import {
  contrastRatio,
  hslStringToOklch,
  oklchToHslString,
} from "@theme/engine/oklch"
import { CANVAS_SATURATION_CAP, contentStripGround } from "./canvas"
import {
  INK,
  STATUS_NAMES,
  WHITE,
  placeStep,
  solveSteps,
  type DarkAccentChroma,
} from "./steps"

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

/** The ramp every neutral step and text tier is drawn from. */
export function resolveNeutralScale(surfaceColor: SurfaceColor): ColorScale {
  return surfaceColors[surfaceColor]
}

/** The scale an accent's stops are read from; `neutral` reads the chosen neutral. */
export function resolveAccentScale(
  accentColor: AccentColor,
  surfaceColor: SurfaceColor,
): ColorScale {
  return accentColor === "neutral"
    ? resolveNeutralScale(surfaceColor)
    : accentColors[accentColor]
}

function resolveSfHueTokens(
  neutral: ColorScale,
  backgroundStyle: BackgroundStyle,
): { "--sf-hue": string; "--sf-hue-2": string; "--sf-hue-3": string } {
  if (backgroundStyle !== "gradient") {
    return {
      "--sf-hue": "transparent",
      "--sf-hue-2": "transparent",
      "--sf-hue-3": "transparent",
    }
  }
  return {
    "--sf-hue": `hsl(${neutral[500]})`,
    "--sf-hue-2": `hsl(${neutral[400]})`,
    "--sf-hue-3": `hsl(${neutral[300]})`,
  }
}

/** A shape or boundary must be distinguishable from its ground. */
const MARK_FLOOR = 3
const LEGEND_TARGET_RATIO = 4.6
const BLACK = "0 0% 0%"

/** Until the darkAccentChroma axis replaces accentIntensity. */
const CHROMA_FOR_INTENSITY: Record<AccentIntensity, DarkAccentChroma> = {
  calm: "calm",
  balanced: "standard",
  vivid: "vivid",
  intense: "vivid",
}

const tierCache = new Map<string, string>()

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
 * What a hover or press mixes into a fill: the end of the lightness range away
 * from its label. A fill sits at its label's contrast floor, so mixing toward
 * the label drops under AA.
 */
function washFor(label: string): string {
  return label === WHITE ? BLACK : WHITE
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

  const accent = resolveAccentScale(accentColor, surfaceColor)
  const neutral = resolveNeutralScale(surfaceColor)
  const dark = mode === "dark"
  const glass = preset === "glass"
  // The neutral's own mid-tone: the hue the gradient canvas paints and glass's
  // inner glow follows.
  const surfaceTint = neutral[500]
  const gradient = backgroundStyle === "gradient"
  // The default preset repaints the canvas over the top of the content area;
  // glass paints no strip.
  const paintsStrip = gradient && !glass
  const redish =
    accentColor === "red" || accentColor === "rose" || accentColor === "pink"

  const steps = solveSteps({
    mode,
    accent: accentColor === "neutral" ? null : accent,
    neutral,
    contrast: "standard",
    darkAccentChroma: CHROMA_FOR_INTENSITY[accentIntensity],
    tintWithAccent: false,
    gradient: gradient
      ? {
          surfaceHue: surfaceTint,
          intensity: backgroundIntensity,
          strip: paintsStrip,
        }
      : null,
    pageSaturationCap: CANVAS_SATURATION_CAP[backgroundIntensity],
    glass,
    status: {
      destructive: redish ? accentColors.orange : accentColors.red,
      success: accentColors.emerald,
      warning: accentColors.amber,
      info: accentColors.blue,
    },
  })
  const n = (step: number) => steps.neutral[step - 1] as string
  const p = (step: number) => steps.primary[step - 1] as string

  const background = n(1)
  const card = n(2)
  const sunken = dark ? background : n(3)
  // Glass's dark borders keep its heavier recipe (stops 600, 500, 400).
  const glassDark = glass && dark
  const borderSubtle = glassDark ? placeStep(neutral, 7) : n(3)
  const borderDefault = glassDark ? placeStep(neutral, 6) : n(6)
  const borderStrong = glassDark ? placeStep(neutral, 5) : n(8)
  const stripGrounds = paintsStrip
    ? [contentStripGround(background, surfaceTint, mode, backgroundIntensity)]
    : []
  const controlWell = controlWells(card, sunken)
  const isLightGlass = glass && !dark

  const tokens: Record<string, string> = {}
  for (let i = 1; i <= 12; i++) {
    tokens[`--neutral-${i}`] = n(i)
    tokens[`--primary-${i}`] = p(i)
  }
  for (const name of STATUS_NAMES) {
    const pair = steps.status[name]
    tokens[`--${name}-subtle`] = pair.subtle
    tokens[`--${name}-edge`] = pair.edge
    tokens[`--${name}-text`] = pair.text
    tokens[`--${name}-solid`] = pair.solid
    tokens[`--${name}-solid-foreground`] = pair.solidForeground
    tokens[`--${name}-solid-wash`] = pair.solidWash
    // The 6.x status tokens, until their consumers move to the pairs.
    tokens[`--${name}`] = pair.text
    tokens[`--${name}-foreground`] = bestLabel(pair.text)
  }
  steps.chart.forEach((colour, i) => {
    tokens[`--chart-${i + 1}`] = `hsl(${colour})`
  })

  Object.assign(tokens, {
    "--primary": p(8),
    "--ring": p(8),
    "--primary-text": p(11),
    "--primary-fill": p(9),
    "--primary-foreground": steps.primaryLabel,
    "--primary-fill-wash": washFor(steps.primaryLabel),
    "--focus-ring": ensureContrastAll(
      accent[FOCUS_RING_SHADE[accentIntensity][mode]],
      [background, ...stripGrounds],
      MARK_FLOOR,
    ),
    "--surface-tint": surfaceTint,

    "--background": background,
    "--foreground": n(12),
    "--card": card,
    "--card-foreground": n(12),
    "--popover": card,
    "--popover-foreground": n(12),
    "--secondary": n(3),
    "--secondary-foreground": n(12),
    "--muted": n(3),
    "--muted-foreground": n(11),
    "--legend": tierClearingAll(
      neutral,
      [background, card],
      LEGEND_TARGET_RATIO,
    ),
    "--accent": n(3),
    "--accent-foreground": n(12),

    "--border": n(6),
    "--input": dark ? borderSubtle : n(6),
    // The deep control-depth well sits below every other ground; the edge
    // clears it too while that axis exists.
    "--field-edge-color": ensureContrastAll(
      n(7),
      [controlWell.deep],
      glass ? 3.5 : MARK_FLOOR,
    ),

    "--surface-base": background,
    "--surface-raised": card,
    "--surface-overlay": dark ? n(3) : card,
    "--surface-sunken": sunken,
    "--control-well-subtle": controlWell.subtle,
    "--control-well-deep": controlWell.deep,
    "--surface-sidebar": dark && !glass ? card : background,
    "--sidebar-foreground": steps.sidebarForeground,
    "--sidebar-foreground-hover": dark ? WHITE : n(12),
    "--sidebar-foreground-muted": n(11),
    "--sidebar-border": dark ? "0 0% 100% / 0.1" : n(6),
    "--sidebar-hover-bg": dark
      ? `${accent[500]} / ${SIDEBAR_HOVER[accentIntensity].darkAlpha}`
      : accent[SIDEBAR_HOVER[accentIntensity].light],
    "--sidebar-active-bg": dark
      ? `${accent[500]} / ${SIDEBAR_ACTIVE[accentIntensity].darkAlpha}`
      : accent[SIDEBAR_ACTIVE[accentIntensity].light],
    "--surface-header": card,

    "--border-subtle": borderSubtle,
    "--border-default": borderDefault,
    "--border-strong": borderStrong,

    "--shadow-dropdown": isLightGlass
      ? presets[preset].shadowDropdown.replace(
          /rgb\(0 0 0 \//g,
          "rgb(16 24 40 /",
        )
      : presets[preset].shadowDropdown,

    "--bg-style": backgroundStyle,
    "--noise-opacity": gradient ? (dark ? "0.5" : "0.6") : "0",
    "--content-gradient-overlay": paintsStrip
      ? `var(--canvas-blob-a), var(--canvas-blob-b), var(--canvas-blob-c), var(--canvas-blob-d), var(--canvas-ink)`
      : "none",

    ...resolveSfHueTokens(neutral, backgroundStyle),
  })

  return tokens
}
