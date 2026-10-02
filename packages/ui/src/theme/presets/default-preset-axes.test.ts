import { describe, it, expect } from "vitest"
import { presets } from "./index"
import { NEUTRALISED_WHEN_HIDDEN } from "@theme/theme-provider/neutralisedAxes"

describe("preset-hidden common axes", () => {
  it("glass hides no common axis", () => {
    expect(presets.glass.hiddenCommonAxes ?? []).toEqual([])
  })

  it("neutralises no axis", () => {
    expect(NEUTRALISED_WHEN_HIDDEN).toEqual([])
  })
})
