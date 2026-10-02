import { describe, expect, it } from "vitest"
import type { ColorScale, ResolvedMode } from "@theme/types"
import { accentColors } from "@theme/palettes/accentColors"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import { contrastRatio, hslStringToOklch } from "@theme/engine/oklch"
import {
  solveSteps,
  type Contrast,
  type DarkAccentChroma,
  type SolveInput,
} from "./steps"

const ACCENTS = Object.keys(accentColors) as (keyof typeof accentColors)[]
const NEUTRALS = Object.keys(surfaceColors) as (keyof typeof surfaceColors)[]
const MODES: ResolvedMode[] = ["light", "dark"]
const CONTRASTS: Contrast[] = ["low", "standard", "high"]

function status(accent: string): SolveInput["status"] {
  const redish = accent === "red" || accent === "rose" || accent === "pink"
  return {
    destructive: redish ? accentColors.orange : accentColors.red,
    success: accentColors.emerald,
    warning: accentColors.amber,
    info: accentColors.blue,
  }
}

function input(
  accent: string,
  neutral: string,
  mode: ResolvedMode,
  overrides: Partial<SolveInput> = {},
): SolveInput {
  const scale = (surfaceColors as Record<string, ColorScale>)[neutral]
  if (!scale) throw new Error(neutral)
  return {
    mode,
    accent:
      accent === "neutral"
        ? null
        : ((accentColors as Record<string, ColorScale>)[accent] ?? null),
    neutral: scale,
    contrast: "standard",
    darkAccentChroma: "standard",
    tintWithAccent: false,
    gradient: null,
    pageSaturationCap: 16,
    glass: false,
    status: status(accent),
    ...overrides,
  }
}

function lab(hsl: string): [number, number, number] {
  const { L, C, h } = hslStringToOklch(hsl)
  return [L, C * Math.cos(h), C * Math.sin(h)]
}

function distance(a: string, b: string): number {
  const [l1, a1, b1] = lab(a)
  const [l2, a2, b2] = lab(b)
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2)
}

describe("solveSteps floors", () => {
  for (const mode of MODES)
    for (const contrast of CONTRASTS)
      for (const background of [null, "balanced", "intense"] as const)
        it(`every floor holds: ${mode}, ${contrast}, ${background ?? "solid"}`, () => {
          const misses: string[] = []
          for (const accent of [...ACCENTS, "neutral"])
            for (const neutral of NEUTRALS)
              for (const glass of [false, true]) {
                const scale = (surfaceColors as Record<string, ColorScale>)[
                  neutral
                ] as ColorScale
                const result = solveSteps(
                  input(accent, neutral, mode, {
                    contrast,
                    glass,
                    gradient: background
                      ? {
                          surfaceHue: scale[500],
                          intensity: background,
                          strip: !glass,
                        }
                      : null,
                  }),
                )
                for (const m of result.misses)
                  misses.push(`${accent}/${neutral}/glass=${glass}: ${m.step}`)
              }
          expect(misses).toEqual([])
        })

  it("tint-with-accent keeps every floor", () => {
    const misses: string[] = []
    for (const accent of ["blue", "yellow", "red"])
      for (const neutral of NEUTRALS)
        for (const mode of MODES)
          for (const contrast of CONTRASTS)
            for (const m of solveSteps(
              input(accent, neutral, mode, { contrast, tintWithAccent: true }),
            ).misses)
              misses.push(`${accent}/${neutral}/${mode}/${contrast}: ${m.step}`)
    expect(misses).toEqual([])
  })

  it("every dark chroma step keeps every floor", () => {
    const misses: string[] = []
    for (const accent of [...ACCENTS, "neutral"])
      for (const glass of [false, true])
        for (const chroma of ["calm", "vivid"] as DarkAccentChroma[])
          for (const m of solveSteps(
            input(accent, "zinc", "dark", { darkAccentChroma: chroma, glass }),
          ).misses)
            misses.push(`${accent}/${chroma}/glass=${glass}: ${m.step}`)
    expect(misses).toEqual([])
  })
})

describe("solveSteps ramps", () => {
  it("keeps each role group in order away from the card", () => {
    for (const mode of MODES)
      for (const contrast of CONTRASTS)
        for (const neutral of NEUTRALS) {
          const { neutral: n, primary: p } = solveSteps(
            input("blue", neutral, mode, { contrast }),
          )
          const cardL = hslStringToOklch(n[1] as string).L
          const far = (v: string) => Math.abs(hslStringToOklch(v).L - cardL)
          for (const [ramp, from, to] of [
            [n, 1, 4],
            [n, 5, 7],
            [n, 10, 11],
            [p, 1, 4],
            [p, 5, 7],
            [p, 10, 11],
          ] as const)
            for (let i = from + 1; i <= to; i++)
              expect(far(ramp[i] as string)).toBeGreaterThanOrEqual(
                far(ramp[i - 1] as string),
              )
        }
  })

  it("spaces card, hover, pressed and selected at least 0.012 L apart", () => {
    for (const mode of MODES)
      for (const contrast of CONTRASTS)
        for (const neutral of NEUTRALS) {
          const { neutral: n } = solveSteps(
            input("blue", neutral, mode, { contrast }),
          )
          for (let i = 2; i <= 4; i++)
            expect(
              Math.abs(
                hslStringToOklch(n[i] as string).L -
                  hslStringToOklch(n[i - 1] as string).L,
              ),
            ).toBeGreaterThanOrEqual(0.012)
        }
  })

  it("selected is stronger than hover on every neutral", () => {
    for (const mode of MODES)
      for (const neutral of NEUTRALS) {
        const { neutral: n } = solveSteps(input("blue", neutral, mode))
        expect(contrastRatio(n[4] as string, n[1] as string)).toBeGreaterThan(
          contrastRatio(n[2] as string, n[1] as string),
        )
      }
  })

  it("meets the card-to-page floor and rises from low to high", () => {
    const floors = {
      light: { low: 1.02, standard: 1.04, high: 1.1 },
      dark: { low: 1.06, standard: 1.1, high: 1.16 },
    }
    for (const mode of MODES)
      for (const neutral of NEUTRALS) {
        const ratios = CONTRASTS.map((contrast) => {
          const { neutral: n } = solveSteps(
            input("blue", neutral, mode, { contrast }),
          )
          const ratio = contrastRatio(n[0] as string, n[1] as string)
          expect(ratio).toBeGreaterThanOrEqual(floors[mode][contrast])
          return ratio
        })
        expect(ratios[1]).toBeGreaterThan(ratios[0] as number)
        expect(ratios[2]).toBeGreaterThan(ratios[1] as number)
      }
  })

  it("raises dark primary chroma from calm to vivid", () => {
    let strict = 0
    for (const accent of ACCENTS) {
      const chroma = (step: DarkAccentChroma) =>
        [7, 8, 10].map(
          (i) =>
            hslStringToOklch(
              solveSteps(
                input(accent, "zinc", "dark", { darkAccentChroma: step }),
              ).primary[i] as string,
            ).C,
        )
      const [calm, standard, vivid] = (
        ["calm", "standard", "vivid"] as DarkAccentChroma[]
      ).map(chroma) as [number[], number[], number[]]
      // The sRGB gamut walk steps chroma by 0.002, so vivid can land a hair
      // under standard on a gamut-limited hue.
      for (let i = 0; i < 3; i++) {
        expect(standard[i]).toBeGreaterThanOrEqual((calm[i] as number) - 0.005)
        expect(vivid[i]).toBeGreaterThanOrEqual((standard[i] as number) - 0.005)
      }
      if (
        [0, 1, 2].every(
          (i) =>
            (calm[i] as number) < (standard[i] as number) &&
            (standard[i] as number) < (vivid[i] as number),
        )
      )
        strict++
    }
    // Amber, yellow and lime keep a bright ink-label fill at the sRGB gamut
    // edge, where vivid cannot add chroma; 13 of 18 measured on 2026-10-02.
    expect(strict).toBeGreaterThanOrEqual(13)
  })

  it("aliases the neutral accent onto the neutral ramp", () => {
    for (const mode of MODES) {
      const { neutral: n, primary: p } = solveSteps(
        input("neutral", "zinc", mode),
      )
      expect(p.slice(0, 7)).toEqual(n.slice(0, 7))
      for (const i of [7, 8, 10, 11]) expect(p[i]).toBe(n[11])
      expect(p[9]).not.toBe(p[8])
    }
  })

  it("keeps blue on zinc at standard close to the 6.x default", () => {
    // generateTokens output of darkraise-ui 6.9.6 for blue on zinc, default
    // preset, solid background, balanced background intensity.
    const before = {
      light: {
        background: "0 0% 98%",
        card: "0 0% 100%",
        muted: "240 5% 96%",
        foreground: "240 6% 10%",
        fill: "217 76% 52%",
      },
      dark: {
        background: "240 10% 4%",
        card: "240 6% 10%",
        muted: "240 4% 16%",
        foreground: "0 0% 98%",
        fill: "217 75% 52%",
      },
    }
    for (const mode of MODES) {
      const { neutral: n, primary: p } = solveSteps(input("blue", "zinc", mode))
      const b = before[mode]
      expect(distance(n[0] as string, b.background)).toBeLessThan(0.02)
      expect(distance(n[1] as string, b.card)).toBeLessThan(0.02)
      expect(distance(n[2] as string, b.muted)).toBeLessThan(0.02)
      expect(distance(n[11] as string, b.foreground)).toBeLessThan(0.02)
      expect(distance(p[8] as string, b.fill)).toBeLessThan(0.02)
    }
  })
})

describe("solveSteps status and chart", () => {
  it("holds every status label at 4.6", () => {
    for (const mode of MODES)
      for (const accent of ["blue", "red"]) {
        const { status } = solveSteps(input(accent, "zinc", mode))
        for (const pair of Object.values(status))
          expect(
            contrastRatio(pair.solid, pair.solidForeground),
          ).toBeGreaterThanOrEqual(4.6)
      }
  })

  it("keeps chart-1 away from every status colour", () => {
    for (const mode of MODES)
      for (const neutral of NEUTRALS)
        for (const accent of ["blue", "red"]) {
          const { chart, status } = solveSteps(input(accent, neutral, mode))
          for (const pair of Object.values(status)) {
            expect(
              distance(chart[0] as string, pair.solid),
            ).toBeGreaterThanOrEqual(0.1)
            expect(
              distance(chart[0] as string, pair.text),
            ).toBeGreaterThanOrEqual(0.1)
          }
        }
  })

  it("is independent of the accent", () => {
    for (const mode of MODES)
      expect(solveSteps(input("red", "zinc", mode)).chart).toEqual(
        solveSteps(input("blue", "zinc", mode)).chart,
      )
  })

  it("solves each status scale it is given, not a cached sibling", () => {
    const solve = (success: ColorScale) =>
      solveSteps(
        input("blue", "zinc", "light", {
          status: { ...status("blue"), success },
        }),
      ).status.success
    expect(solve(accentColors.emerald)).not.toEqual(solve(accentColors.green))
  })
})
