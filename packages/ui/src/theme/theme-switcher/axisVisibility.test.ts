import { describe, it, expect } from "vitest"
import {
  AXIS_VISIBILITY,
  isAxisVisible,
  type AxisName,
  type AxisVisibilityInput,
} from "./axisVisibility"
import { AXIS_KEYS } from "@theme/axes/registry"

function input(
  overrides: Partial<AxisVisibilityInput> = {},
): AxisVisibilityInput {
  return {
    axes: undefined,
    backgroundStyle: "solid",
    accentColor: "blue",
    isHiddenByPreset: () => false,
    presetAxisCount: 0,
    ...overrides,
  }
}

const ALL_AXES: AxisName[] = [...AXIS_KEYS, "presetAxes"]

describe("axis visibility table", () => {
  it("declares a predicate for every registry axis and the preset's own axes", () => {
    expect(Object.keys(AXIS_VISIBILITY).sort()).toEqual([...ALL_AXES].sort())
  })

  it("shows an axis the switcher config leaves out", () => {
    for (const axes of [undefined, {}]) {
      for (const axis of AXIS_KEYS) {
        expect(
          isAxisVisible(axis, input({ axes, backgroundStyle: "gradient" })),
          axis,
        ).toBe(true)
      }
    }
  })

  it("hides every axis its config flag disables", () => {
    const allOff = Object.fromEntries(AXIS_KEYS.map((a) => [a, false]))
    for (const axis of ALL_AXES) {
      expect(
        isAxisVisible(
          axis,
          input({
            axes: allOff,
            presetAxisCount: 3,
            backgroundStyle: "gradient",
          }),
        ),
        axis,
      ).toBe(false)
    }
  })

  it("shows the preset's own axes whenever the preset control is shown", () => {
    expect(isAxisVisible("presetAxes", input({ presetAxisCount: 2 }))).toBe(
      true,
    )
    expect(
      isAxisVisible(
        "presetAxes",
        input({ presetAxisCount: 2, axes: { preset: false } }),
      ),
    ).toBe(false)
  })

  it("hides the preset-axes group when the preset declares none", () => {
    expect(isAxisVisible("presetAxes", input({ presetAxisCount: 0 }))).toBe(
      false,
    )
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

  it("honours hiddenCommonAxes for every axis a preset may take over", () => {
    const takeable: AxisName[] = [
      "density",
      "fontSize",
      "radius",
      "elevation",
      "outerGlow",
      "innerGlow",
      "contrast",
      "darkAccentChroma",
    ]
    for (const axis of takeable) {
      expect(
        isAxisVisible(axis, input({ isHiddenByPreset: (a) => a === axis })),
        axis,
      ).toBe(false)
    }
  })

  it("has no rule for removed axes", () => {
    for (const axis of [
      "surfaceIntensity",
      "borderIntensity",
      "controlDepth",
      "accentIntensity",
      "buttonElevation",
      "shellStyle",
    ])
      expect(axis in AXIS_VISIBILITY).toBe(false)
  })

  it("never lets a preset hide the axes that choose the preset or its colours", () => {
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
      expect(isAxisVisible(axis, input()), axis).toBe(true)
      expect(
        isAxisVisible(axis, input({ axes: { [axis]: false } })),
        axis,
      ).toBe(false)
    }
  })
})
