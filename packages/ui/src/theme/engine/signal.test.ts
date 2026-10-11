import { describe, expect, it } from "vitest"
import { contrastRatio } from "@theme/engine/oklch"
import {
  generateTokens,
  type GenerateTokensInput,
} from "@theme/engine/generateTokens"
import { ACCENT_COLORS, SURFACE_COLORS } from "@theme/types"

const SIGNAL = [
  ["--signal-fill", "--primary-fill"],
  ["--signal-text", "--primary-text"],
  ["--signal-subtle", "--primary-3"],
  ["--signal-foreground", "--primary-foreground"],
] as const

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

const MODES = ["light", "dark"] as const

describe("generateTokens signal colour", () => {
  it("aliases the primary tokens when the signal colour is none", () => {
    for (const mode of MODES) {
      for (const signalColor of [undefined, "none"] as const) {
        const tokens = generateTokens({ ...base, mode, signalColor })
        for (const [signal, primary] of SIGNAL) {
          expect(tokens[signal], `${mode} ${signal}`).toBe(tokens[primary])
        }
      }
    }
  })

  it("adds the signal tokens and changes nothing else", () => {
    const withSignal = generateTokens({ ...base, signalColor: "lime" })
    const withNone = generateTokens({ ...base, signalColor: "none" })
    const changed = Object.keys(withNone).filter(
      (key) => withNone[key] !== withSignal[key],
    )
    expect(changed.sort()).toEqual(SIGNAL.map(([signal]) => signal).sort())
  })

  it("solves a signal equal to the accent to the primary values", () => {
    for (const mode of MODES) {
      for (const tintWithAccent of [false, true]) {
        const input = {
          ...base,
          mode,
          tintWithAccent,
          accentColor: "violet" as const,
        }
        const tokens = generateTokens({ ...input, signalColor: "violet" })
        for (const [signal, primary] of SIGNAL) {
          expect(tokens[signal], `${mode} ${tintWithAccent} ${signal}`).toBe(
            tokens[primary],
          )
        }
      }
    }
  })

  it("solves the signal on the primary's tinted neutral grounds", () => {
    for (const mode of MODES) {
      const tokens = generateTokens({
        ...base,
        mode,
        accentColor: "violet",
        tintWithAccent: true,
        signalColor: "neutral",
      })
      // A neutral signal draws its text from the neutral ramp, so it is the
      // page's own foreground only when both share the violet-tinted grounds.
      expect(tokens["--signal-text"], mode).toBe(tokens["--foreground"])
    }
  })

  it.each(
    SURFACE_COLORS.flatMap((surfaceColor) =>
      MODES.map(
        (mode) => [`${surfaceColor} ${mode}`, surfaceColor, mode] as const,
      ),
    ),
  )(
    "holds every signal colour at the accent's floors (%s)",
    (_name, surfaceColor, mode) => {
      for (const signalColor of ACCENT_COLORS) {
        const tokens = generateTokens({
          ...base,
          surfaceColor,
          mode,
          signalColor,
        })
        const at = (key: string) => tokens[key] as string
        const label = `${signalColor} ${surfaceColor} ${mode}`
        expect(
          contrastRatio(at("--signal-foreground"), at("--signal-fill")),
          `${label} label on fill`,
        ).toBeGreaterThanOrEqual(4.5)
        for (const ground of ["--background", "--card"]) {
          expect(
            contrastRatio(at("--signal-text"), at(ground)),
            `${label} text on ${ground}`,
          ).toBeGreaterThanOrEqual(4.5)
        }
      }
    },
  )
})
