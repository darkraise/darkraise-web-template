import { describe, it, expect } from "vitest"
import { migratePresetGlowAxes } from "./migratePresetGlowAxes"

function makeStorage(seed: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(seed))
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (k: string) => map.get(k) ?? null,
    key: (i: number) => [...map.keys()][i] ?? null,
    removeItem: (k: string) => void map.delete(k),
    setItem: (k: string, v: string) => void map.set(k, v),
  } as Storage
}

describe("migratePresetGlowAxes", () => {
  it("maps glass halo onto the outer glow axis", () => {
    const ls = makeStorage({ "theme-glass-halo": "pronounced" })
    migratePresetGlowAxes(ls)
    expect(ls.getItem("theme-outer-glow")).toBe("vivid")
    expect(ls.getItem("theme-glass-halo")).toBeNull()
  })

  it("maps a soft halo onto balanced, the step that reproduces it", () => {
    const ls = makeStorage({ "theme-glass-halo": "soft" })
    migratePresetGlowAxes(ls)
    expect(ls.getItem("theme-outer-glow")).toBe("balanced")
  })

  it("seeds both axes from scifi intensity, which drove both layers", () => {
    const ls = makeStorage({ "theme-scifi-intensity": "dim" })
    migratePresetGlowAxes(ls)
    expect(ls.getItem("theme-outer-glow")).toBe("subtle")
    expect(ls.getItem("theme-inner-glow")).toBe("subtle")
    expect(ls.getItem("theme-scifi-intensity")).toBeNull()
  })

  it("collapses scifi intense onto vivid", () => {
    const ls = makeStorage({ "theme-scifi-intensity": "intense" })
    migratePresetGlowAxes(ls)
    expect(ls.getItem("theme-outer-glow")).toBe("vivid")
  })

  it("never clobbers a value the user already set on the shared axis", () => {
    const ls = makeStorage({
      "theme-glass-halo": "pronounced",
      "theme-outer-glow": "none",
    })
    migratePresetGlowAxes(ls)
    expect(ls.getItem("theme-outer-glow")).toBe("none")
  })

  it("is a no-op when nothing is stored", () => {
    const ls = makeStorage()
    migratePresetGlowAxes(ls)
    expect(ls.getItem("theme-outer-glow")).toBeNull()
    expect(ls.getItem("theme-inner-glow")).toBeNull()
  })
})
