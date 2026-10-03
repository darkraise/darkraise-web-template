import type {
  BackgroundIntensity,
  ColorScale,
  Contrast,
  DarkAccentChroma,
  ResolvedMode,
} from "@theme/types"
import {
  hslStringToOklch,
  mixedContrast,
  oklchToHslString,
  relativeLuminance,
  type Oklch,
} from "@theme/engine/oklch"
import {
  capCanvasSaturation,
  contentStripGround,
  gradientCanvasPeak,
} from "./canvas"

export type { Contrast, DarkAccentChroma }
export type StatusName = "destructive" | "success" | "warning" | "info"
export const STATUS_NAMES: readonly StatusName[] = [
  "destructive",
  "success",
  "warning",
  "info",
]

export interface StatusPair {
  subtle: string
  edge: string
  text: string
  solid: string
  solidForeground: string
  solidWash: string
}

export interface Miss {
  step: string
  ratio: number
  target: number
}

export interface SolveInput {
  mode: ResolvedMode
  /** `null` is the `neutral` accent: primary steps come from the neutral ramp. */
  accent: ColorScale | null
  neutral: ColorScale
  contrast: Contrast
  darkAccentChroma: DarkAccentChroma
  tintWithAccent: boolean
  /** Set under a gradient background; `strip` when the content strip paints. */
  gradient: {
    surfaceHue: string
    intensity: BackgroundIntensity
    strip: boolean
  } | null
  pageSaturationCap: number | null
  /** Frosted chrome: the sidebar is painted on the page ground in both modes. */
  frosted: boolean
  status: Record<StatusName, ColorScale>
}

export interface Steps {
  /** Index 0 is step 1. */
  neutral: string[]
  primary: string[]
  primaryLabel: string
  /** Sidebar link text: today's stop 600 (light) and 300 (dark), tinted with the ramp. */
  sidebarForeground: string
  status: Record<StatusName, StatusPair>
  chart: string[]
  /** Floors no lightness could reach; the closest value found is emitted. */
  misses: Miss[]
}

export const WHITE = "0 0% 100%"
export const INK = "222 47% 11%"
const BLACK = "0 0% 0%"
const NEAR_BLACK = "0 0% 3%"
const STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
/** Below this OKLCH chroma a hue angle is noise, so the other end's hue is used. */
const HUE_FLOOR = 0.01

const MARK = 3
const TEXT = 4.5
/** AA for body-size text, with headroom so integer HSL rounding cannot land under 4.5. */
const LABEL = 4.6
const SECONDARY_TEXT_ON_PAGE = 7
/** Strongest --primary tint primary-coloured text sits on (bg-primary/20 today). */
const PRIMARY_TINT_CEILING = 0.24
/** Glass cards are translucent over the canvas, so the field edge keeps headroom. */
const GLASS_EDGE_FLOOR = 3.5
const HOVER_STEP = 0.04
/** Hover, pressed and selected each sit at least this OKLCH L past the previous plane. */
const PLANE_GAP = 0.012
/** A step out of order within its role group moves this OKLCH L past its predecessor per round. */
const ORDER_NUDGE = 0.004
const ORDER_ROUNDS = 8
/**
 * Stop 500 OKLCH lightness from which a dark fill keeps an ink label: amber,
 * yellow and lime sit at 0.765-0.786, every other hue at 0.72 or below.
 */
const DARK_INK_LIGHTNESS = 0.74
/** Today's dark tints are the accent at 15% alpha over the card, about 0.03 chroma. */
const DARK_TINT_CHROMA = 0.05
const TINT_CHROMA_SHARE = 0.12
const TINT_CHROMA_CAP = 0.02

/**
 * Light moves the page (the card is already white); dark moves the card (the
 * page stays at stop 950). Positions on the extended scale: 0 white, 1 stop
 * 50, ... 11 stop 950, 12 near-black.
 */
const PAGE_GAP = {
  light: { low: 0.7, standard: 1.0, high: 1.4 },
  dark: { low: 10.4, standard: 10.0, high: 9.6 },
} as const
/** Card-to-page ratio floors (spec decision 4). */
const PAGE_FLOOR = {
  light: { low: 1.02, standard: 1.04, high: 1.1 },
  dark: { low: 1.06, standard: 1.1, high: 1.16 },
} as const
/** Step 6 shift toward the text end, in positions. */
const EDGE_SHIFT = { low: -0.3, standard: 0, high: 0.7 } as const
/** Step 6 against the card; these keep today's stop 200 / 700 border at standard. */
const EDGE_FLOOR = { low: 1.12, standard: 1.2, high: 1.4 } as const
const CHROMA_SCALE = { calm: 0.6, standard: 1, vivid: 1.25 } as const

/**
 * Starting positions, index 0 = step 1. `null` steps are solved, not placed.
 * Neutral 3-5 are offsets from the light page and the dark card; dark primary
 * 2-5 are offsets from the dark card, so they move with PAGE_GAP.
 */
const NEUTRAL_POS = {
  light: [null, null, 1, 1.4, 1.8, 3.0, 5.0, 6.0, 6.3, 6.6, null, 10.0],
  dark: [11.0, null, -1, -1.4, -1.8, 8.0, 7.0, 6.0, 5.6, 5.3, null, 1.0],
} as const
const PRIMARY_POS = {
  light: [0.6, 1.0, 1.6, 2.4, 3.2, 4.0, 5.0, 6.0, 6.0, null, 6.0, 9.0],
  dark: [10.8, -0.2, -0.6, -1.0, -1.4, 8.0, 7.0, 6.0, 6.0, null, 6.0, 3.0],
} as const
/** Glass's mark and fill keep today's heavier shades (stop 600 light, 400 dark). */
const GLASS_PRIMARY_POS = { light: 7.0, dark: 5.0 } as const

/** OKLCH hue in degrees and chroma; lightness starts at CHART_L. */
const CHART = [
  [295, 0.17],
  [185, 0.12],
  [55, 0.16],
  [255, 0.16],
  [350, 0.16],
  [130, 0.17],
  [85, 0.15],
  [220, 0.13],
] as const
const CHART_L = { light: 0.62, dark: 0.72 } as const

const anchorCache = new Map<ColorScale, Oklch[]>()

function anchors(scale: ColorScale): Oklch[] {
  let cached = anchorCache.get(scale)
  if (!cached) {
    cached = [WHITE, ...STOPS.map((stop) => scale[stop]), NEAR_BLACK].map(
      hslStringToOklch,
    )
    anchorCache.set(scale, cached)
  }
  return cached
}

/** The colour at `position` on the scale extended with white and near-black. */
export function sampleScale(scale: ColorScale, position: number): Oklch {
  const all = anchors(scale)
  const p = Math.min(12, Math.max(0, position))
  const i = Math.min(11, Math.floor(p))
  const t = p - i
  const from = all[i] as Oklch
  const to = all[i + 1] as Oklch
  if (t === 0) return from
  let h: number
  if (from.C < HUE_FLOOR && to.C < HUE_FLOOR) h = from.h
  else if (from.C < HUE_FLOOR) h = to.h
  else if (to.C < HUE_FLOOR) h = from.h
  else {
    let d = to.h - from.h
    if (d > Math.PI) d -= 2 * Math.PI
    if (d < -Math.PI) d += 2 * Math.PI
    h = from.h + d * t
  }
  return { L: from.L + (to.L - from.L) * t, C: from.C + (to.C - from.C) * t, h }
}

export function placeStep(scale: ColorScale, position: number): string {
  return oklchToHslString(sampleScale(scale, position))
}

const luminanceCache = new Map<string, number>()

/** `contrastRatio` with each triplet parsed once: the solve measures the same values thousands of times. */
function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

function luminance(hsl: string): number {
  let value = luminanceCache.get(hsl)
  if (value === undefined) {
    value = relativeLuminance(hsl)
    luminanceCache.set(hsl, value)
  }
  return value
}

function lightnessOf(hsl: string): number {
  return parseFloat(hsl.split(" ")[2] ?? "0")
}

function withLightness(hsl: string, lightness: number): string {
  const [h, s] = hsl.split(" ")
  return `${h ?? "0"} ${s ?? "0%"} ${lightness}%`
}

function minRatio(value: string, grounds: readonly string[]): number {
  return Math.min(...grounds.map((ground) => contrastRatio(value, ground)))
}

/**
 * `value` when `clears` accepts it, otherwise the nearest integer lightness on
 * the same hue and saturation that it accepts. A sound value keeps its place.
 */
function nearest(
  value: string,
  clears: (candidate: string) => boolean,
): { value: string; ok: boolean } {
  if (clears(value)) return { value, ok: true }
  const start = Math.round(lightnessOf(value))
  for (let d = 1; d <= 100; d++) {
    for (const l of [start - d, start + d]) {
      if (l < 0 || l > 100) continue
      const candidate = withLightness(value, l)
      if (clears(candidate)) return { value: candidate, ok: true }
    }
  }
  return { value, ok: false }
}

/**
 * The quietest integer lightness on `base`'s hue and saturation that clears
 * `target` against every ground, searched on the side away from the grounds
 * (darker in light mode, lighter in dark). Contrast is monotonic in lightness
 * there, so a bisection finds it.
 */
function quietestClearing(
  base: string,
  grounds: readonly string[],
  target: number,
  mode: ResolvedMode,
): { value: string; ok: boolean } {
  const clears = (l: number) =>
    minRatio(withLightness(base, l), grounds) >= target
  if (mode === "light") {
    let lo = 0
    let hi = Math.floor(Math.min(...grounds.map(lightnessOf)))
    if (!clears(lo)) return { value: withLightness(base, 0), ok: false }
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (clears(mid)) lo = mid
      else hi = mid
    }
    return { value: withLightness(base, clears(hi) ? hi : lo), ok: true }
  }
  let lo = Math.ceil(Math.max(...grounds.map(lightnessOf)))
  let hi = 100
  if (!clears(hi)) return { value: withLightness(base, 100), ok: false }
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (clears(mid)) hi = mid
    else lo = mid
  }
  return { value: withLightness(base, clears(lo) ? lo : hi), ok: true }
}

/**
 * Light: `base` when it carries white at LABEL, otherwise the lightest fill
 * below it that does. Dark: the lightest fill on the hue that carries white at
 * LABEL, so the fill sits as far above the card as the label allows (row 12).
 */
function whiteFill(base: string, mode: ResolvedMode): string {
  const { L, C, h } = hslStringToOklch(base)
  if (mode === "light" && contrastRatio(WHITE, base) >= LABEL) return base
  // White's contrast falls as the fill lightens, so the lightest clearing
  // lightness is found by bisection below `base` (light) or anywhere (dark).
  let lo = 0
  let hi = mode === "light" ? L : 1
  for (let k = 0; k < 24; k++) {
    const mid = (lo + hi) / 2
    if (contrastRatio(WHITE, oklchToHslString({ L: mid, C, h })) >= LABEL)
      lo = mid
    else hi = mid
  }
  return oklchToHslString({ L: lo, C, h })
}

function uniq(values: readonly string[]): string[] {
  return [...new Set(values)]
}

const scaleIds = new WeakMap<ColorScale, number>()
let nextScaleId = 0

function scaleId(scale: ColorScale): number {
  let id = scaleIds.get(scale)
  if (id === undefined) {
    id = nextScaleId++
    scaleIds.set(scale, id)
  }
  return id
}

const solveCache = new Map<string, Steps>()

function cacheKey(input: SolveInput): string {
  const { accent, neutral, gradient, status } = input
  return [
    input.mode,
    accent ? scaleId(accent) : "neutral",
    scaleId(neutral),
    input.contrast,
    input.darkAccentChroma,
    input.tintWithAccent,
    gradient
      ? `${gradient.surfaceHue}/${gradient.intensity}/${gradient.strip}`
      : "solid",
    input.pageSaturationCap,
    input.frosted,
    scaleId(status.destructive),
    scaleId(status.success),
    scaleId(status.warning),
    scaleId(status.info),
  ].join("|")
}

export function solveSteps(input: SolveInput): Steps {
  const key = cacheKey(input)
  const cached = solveCache.get(key)
  if (cached) return cached
  const result = solve(input)
  solveCache.set(key, result)
  return result
}

function solve(input: SolveInput): Steps {
  const { mode, contrast } = input
  const misses: Miss[] = []
  const repairs = new Map<
    string,
    { grounds: readonly string[]; target: number }
  >()
  const repair = (
    step: string,
    value: string,
    grounds: readonly string[],
    target: number,
  ): string => {
    repairs.set(step, { grounds, target })
    const r = nearest(value, (c) => minRatio(c, grounds) >= target)
    if (!r.ok) misses.push({ step, ratio: minRatio(value, grounds), target })
    return r.value
  }
  const tintHue =
    input.tintWithAccent && input.accent
      ? hslStringToOklch(input.accent[500])
      : null
  const neutralAt = (position: number): string => {
    const c = sampleScale(input.neutral, position)
    return oklchToHslString(
      tintHue
        ? {
            L: c.L,
            C: Math.min(tintHue.C * TINT_CHROMA_SHARE, TINT_CHROMA_CAP),
            h: tintHue.h,
          }
        : c,
    )
  }
  const darkTint = (
    scale: ColorScale,
    position: number,
    cap = DARK_TINT_CHROMA,
  ): string => {
    const hue = sampleScale(scale, 6)
    return oklchToHslString({
      L: sampleScale(input.neutral, position).L,
      C: Math.min(hue.C, cap),
      h: hue.h,
    })
  }

  const n: string[] = new Array<string>(12)
  const pageFloor = PAGE_FLOOR[mode][contrast]
  let pagePos: number
  let cardPos: number
  if (mode === "light") {
    cardPos = 0
    pagePos = PAGE_GAP.light[contrast]
    const pageAt = (position: number) =>
      capCanvasSaturation(neutralAt(position), input.pageSaturationCap)
    let page = pageAt(pagePos)
    while (contrastRatio(page, WHITE) < pageFloor && pagePos < 4) {
      pagePos += 0.05
      page = pageAt(pagePos)
    }
    n[0] = page
    n[1] = WHITE
  } else {
    pagePos = 11
    cardPos = PAGE_GAP.dark[contrast]
    const page = capCanvasSaturation(
      neutralAt(pagePos),
      input.pageSaturationCap,
    )
    let card = neutralAt(cardPos)
    while (contrastRatio(card, page) < pageFloor && cardPos > 7) {
      cardPos -= 0.05
      card = neutralAt(cardPos)
    }
    n[0] = page
    n[1] = card
  }
  const page = n[0]
  const card = n[1]
  if (contrastRatio(page, card) < pageFloor)
    misses.push({
      step: "neutral-2",
      ratio: contrastRatio(page, card),
      target: pageFloor,
    })
  const pos = NEUTRAL_POS[mode]
  const planeBase = mode === "light" ? pagePos : cardPos
  for (const i of [2, 3, 4]) n[i] = neutralAt(planeBase + (pos[i] as number))
  // Near stops 50-100 the palettes barely move in lightness, so each plane is
  // also held PLANE_GAP further from the card than the one before it.
  for (const i of [2, 3, 4]) {
    const before = hslStringToOklch(n[i - 1] as string).L
    const away = mode === "light" ? -1 : 1
    const placed = hslStringToOklch(n[i] as string)
    let l = placed.L
    while (
      (hslStringToOklch(n[i] as string).L - before) * away < PLANE_GAP &&
      l > 0 &&
      l < 1
    ) {
      l += away * 0.002
      n[i] = oklchToHslString({ ...placed, L: l })
    }
  }

  const sunken = mode === "light" ? (n[2] as string) : page
  const sidebar = mode === "light" || input.frosted ? page : card
  const canvasGrounds: string[] = []
  const stripGrounds: string[] = []
  if (input.gradient) {
    const { surfaceHue, intensity, strip } = input.gradient
    canvasGrounds.push(gradientCanvasPeak(page, surfaceHue, mode, intensity))
    if (strip)
      stripGrounds.push(contentStripGround(page, surfaceHue, mode, intensity))
  }
  const edgeGrounds = uniq([
    page,
    card,
    sunken,
    sidebar,
    ...canvasGrounds,
    ...stripGrounds,
  ])
  const textGrounds = uniq([page, card, n[2] as string, ...stripGrounds])
  const edgeShift = EDGE_SHIFT[contrast] * (mode === "light" ? 1 : -1)

  n[5] = repair(
    "neutral-6",
    neutralAt((pos[5] as number) + edgeShift),
    [card],
    EDGE_FLOOR[contrast],
  )
  n[6] = repair(
    "neutral-7",
    neutralAt(pos[6] as number),
    edgeGrounds,
    input.frosted ? GLASS_EDGE_FLOOR : MARK,
  )
  n[7] = repair("neutral-8", neutralAt(pos[7] as number), edgeGrounds, TEXT)
  n[8] = neutralAt(pos[8] as number)
  n[9] = neutralAt(pos[9] as number)
  // Neutral 11 is today's --muted-foreground solve: 7:1 on the page, 4.5:1 on
  // the rest, whichever lands further from the page.
  const onPage = quietestClearing(
    neutralAt(6),
    [page],
    SECONDARY_TEXT_ON_PAGE,
    mode,
  )
  const onRest = quietestClearing(neutralAt(6), textGrounds, TEXT, mode)
  if (!onPage.ok || !onRest.ok)
    misses.push({
      step: "neutral-11",
      ratio: 0,
      target: SECONDARY_TEXT_ON_PAGE,
    })
  n[10] =
    contrastRatio(onPage.value, page) >= contrastRatio(onRest.value, page)
      ? onPage.value
      : onRest.value
  n[11] = repair(
    "neutral-12",
    neutralAt(pos[11] as number),
    textGrounds,
    minRatio(n[10] as string, textGrounds),
  )

  const p: string[] = new Array<string>(12)
  let label: string
  if (input.accent === null) {
    for (let i = 0; i < 7; i++) p[i] = n[i] as string
    for (const i of [7, 8, 10, 11]) p[i] = n[11] as string
    label =
      contrastRatio(WHITE, p[8] as string) >= contrastRatio(INK, p[8] as string)
        ? WHITE
        : INK
  } else {
    const accent = input.accent
    const ppos = PRIMARY_POS[mode]
    const chroma = mode === "dark" ? CHROMA_SCALE[input.darkAccentChroma] : 1
    const place = (position: number): string => {
      const c = sampleScale(accent, position)
      return oklchToHslString({ ...c, C: c.C * chroma })
    }
    for (const i of [0, 1, 2, 3, 4])
      p[i] =
        mode === "light"
          ? place(ppos[i] as number)
          : darkTint(
              accent,
              i === 0 ? (ppos[0] as number) : cardPos + (ppos[i] as number),
              DARK_TINT_CHROMA * chroma,
            )
    p[5] = repair(
      "primary-6",
      place((ppos[5] as number) + edgeShift),
      [card],
      EDGE_FLOOR[contrast],
    )
    p[6] = repair("primary-7", place(ppos[6] as number), edgeGrounds, MARK)
    const markPos = input.frosted
      ? GLASS_PRIMARY_POS[mode]
      : (ppos[7] as number)
    p[7] = repair("primary-8", place(markPos), edgeGrounds, MARK)
    const base = place(
      input.frosted ? GLASS_PRIMARY_POS[mode] : (ppos[8] as number),
    )
    // Dark fills are solved down to a white label, which takes a hue whose
    // mid-tone is very light (amber, yellow, lime) to a brown that no longer
    // reads as the hue; those keep their bright fill under an ink label.
    const white =
      mode === "dark"
        ? hslStringToOklch(base).L < DARK_INK_LIGHTNESS
        : contrastRatio(WHITE, base) >= MARK
    if (white) {
      label = WHITE
      p[8] = whiteFill(base, mode)
    } else {
      label = INK
      p[8] = repair("primary-9", base, [INK], LABEL)
    }
    const link = nearest(place(ppos[10] as number), (c) =>
      textGrounds.every(
        (g) =>
          contrastRatio(c, g) >= TEXT &&
          mixedContrast(c, g, p[7] as string, PRIMARY_TINT_CEILING) >= TEXT,
      ),
    )
    if (!link.ok) misses.push({ step: "primary-11", ratio: 0, target: TEXT })
    p[10] = link.value
    p[11] = repair(
      "primary-12",
      place(ppos[11] as number),
      textGrounds,
      minRatio(p[10] as string, textGrounds),
    )
  }
  const fill = hslStringToOklch(p[8] as string)
  p[9] = oklchToHslString({
    ...fill,
    L: fill.L + (label === WHITE ? -HOVER_STEP : HOVER_STEP),
  })
  if (contrastRatio(label, p[9]) < LABEL)
    misses.push({
      step: "primary-10",
      ratio: contrastRatio(label, p[9]),
      target: LABEL,
    })
  if (mode === "dark" && contrastRatio(p[8] as string, card) < MARK)
    misses.push({
      step: "primary-9-card",
      ratio: contrastRatio(p[8] as string, card),
      target: MARK,
    })

  // Order within role groups: a step closer to the card than its predecessor
  // moves ORDER_NUDGE past it, on its own hue and chroma, and is re-repaired.
  // Taking the predecessor's value instead would merge two roles (the light
  // mark into the edge). Ties from the solve are allowed, and moving away from
  // the card only raises contrast against grounds on the card's side.
  const cardL = hslStringToOklch(card).L
  const away = mode === "light" ? -1 : 1
  const far = (v: string) => Math.abs(hslStringToOklch(v).L - cardL)
  const order = (ramp: string[], name: string, from: number, to: number) => {
    for (let i = from; i <= to; i++) {
      const before = ramp[i - 1] as string
      if (far(ramp[i] as string) >= far(before)) continue
      const own = hslStringToOklch(ramp[i] as string)
      const beforeL = hslStringToOklch(before).L
      const rule = repairs.get(`${name}-${i + 1}`)
      for (let round = 1; round <= ORDER_ROUNDS; round++) {
        const placed = oklchToHslString({
          ...own,
          L: beforeL + away * ORDER_NUDGE * round,
        })
        ramp[i] = rule
          ? nearest(placed, (c) => minRatio(c, rule.grounds) >= rule.target)
              .value
          : placed
        if (far(ramp[i] as string) > far(before)) break
      }
    }
  }
  order(n, "neutral", 2, 4)
  order(n, "neutral", 6, 7)
  order(n, "neutral", 11, 11)
  order(p, "primary", 2, 4)
  order(p, "primary", 6, 7)
  order(p, "primary", 11, 11)

  const status = {} as Record<StatusName, StatusPair>
  const spos = PRIMARY_POS[mode]
  for (const name of STATUS_NAMES) {
    const scale = input.status[name]
    const subtle =
      mode === "light"
        ? placeStep(scale, spos[2] as number)
        : darkTint(scale, cardPos + (spos[2] as number))
    const edge = repair(
      `${name}-edge`,
      placeStep(scale, spos[6] as number),
      uniq([...edgeGrounds, subtle]),
      MARK,
    )
    const text = repair(
      `${name}-text`,
      placeStep(scale, spos[10] as number),
      uniq([...textGrounds, subtle]),
      TEXT,
    )
    const solidBase = placeStep(scale, spos[8] as number)
    const white = name !== "warning"
    const solid = white
      ? whiteFill(solidBase, "light")
      : repair(`${name}-solid`, solidBase, [INK], LABEL)
    status[name] = {
      subtle,
      edge,
      text,
      solid,
      solidForeground: white ? WHITE : INK,
      solidWash: white ? BLACK : WHITE,
    }
  }

  const chartGrounds = uniq([page, card, ...canvasGrounds])
  const chart = CHART.map(([hue, chromaValue], i) =>
    repair(
      `chart-${i + 1}`,
      oklchToHslString({
        L: CHART_L[mode],
        C: chromaValue,
        h: (hue * Math.PI) / 180,
      }),
      chartGrounds,
      MARK,
    ),
  )

  return {
    neutral: n,
    primary: p,
    primaryLabel: label,
    sidebarForeground: neutralAt(mode === "light" ? 7 : 4),
    status,
    chart,
    misses,
  }
}
