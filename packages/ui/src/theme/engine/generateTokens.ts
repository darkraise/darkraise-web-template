import type {
  AccentColor,
  BackgroundStyle,
  BackgroundIntensity,
  Contrast,
  DarkAccentChroma,
  SurfaceColor,
  ResolvedMode,
  ColorScale,
} from "@theme/types"
import { accentColors } from "@theme/palettes/accentColors"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import { contrastRatio } from "@theme/engine/oklch"
import { CANVAS_SATURATION_CAP, contentStripGround } from "./canvas"
import { STATUS_NAMES, WHITE, placeStep, solveSteps } from "./steps"

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
  /** Frosted chrome over the canvas: no content strip, chrome on the page ground. */
  frosted: boolean
  backgroundStyle: BackgroundStyle
  mode: ResolvedMode
  contrast: Contrast
  darkAccentChroma: DarkAccentChroma
  tintWithAccent: boolean
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

/**
 * What a hover or press mixes into a fill: the end of the lightness range away
 * from its label. A fill sits at its label's contrast floor, so mixing toward
 * the label drops under AA.
 */
function washFor(label: string): string {
  return label === WHITE ? BLACK : WHITE
}

export function generateTokens(
  input: GenerateTokensInput,
): Record<string, string> {
  const {
    accentColor,
    surfaceColor,
    frosted,
    backgroundStyle,
    mode,
    contrast,
    darkAccentChroma,
    tintWithAccent,
    backgroundIntensity = "balanced",
  } = input

  const accent = resolveAccentScale(accentColor, surfaceColor)
  const neutral = resolveNeutralScale(surfaceColor)
  const dark = mode === "dark"
  // The neutral's own mid-tone: the hue the gradient canvas paints.
  const surfaceTint = neutral[500]
  const gradient = backgroundStyle === "gradient"
  // Unfrosted chrome repaints the canvas over the top of the content area;
  // frosted chrome shows the canvas through itself, so no strip is painted.
  const paintsStrip = gradient && !frosted
  const redish =
    accentColor === "red" || accentColor === "rose" || accentColor === "pink"

  const steps = solveSteps({
    mode,
    accent: accentColor === "neutral" ? null : accent,
    neutral,
    contrast,
    darkAccentChroma,
    tintWithAccent,
    gradient: gradient
      ? {
          surfaceHue: surfaceTint,
          intensity: backgroundIntensity,
          strip: paintsStrip,
        }
      : null,
    pageSaturationCap: CANVAS_SATURATION_CAP[backgroundIntensity],
    frosted,
    status: {
      destructive: redish ? accentColors.orange : accentColors.red,
      success: accentColors.emerald,
      warning: accentColors.amber,
      info: accentColors.blue,
    },
  })
  const n = (step: number) => steps.neutral[step - 1] as string
  const p = (step: number) => steps.primary[step - 1] as string
  const sidebarMark = accentColor === "neutral" || frosted ? accent[500] : p(8)

  const background = n(1)
  const card = n(2)
  const sunken = dark ? background : n(3)
  // Glass's dark borders keep its heavier recipe (stops 600, 500, 400).
  const glassDark = frosted && dark
  const borderSubtle = glassDark ? placeStep(neutral, 7) : n(3)
  const borderDefault = glassDark ? placeStep(neutral, 6) : n(6)
  const borderStrong = glassDark ? placeStep(neutral, 5) : n(8)
  const stripGrounds = paintsStrip
    ? [contentStripGround(background, surfaceTint, mode, backgroundIntensity)]
    : []
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
      accent[dark ? 200 : 300],
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
    "--field-edge-color": n(7),

    "--surface-base": background,
    "--surface-raised": card,
    "--surface-overlay": dark ? n(3) : card,
    "--surface-sunken": sunken,
    "--control-well": sunken,
    "--surface-sidebar": dark && !frosted ? card : background,
    "--sidebar-foreground": steps.sidebarForeground,
    "--sidebar-foreground-hover": dark ? WHITE : n(12),
    "--sidebar-foreground-muted": n(11),
    "--sidebar-border": dark ? "0 0% 100% / 0.1" : n(6),
    "--sidebar-hover-bg": dark ? `${sidebarMark} / 0.15` : accent[100],
    "--sidebar-active-bg": dark ? `${sidebarMark} / 0.25` : accent[200],
    "--surface-header": card,

    "--border-subtle": borderSubtle,
    "--border-default": borderDefault,
    "--border-strong": borderStrong,

    "--bg-style": backgroundStyle,
    "--noise-opacity": gradient ? (dark ? "0.5" : "0.6") : "0",
    "--content-gradient-overlay": paintsStrip
      ? `var(--canvas-blob-a), var(--canvas-blob-b), var(--canvas-blob-c), var(--canvas-blob-d), var(--canvas-ink)`
      : "none",

    ...resolveSfHueTokens(neutral, backgroundStyle),
  })

  return tokens
}
