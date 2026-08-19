import { describe, it, expect } from "vitest"
import { migrateAccentIntensityKey } from "./migrateAccentIntensityKey"

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

describe("migrateAccentIntensityKey", () => {
  it("carries a stored vibrancy value forward", () => {
    const ls = makeStorage({ "theme-accent-vibrancy": "calm" })
    migrateAccentIntensityKey(ls)
    expect(ls.getItem("theme-accent-intensity")).toBe("calm")
    expect(ls.getItem("theme-accent-vibrancy")).toBeNull()
  })

  it("does not clobber an existing new value", () => {
    const ls = makeStorage({
      "theme-accent-vibrancy": "calm",
      "theme-accent-intensity": "vivid",
    })
    migrateAccentIntensityKey(ls)
    expect(ls.getItem("theme-accent-intensity")).toBe("vivid")
    expect(ls.getItem("theme-accent-vibrancy")).toBeNull()
  })

  it("is a no-op when nothing is stored", () => {
    const ls = makeStorage()
    migrateAccentIntensityKey(ls)
    expect(ls.getItem("theme-accent-intensity")).toBeNull()
  })

  it("leaves unrelated keys untouched", () => {
    const ls = makeStorage({
      "theme-accent-vibrancy": "intense",
      "theme-preset": "glass",
    })
    migrateAccentIntensityKey(ls)
    expect(ls.getItem("theme-preset")).toBe("glass")
  })
})
