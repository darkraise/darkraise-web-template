import { describe, it, expect } from "vitest"
import { presets } from "./index"
import { NEUTRALISED_WHEN_HIDDEN } from "@theme/theme-provider/neutralisedAxes"

// `accentIntensity` and `surfaceIntensity` are Default-preset controls. Glass
// and Sci-fi reinterpret the same surfaces through their own recipes, so the
// two axes are hidden there — and neutralised, not merely hidden. Hiding alone
// leaves a stored `calm` silently applying under Glass with no control to
// change it, which is worse than either extreme. The stored value survives, so
// returning to Default restores the user's choice.
describe("default-preset-only axes", () => {
  for (const name of ["glass", "scifi"] as const) {
    it(`${name} hides both intensity axes`, () => {
      const hidden = presets[name].hiddenCommonAxes ?? []
      expect(hidden).toContain("accentIntensity")
      expect(hidden).toContain("surfaceIntensity")
    })
  }

  it("leaves the Default preset showing both", () => {
    const hidden = presets.default.hiddenCommonAxes ?? []
    expect(hidden).not.toContain("accentIntensity")
    expect(hidden).not.toContain("surfaceIntensity")
  })

  it("marks exactly those two as neutralisable", () => {
    // Deliberately a short explicit list rather than "everything hidden".
    // presets/types.ts documents that a hidden common axis still applies its
    // state and data attribute, and Sci-fi relies on that today for elevation,
    // buttonElevation and radius. Narrowing that contract wholesale is out of
    // scope; these two opt in by name.
    expect([...NEUTRALISED_WHEN_HIDDEN].sort()).toEqual([
      "accentIntensity",
      "surfaceIntensity",
    ])
  })

  it("keeps Sci-fi's other hidden axes on the existing apply-anyway contract", () => {
    for (const axis of ["elevation", "buttonElevation", "radius"]) {
      expect(presets.scifi.hiddenCommonAxes).toContain(axis)
      expect(NEUTRALISED_WHEN_HIDDEN.has(axis)).toBe(false)
    }
  })
})
