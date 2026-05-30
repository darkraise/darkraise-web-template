import { describe, it, expect } from "vitest"
import { migrateGlassPresetKeys } from "./migrateGlassPresetKeys"

// Minimal in-memory Storage so the pure migration can be exercised without
// jsdom's shared localStorage or a real window. Backed by a Map so removeItem
// doesn't need a dynamic `delete` on a computed key.
function makeStorage(initial: Record<string, string> = {}): Storage {
  const store = new Map<string, string>(Object.entries(initial))
  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.get(key) ?? null
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
}

describe("migrateGlassPresetKeys", () => {
  it("renames the stored preset glassmorphism → glass", () => {
    const ls = makeStorage({ "theme-preset": "glassmorphism" })
    migrateGlassPresetKeys(ls)
    expect(ls.getItem("theme-preset")).toBe("glass")
  })

  it("leaves a non-glassmorphism preset untouched", () => {
    const ls = makeStorage({ "theme-preset": "neon" })
    migrateGlassPresetKeys(ls)
    expect(ls.getItem("theme-preset")).toBe("neon")
  })

  it("carries opacity/blur values to the new keys and removes the legacy keys", () => {
    const ls = makeStorage({
      "theme-preset": "glassmorphism",
      "theme-glassmorphism-opacity": "strong",
      "theme-glassmorphism-blur": "high",
    })
    migrateGlassPresetKeys(ls)
    expect(ls.getItem("theme-glass-opacity")).toBe("strong")
    expect(ls.getItem("theme-glass-blur")).toBe("high")
    expect(ls.getItem("theme-glassmorphism-opacity")).toBe(null)
    expect(ls.getItem("theme-glassmorphism-blur")).toBe(null)
  })

  it("does NOT overwrite a pre-existing new key, but still removes the legacy one", () => {
    const ls = makeStorage({
      "theme-glassmorphism-opacity": "strong",
      "theme-glass-opacity": "subtle",
    })
    migrateGlassPresetKeys(ls)
    expect(ls.getItem("theme-glass-opacity")).toBe("subtle")
    expect(ls.getItem("theme-glassmorphism-opacity")).toBe(null)
  })

  it("never touches the halo axis (net-new, no legacy key to migrate)", () => {
    const ls = makeStorage({ "theme-preset": "glassmorphism" })
    migrateGlassPresetKeys(ls)
    expect(ls.getItem("theme-glass-halo")).toBe(null)
    expect(ls.getItem("theme-glassmorphism-halo")).toBe(null)
  })

  it("is a no-op when no glass keys are present", () => {
    const ls = makeStorage({ "theme-accent": "blue" })
    migrateGlassPresetKeys(ls)
    expect(ls.getItem("theme-accent")).toBe("blue")
    expect(ls.getItem("theme-preset")).toBe(null)
  })
})
