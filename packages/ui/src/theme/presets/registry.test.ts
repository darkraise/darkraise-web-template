import { describe, it, expect } from "vitest"
import { presets, PRESET_NAMES } from "./index"

describe("preset registry", () => {
  it("ships exactly the three surviving presets", () => {
    expect(PRESET_NAMES).toEqual(["default", "glass", "scifi"])
  })

  it("no longer exports the removed presets", () => {
    expect(Object.keys(presets)).not.toContain("neon")
    expect(Object.keys(presets)).not.toContain("terminal")
    expect(Object.keys(presets)).not.toContain("playful")
  })
})
