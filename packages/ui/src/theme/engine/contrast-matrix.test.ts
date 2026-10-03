import { describe, it, expect } from "vitest"
import {
  comboName,
  finalTokens,
  isOpaque,
  reachableCombos,
} from "../../test/contrast-matrix"

describe("contrast matrix support", () => {
  it("enumerates every reachable combination once", () => {
    const combos = reachableCombos()
    expect(combos).toHaveLength(19 * 12 * 14 * 5)
    expect(new Set(combos.map(comboName)).size).toBe(combos.length)
    expect(
      combos
        .filter((c) => c.frosted)
        .every(
          (c) => c.contrast === "standard" && c.darkAccentChroma === "standard",
        ),
    ).toBe(true)
  })

  it("builds each combination's tokens once", () => {
    const [combo] = reachableCombos()
    if (!combo) throw new Error("no reachable combination")
    expect(finalTokens(combo)).toBe(finalTokens({ ...combo }))
  })

  it("paints the page from the combination's background intensity", () => {
    const base = {
      accentColor: "blue",
      surfaceColor: "slate",
      mode: "light",
      contrast: "standard",
      darkAccentChroma: "standard",
      tintWithAccent: false,
      frosted: false,
    } as const
    expect(
      finalTokens({ ...base, backgroundIntensity: "neutral" })["--background"],
    ).not.toBe(
      finalTokens({ ...base, backgroundIntensity: "intense" })["--background"],
    )
  })

  it("merges Glass's own tokens over the engine's when frosted, as the provider does", () => {
    const frosted = finalTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      mode: "light",
      contrast: "standard",
      darkAccentChroma: "standard",
      tintWithAccent: false,
      backgroundIntensity: "balanced",
      frosted: true,
    })
    expect(frosted["--muted"]).toContain("var(--primary)")
    expect(isOpaque(frosted["--muted"])).toBe(false)
    expect(isOpaque(frosted["--card"])).toBe(true)
  })
})
