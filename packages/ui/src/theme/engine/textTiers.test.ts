import { describe, it, expect } from "vitest"
import { generateTokens } from "@theme/engine/generateTokens"
import { contrastRatio } from "@theme/engine/oklch"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import { SURFACE_COLORS, ACCENT_COLORS } from "@theme/types"

const NEUTRALS = SURFACE_COLORS.filter((name) => surfaceColors[name])
const MODES = ["light", "dark"] as const

/** AA for body-sized text. Every tier carries text, so none is held to 3:1. */
const AA = 4.5

function build(surfaceColor: (typeof NEUTRALS)[number], mode: "light" | "dark") {
  return generateTokens({
    accentColor: "coral",
    surfaceColor,
    preset: "default",
    backgroundStyle: "solid",
    mode,
    accentIntensity: "calm",
  })
}

describe("text tiers", () => {
  it("emits three tiers", () => {
    const tokens = build("slate", "light")
    expect(tokens["--foreground"]).toBeDefined()
    expect(tokens["--muted-foreground"]).toBeDefined()
    expect(tokens["--legend"]).toBeDefined()
  })

  describe.each(MODES)("in %s mode", (mode) => {
    it.each(NEUTRALS)("clears AA on every tier over %s", (surfaceColor) => {
      const t = build(surfaceColor, mode)
      const bg = t["--background"] as string
      for (const tier of [
        "--foreground",
        "--muted-foreground",
        "--legend",
      ] as const) {
        expect(
          contrastRatio(t[tier] as string, bg),
          `${tier} over ${surfaceColor} in ${mode}`,
        ).toBeGreaterThanOrEqual(AA)
      }
    })

    it.each(NEUTRALS)("orders the tiers over %s", (surfaceColor) => {
      // Each tier must be quieter than the one above it, or the third tier is
      // decoration rather than a hierarchy.
      const t = build(surfaceColor, mode)
      const bg = t["--background"] as string
      const fg = contrastRatio(t["--foreground"] as string, bg)
      const muted = contrastRatio(t["--muted-foreground"] as string, bg)
      const legend = contrastRatio(t["--legend"] as string, bg)
      expect(fg, `fg vs muted over ${surfaceColor}`).toBeGreaterThan(muted)
      expect(muted, `muted vs legend over ${surfaceColor}`).toBeGreaterThan(
        legend,
      )
    })
  })

  it("keeps the tiers apart enough to read as different", () => {
    // Two tiers a quarter step apart look like a rendering bug, not a
    // hierarchy. A fifth of a ratio point is the floor worth defending.
    for (const mode of MODES) {
      for (const surfaceColor of NEUTRALS) {
        const t = build(surfaceColor, mode)
        const bg = t["--background"] as string
        const muted = contrastRatio(t["--muted-foreground"] as string, bg)
        const legend = contrastRatio(t["--legend"] as string, bg)
        expect(muted - legend, `${surfaceColor} in ${mode}`).toBeGreaterThan(1)
      }
    }
  })

  it("holds the tiers on an accent surface too", () => {
    for (const mode of MODES) {
      for (const accentColor of ACCENT_COLORS) {
        const t = generateTokens({
          accentColor: "coral",
          surfaceColor: accentColor,
          preset: "default",
          backgroundStyle: "solid",
          mode,
          accentIntensity: "calm",
        })
        const bg = t["--background"] as string
        expect(
          contrastRatio(t["--legend"] as string, bg),
          `--legend over ${accentColor} in ${mode}`,
        ).toBeGreaterThanOrEqual(AA)
      }
    }
  })
})
