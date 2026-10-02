import { describe, it, expect } from "vitest"
import { defaultPreset } from "./default"

describe("defaultPreset", () => {
  it("shadowDropdown", () => {
    expect(defaultPreset.shadowDropdown).toBe(
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    )
  })

  it("declares no axes, no generateTokens, no ownedTokenKeys", () => {
    expect(Object.keys(defaultPreset.axes)).toHaveLength(0)
    expect(defaultPreset.generateTokens).toBeUndefined()
    expect(defaultPreset.ownedTokenKeys).toBeUndefined()
  })
})
