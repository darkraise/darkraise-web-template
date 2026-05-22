// packages/ui/src/theme/presets/brutalist/brutalist.test.ts
import { describe, it, expect } from "vitest"
import { brutalist } from "./brutalist"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import type { ColorScale } from "@theme/types"

describe("brutalist preset", () => {
  it("identity fields", () => {
    expect(brutalist.name).toBe("brutalist")
    expect(brutalist.label).toBe("Brutalist")
    expect(brutalist.description).toMatch(/raw|offset|border|contrast/i)
  })

  it("declares one preset-specific axis: offset (subtle | normal | extreme)", () => {
    expect(Object.keys(brutalist.axes)).toEqual(["offset"])
    expect(brutalist.axes.offset.values).toEqual([
      "subtle",
      "normal",
      "extreme",
    ])
    expect(brutalist.axes.offset.default).toBe("normal")
  })

  it("does NOT declare supportedModes (works in both modes)", () => {
    expect(brutalist.supportedModes).toBeUndefined()
  })

  it("hides elevation + buttonElevation common axes", () => {
    expect(brutalist.hiddenCommonAxes).toEqual(["elevation", "buttonElevation"])
  })

  it("generateTokens returns empty (no semantic token rebinds)", () => {
    const generateTokens = brutalist.generateTokens
    if (!generateTokens) throw new Error("generateTokens missing")
    const tokens = generateTokens(
      {} as unknown as Parameters<typeof generateTokens>[0],
      { offset: "normal" },
    )
    expect(tokens).toEqual({})
  })

  describe("surfaceRecipe", () => {
    const slate = surfaceColors.slate as ColorScale

    it("borders are near-foreground in both modes (full structural weight)", () => {
      expect(brutalist.surfaceRecipe.borderDefault(slate, "light")).toBe(
        "0 0% 0%",
      )
      expect(brutalist.surfaceRecipe.borderDefault(slate, "dark")).toBe(
        "0 0% 100%",
      )
    })

    it("drop-shadow overrides are inert (depth comes from offset CSS)", () => {
      expect(brutalist.surfaceRecipe.overrides.shadowCard).toBe("none")
      expect(brutalist.surfaceRecipe.overrides.shadowDropdown).toBe("none")
    })
  })
})
