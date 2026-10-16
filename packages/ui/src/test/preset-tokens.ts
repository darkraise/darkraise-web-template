import type { ModeTokens } from "@theme/config/schema"
import { PAINT_TOKENS, type PaintToken } from "@theme/config/tokens"
import { composite } from "@theme/engine/oklch"

export const MODES = ["shared", "light", "dark"] as const

export const SHADOW_TOKENS = (Object.keys(PAINT_TOKENS) as PaintToken[]).filter(
  (token) => /Shadow|Edge|Rim|Glow|Ring/.test(token),
)

/** Every token `tokens` writes, in any mode. */
export function written(tokens: ModeTokens | undefined): PaintToken[] {
  return MODES.flatMap(
    (mode) => Object.keys(tokens?.[mode] ?? {}) as PaintToken[],
  )
}

/**
 * The tokens a mode paints: the style's shared and mode tokens, then the
 * preset's, each later one winning, as the style layers cascade.
 */
export function resolvedTokens(
  style: ModeTokens | undefined,
  preset: ModeTokens | undefined,
  mode: "light" | "dark",
): Partial<Record<PaintToken, string>> {
  return {
    ...style?.shared,
    ...style?.[mode],
    ...preset?.shared,
    ...preset?.[mode],
  }
}

/** The layers of a box-shadow or background list, split at its top-level commas. */
export function layers(value: string | undefined): string[] {
  const out: string[] = []
  let depth = 0
  let start = 0
  const text = value ?? ""
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "(") depth++
    else if (text[i] === ")") depth--
    else if (text[i] === "," && depth === 0) {
      out.push(text.slice(start, i).trim())
      start = i + 1
    }
  }
  out.push(text.slice(start).trim())
  return out.filter((layer) => layer !== "")
}

/** White at an alpha, as Glass frosts a well and fills the chip. */
export const FROST = /^rgb\(255 255 255 \/ ([\d.]+)\)$/

/**
 * A 1px chip edge drawn in one engine colour, at full or a given alpha, or
 * in one mixed in sRGB with a share of another:
 * `color-mix(in srgb, hsl(var(--a)), hsl(var(--b)) n%)`.
 */
export const CHIP_EDGE =
  /^0 0 0 1px (?:hsl\(var\((--[\w-]+)\)(?: \/ ([\d.]+))?\)|color-mix\(in srgb, hsl\(var\((--[\w-]+)\)\), hsl\(var\((--[\w-]+)\)\) ([\d.]+)%\))$/

/** A chip edge's colour and the alpha it paints at. */
export interface ChipEdge {
  colour: string
  alpha: number
}

/**
 * A selected chip's 1px edge, from the first layer of its shadow, with `at`
 * resolving each engine colour the edge names. `where` names the look in
 * the error.
 */
export function chipEdge(
  shadow: string | undefined,
  at: (key: string) => string,
  where: string,
): ChipEdge {
  const [first] = layers(shadow)
  const edge = CHIP_EDGE.exec(first ?? "")
  if (!edge) throw new Error(`${where}: no chip edge in ${shadow}`)
  const [, single, alpha, base, mixed, share] = edge
  if (single) {
    return { colour: at(single), alpha: alpha ? Number(alpha) : 1 }
  }
  return {
    colour: composite(at(base as string), at(mixed as string), Number(share) / 100),
    alpha: 1,
  }
}

/** The blur radius of each layer of a box-shadow value. */
export function blurs(value: string): number[] {
  return layers(value).map((layer) => {
    const lengths = layer
      .replace(/(rgb|hsl|color-mix|var)\([^)]*(\([^)]*\))*[^)]*\)/g, "")
      .trim()
      .split(/\s+/)
      .filter((part) => /^-?[\d.]+(px)?$/.test(part))
    return lengths.length >= 3 ? Number.parseFloat(lengths[2] ?? "0") : 0
  })
}
