import { describe, it, expect } from "vitest"
import { SURFACE_INTENSITIES, CANVAS_TINTS } from "./types"
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

describe("canvasTint axis", () => {
  it("has four steps from neutral to vivid", () => {
    expect(CANVAS_TINTS).toEqual(["neutral", "subtle", "balanced", "vivid"])
  })

  it("defaults to the middle step", () => {
    expect(themeConfig.defaults.canvasTint).toBe("balanced")
  })

  it("is switchable by default", () => {
    expect(themeConfig.switcher.axes.canvasTint).toBe(true)
  })
})
