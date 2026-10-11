import { describe, expect, it } from "vitest"
import { composite, contrastRatio } from "@theme/engine/oklch"
import {
  generateTokens,
  type GenerateTokensInput,
} from "@theme/engine/generateTokens"
import { CONTRASTS, SURFACE_COLORS } from "@theme/types"

const HAIRLINES = [
  "--border",
  "--border-subtle",
  "--border-default",
  "--border-strong",
] as const

// The two grounds a hairline separates content on.
const GROUNDS = ["--card", "--background"] as const

const base: GenerateTokensInput = {
  accentColor: "blue",
  surfaceColor: "zinc",
  frosted: false,
  backgroundStyle: "solid",
  mode: "light",
  contrast: "standard",
  darkAccentChroma: "standard",
  tintWithAccent: false,
}

const combos = SURFACE_COLORS.flatMap((surfaceColor) =>
  (["light", "dark"] as const).flatMap((mode) =>
    CONTRASTS.map((contrast) => ({ ...base, surfaceColor, mode, contrast })),
  ),
)

/** Splits `H S L / a` into its triplet and alpha. */
function splitAlpha(value: string): [string, number] {
  const [triplet, alpha] = value.split(" / ")
  if (triplet === undefined || alpha === undefined) {
    throw new Error(`"${value}" carries no alpha`)
  }
  return [triplet, Number(alpha)]
}

describe("generateTokens hairlines", () => {
  it.each(combos.map((c) => [`${c.surfaceColor} ${c.mode} ${c.contrast}`, c]))(
    "leaves every token unchanged when opaque (%s)",
    (_name, combo) => {
      const today = generateTokens(combo)
      expect(generateTokens({ ...combo, hairlines: "opaque" })).toEqual(today)
    },
  )

  it.each(combos.map((c) => [`${c.surfaceColor} ${c.mode} ${c.contrast}`, c]))(
    "draws alpha hairlines as strong as the opaque ones on card and page (%s)",
    (_name, combo) => {
      const opaque = generateTokens(combo)
      const alpha = generateTokens({ ...combo, hairlines: "alpha" })
      for (const token of HAIRLINES) {
        const [ink, amount] = splitAlpha(alpha[token] as string)
        expect(amount).toBeGreaterThanOrEqual(0)
        expect(amount).toBeLessThanOrEqual(1)
        const gaps = GROUNDS.map((ground) => {
          const surface = opaque[ground] as string
          const want = contrastRatio(opaque[token] as string, surface)
          const got = contrastRatio(composite(surface, ink, amount), surface)
          // Never weaker than the opaque line on either ground.
          expect(got, `${token} over ${ground}`).toBeGreaterThanOrEqual(
            want - 0.01,
          )
          return got - want
        })
        // The binding ground matches the opaque step.
        expect(Math.min(...gaps), token).toBeLessThanOrEqual(0.05)
      }
    },
  )

  it("keeps the field edge opaque under alpha hairlines", () => {
    for (const combo of combos) {
      const opaque = generateTokens(combo)
      const alpha = generateTokens({ ...combo, hairlines: "alpha" })
      expect(alpha["--field-edge-color"]).toBe(opaque["--field-edge-color"])
      expect(alpha["--field-edge-lifted-color"]).toBe(
        opaque["--field-edge-lifted-color"],
      )
      expect(alpha["--field-edge-color"]).not.toContain("/")
    }
  })

  it("changes only the hairline tokens", () => {
    const opaque = generateTokens(base)
    const alpha = generateTokens({ ...base, hairlines: "alpha" })
    const changed = Object.keys(opaque).filter(
      (key) => opaque[key] !== alpha[key],
    )
    expect(changed.sort()).toEqual([...HAIRLINES].sort())
  })
})
