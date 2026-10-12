import type { ModeTokens } from "@theme/config/schema"
import { PAINT_TOKENS, type PaintToken } from "@theme/config/tokens"

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
