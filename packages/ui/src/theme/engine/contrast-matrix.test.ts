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
    expect(combos).toHaveLength(19 * 12 * (3 + 3 * 3) * 2 * 5)
    expect(new Set(combos.map(comboName)).size).toBe(combos.length)
  })

  it("runs frosted chrome at every contrast and chroma step", () => {
    const steps = (frosted: boolean) =>
      new Set(
        reachableCombos()
          .filter((c) => c.frosted === frosted)
          .map((c) => `${c.mode}/${c.contrast}/${c.darkAccentChroma}`),
      )
    expect(steps(true)).toEqual(steps(false))
    expect(steps(true).size).toBe(3 + 3 * 3)
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

  it("paints the engine's tokens alone when frosted, as the provider does", () => {
    const combo = {
      accentColor: "blue",
      surfaceColor: "slate",
      mode: "light",
      contrast: "standard",
      darkAccentChroma: "standard",
      tintWithAccent: false,
      backgroundIntensity: "balanced",
    } as const
    const frosted = finalTokens({ ...combo, frosted: true })
    const plain = finalTokens({ ...combo, frosted: false })
    expect(isOpaque(frosted["--muted"])).toBe(true)
    expect(frosted["--muted"]).toBe(plain["--muted"])
  })
})
