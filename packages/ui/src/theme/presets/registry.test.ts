import { describe, it, expect } from "vitest"
import { presets, PRESET_NAMES } from "./index"

describe("preset registry", () => {
  it("ships exactly the two surviving presets", () => {
    expect(PRESET_NAMES).toEqual(["default", "glass"])
  })

  it("no longer exports the removed presets", () => {
    expect(Object.keys(presets)).not.toContain("neon")
    expect(Object.keys(presets)).not.toContain("terminal")
    expect(Object.keys(presets)).not.toContain("playful")
    expect(Object.keys(presets)).not.toContain("scifi")
  })
})
