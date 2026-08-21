import { describe, it, expect } from "vitest"
import { SURFACE_INTENSITIES, BACKGROUND_INTENSITIES } from "./types"
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

describe("backgroundIntensity axis", () => {
  it("has five steps from neutral to intense", () => {
    expect(BACKGROUND_INTENSITIES).toEqual([
      "neutral",
      "subtle",
      "balanced",
      "vivid",
      "intense",
    ])
  })

  it("defaults to the uncapped step", () => {
    expect(themeConfig.defaults.backgroundIntensity).toBe("vivid")
  })

  it("is switchable by default", () => {
    expect(themeConfig.switcher.axes.backgroundIntensity).toBe(true)
  })
})
