import { describe, it, expect } from "vitest"
import { migrateCanvasTintKey } from "./migrateCanvasTintKey"

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

describe("migrateCanvasTintKey", () => {
  it("seeds the merged axis from a stored canvas tint", () => {
    const ls = makeStorage({ "theme-canvas-tint": "neutral" })
    migrateCanvasTintKey(ls)
    expect(ls.getItem("theme-bg-intensity")).toBe("neutral")
    expect(ls.getItem("theme-canvas-tint")).toBeNull()
  })

  it("keeps an existing background intensity", () => {
    const ls = makeStorage({
      "theme-canvas-tint": "neutral",
      "theme-bg-intensity": "vivid",
    })
    migrateCanvasTintKey(ls)
    expect(ls.getItem("theme-bg-intensity")).toBe("vivid")
    expect(ls.getItem("theme-canvas-tint")).toBeNull()
  })

  it("is a no-op when nothing is stored", () => {
    const ls = makeStorage()
    migrateCanvasTintKey(ls)
    expect(ls.getItem("theme-bg-intensity")).toBeNull()
  })

  it("leaves unrelated keys untouched", () => {
    const ls = makeStorage({
      "theme-canvas-tint": "subtle",
      "theme-preset": "glass",
    })
    migrateCanvasTintKey(ls)
    expect(ls.getItem("theme-preset")).toBe("glass")
  })
})
