import { describe, it, expect } from "vitest"
import {
  AXIS_VISIBILITY,
  isAxisVisible,
  type AxisName,
  type AxisVisibilityInput,
} from "./axisVisibility"
import { themeConfig } from "@theme/themeConfig"

function input(overrides: Partial<AxisVisibilityInput> = {}) {
  return {
    axes: themeConfig.switcher.axes,
    backgroundStyle: "solid" as const,
    accentColor: "blue" as const,
    isHiddenByPreset: () => false,
    presetAxisCount: 0,
    ...overrides,
  }
}

const ALL_AXES = Object.keys(themeConfig.switcher.axes) as AxisName[]

describe("axis visibility table", () => {
  // This is the assertion that makes the audit self-maintaining: a new axis
  // added to themeConfig cannot ship without declaring when it is visible.
  it("declares a predicate for every configured axis", () => {
    expect(Object.keys(AXIS_VISIBILITY).sort()).toEqual([...ALL_AXES].sort())
  })

  it("hides every axis its config flag disables", () => {
    const allOff = Object.fromEntries(
      ALL_AXES.map((a) => [a, false]),
    ) as AxisVisibilityInput["axes"]
    for (const axis of ALL_AXES) {
      expect(
        isAxisVisible(axis, input({ axes: allOff, presetAxisCount: 3 })),
        axis,
      ).toBe(false)
    }
  })

  it("shows Mode whenever the config enables it", () => {
    expect(isAxisVisible("mode", input())).toBe(true)
  })

  it("gates the gradient pattern on the gradient style, and nothing else", () => {
    expect(
      isAxisVisible("gradientPattern", input({ backgroundStyle: "solid" })),
    ).toBe(false)
    expect(
      isAxisVisible("gradientPattern", input({ backgroundStyle: "gradient" })),
    ).toBe(true)
  })

  it("keeps background intensity visible under solid", () => {
    // It absorbed canvasTint, so under `solid` it still drives the canvas cap.
    expect(
      isAxisVisible("backgroundIntensity", input({ backgroundStyle: "solid" })),
    ).toBe(true)
  })

  it("hides the preset-axes group when the preset declares none", () => {
    expect(isAxisVisible("presetAxes", input({ presetAxisCount: 0 }))).toBe(
      false,
    )
    expect(isAxisVisible("presetAxes", input({ presetAxisCount: 2 }))).toBe(
      true,
    )
  })

  it("honours hiddenCommonAxes for every axis a preset may take over", () => {
    const takeable: AxisName[] = [
      "density",
      "fontSize",
      "radius",
      "elevation",
      "buttonElevation",
      "accentIntensity",
      "surfaceIntensity",
      "outerGlow",
      "innerGlow",
    ]
    for (const axis of takeable) {
      expect(
        isAxisVisible(axis, input({ isHiddenByPreset: (a) => a === axis })),
        axis,
      ).toBe(false)
    }
  })

  it("never lets a preset hide the axes that choose the preset or its colours", () => {
    // Hiding these would strand the user: no way back to another preset, or no
    // way to change the accent at all.
    for (const axis of [
      "preset",
      "accentColor",
      "surfaceColor",
      "backgroundStyle",
    ] as AxisName[]) {
      expect(
        isAxisVisible(axis, input({ isHiddenByPreset: () => true })),
        axis,
      ).toBe(true)
    }
  })

  it("hides tint with accent under the neutral accent only", () => {
    expect(
      isAxisVisible("tintWithAccent", input({ accentColor: "neutral" })),
    ).toBe(false)
    expect(
      isAxisVisible("tintWithAccent", input({ accentColor: "blue" })),
    ).toBe(true)
  })

  it("shows contrast and dark accent chroma as their switcher flags say", () => {
    for (const axis of ["contrast", "darkAccentChroma"] as AxisName[]) {
      const axes = { ...themeConfig.switcher.axes, [axis]: false }
      expect(isAxisVisible(axis, input()), axis).toBe(true)
      expect(isAxisVisible(axis, input({ axes })), axis).toBe(false)
    }
  })
})
