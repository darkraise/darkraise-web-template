import { describe, it, expect } from "vitest"
import { SURFACE_INTENSITIES } from "./types"
import { themeConfig } from "./themeConfig"

describe("surfaceIntensity axis", () => {
  it("has four steps in ramp order", () => {
    expect(SURFACE_INTENSITIES).toEqual(["flat", "subtle", "balanced", "bold"])
  })

  it("defaults to the middle step", () => {
    expect(themeConfig.defaults.surfaceIntensity).toBe("balanced")
  })

  it("is switchable by default", () => {
    expect(themeConfig.switcher.axes.surfaceIntensity).toBe(true)
  })
})
