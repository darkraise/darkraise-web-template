/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const thisDir = dirname(fileURLToPath(import.meta.url))
const themeCss = readFileSync(resolve(thisDir, "theme.css"), "utf8")

const TEXT_TOKENS = [
  "xs",
  "sm",
  "base",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
  "6xl",
  "7xl",
  "8xl",
  "9xl",
] as const

const BODY_TOKENS: readonly string[] = ["xs", "sm", "base", "lg", "xl"]

/** Tailwind 4.2's default type scale in px at a 16px root. This is the
 *  `medium` column: medium declares no block, so the baseline is a
 *  literal here rather than parsed out of node_modules. */
const MEDIUM_PX: Record<string, number> = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
  "6xl": 60,
  "7xl": 72,
  "8xl": 96,
  "9xl": 128,
}

const MULTIPLIERS = {
  small: { body: 0.875, display: 0.9375 },
  large: { body: 1.125, display: 1.0625 },
  "extra-large": { body: 1.25, display: 1.125 },
} as const

type Step = keyof typeof MULTIPLIERS
const STEPS = Object.keys(MULTIPLIERS) as Step[]

function blockBody(step: string): string {
  const match = themeCss.match(
    new RegExp(`\\[data-font-size="${step}"\\]\\s*\\{([^}]*)\\}`),
  )
  if (!match?.[1]) {
    throw new Error(`No [data-font-size="${step}"] block found in theme.css`)
  }
  return match[1]
}

function declaredPx(step: string): Record<string, number> {
  const body = blockBody(step)
  const result: Record<string, number> = {}
  for (const token of TEXT_TOKENS) {
    const match = body.match(new RegExp(`--text-${token}:\\s*([0-9.]+)rem`))
    if (!match?.[1]) {
      throw new Error(`--text-${token} missing from [data-font-size="${step}"]`)
    }
    result[token] = parseFloat(match[1]) * 16
  }
  return result
}

describe("font-size axis", () => {
  it.each(STEPS)("%s declares all 13 text tokens", (step) => {
    expect(Object.keys(declaredPx(step))).toHaveLength(TEXT_TOKENS.length)
  })

  it.each(STEPS)(
    "%s sizes are within 0.5px of the exact multiplier",
    (step) => {
      const declared = declaredPx(step)
      const { body, display } = MULTIPLIERS[step]
      for (const token of TEXT_TOKENS) {
        const factor = BODY_TOKENS.includes(token) ? body : display
        const exact = MEDIUM_PX[token]! * factor
        expect(Math.abs(declared[token]! - exact)).toBeLessThanOrEqual(0.5)
      }
    },
  )

  it.each(STEPS)("%s sizes increase across the scale", (step) => {
    const declared = declaredPx(step)
    for (let i = 1; i < TEXT_TOKENS.length; i++) {
      expect(declared[TEXT_TOKENS[i]!]!).toBeGreaterThan(
        declared[TEXT_TOKENS[i - 1]!]!,
      )
    }
  })

  it("each token grows monotonically from small to extra-large", () => {
    const small = declaredPx("small")
    const large = declaredPx("large")
    const extraLarge = declaredPx("extra-large")
    for (const token of TEXT_TOKENS) {
      expect(small[token]!).toBeLessThan(MEDIUM_PX[token]!)
      expect(MEDIUM_PX[token]!).toBeLessThan(large[token]!)
      expect(large[token]!).toBeLessThan(extraLarge[token]!)
    }
  })

  it("no block overrides a line height", () => {
    for (const step of STEPS) {
      expect(blockBody(step)).not.toMatch(/--text-[a-z0-9]+--line-height/)
    }
  })

  it("every block declares --icon-scale and --control-scale", () => {
    for (const step of STEPS) {
      expect(blockBody(step)).toMatch(/--icon-scale:/)
      expect(blockBody(step)).toMatch(/--control-scale:/)
    }
  })
})

describe("density and font-size composition", () => {
  function densityBlockBody(step: string): string {
    const match = themeCss.match(
      new RegExp(`\\[data-density="${step}"\\]\\s*\\{([^}]*)\\}`),
    )
    if (!match?.[1]) {
      throw new Error(`No [data-density="${step}"] block found in theme.css`)
    }
    return match[1]
  }

  it("derives --density-cell from --density-cell-base and --control-scale", () => {
    expect(themeCss).toMatch(
      /--density-cell:\s*calc\(\s*var\(--density-cell-base\)\s*\*\s*var\(--control-scale\)\s*\)/,
    )
  })

  it("declares a neutral --control-scale default on :root", () => {
    expect(themeCss).toMatch(/--control-scale:\s*1;/)
  })

  it.each(["compact", "comfortable", "spacious"])(
    "%s re-binds --density-cell-base, not --density-cell",
    (step) => {
      const body = densityBlockBody(step)
      expect(body).toMatch(/--density-cell-base:/)
      expect(body).not.toMatch(/--density-cell:/)
    },
  )
})
