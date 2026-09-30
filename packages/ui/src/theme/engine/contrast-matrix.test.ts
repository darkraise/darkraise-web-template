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
    expect(combos).toHaveLength(18 * 30 * 11 * 5)
    expect(new Set(combos.map(comboName)).size).toBe(combos.length)
    expect(
      combos.filter((c) => c.preset === "scifi").every((c) => c.mode === "dark"),
    ).toBe(true)
    expect(
      combos
        .filter((c) => c.preset !== "default")
        .every((c) => c.accentIntensity === "balanced"),
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
      accentIntensity: "balanced",
      preset: "default",
    } as const
    expect(
      finalTokens({ ...base, backgroundIntensity: "neutral" })["--background"],
    ).not.toBe(
      finalTokens({ ...base, backgroundIntensity: "intense" })["--background"],
    )
  })

  it("merges preset tokens over the engine's, as the provider does", () => {
    const glass = finalTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      mode: "light",
      accentIntensity: "balanced",
      backgroundIntensity: "balanced",
      preset: "glass",
    })
    expect(glass["--muted"]).toContain("var(--primary)")
    expect(isOpaque(glass["--muted"])).toBe(false)
    expect(isOpaque(glass["--card"])).toBe(true)
  })
})
