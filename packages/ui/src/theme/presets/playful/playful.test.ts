// packages/ui/src/theme/presets/playful/playful.test.ts
import { describe, it, expect } from "vitest"
import { playful } from "./playful"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import type { ColorScale } from "@theme/types"

describe("playful preset", () => {
  it("identity fields", () => {
    expect(playful.name).toBe("playful")
    expect(playful.label).toBe("Playful")
    expect(playful.description).toMatch(/bright|friendly|bouncy|playful/i)
  })

  it("declares one preset-specific axis: pop (subtle | lively | exuberant)", () => {
    expect(Object.keys(playful.axes)).toEqual(["pop"])
    expect(playful.axes.pop.values).toEqual(["subtle", "lively", "exuberant"])
    expect(playful.axes.pop.default).toBe("lively")
    expect(playful.axes.pop.label).toBe("Pop")
  })

  it("does NOT declare supportedModes (works in both modes)", () => {
    expect(playful.supportedModes).toBeUndefined()
  })

  it("hides elevation + buttonElevation common axes", () => {
    expect(playful.hiddenCommonAxes).toEqual(["elevation", "buttonElevation"])
  })

  it("generateTokens forces generous radius and rebinds accent/muted/secondary", () => {
    const generateTokens = playful.generateTokens
    if (!generateTokens) throw new Error("generateTokens missing")
    const tokens = generateTokens(
      {} as unknown as Parameters<typeof generateTokens>[0],
      { pop: "lively" },
    )
    expect(tokens["--radius"]).toBe("1rem")
    expect(tokens["--accent"]).toBe("var(--primary) / 0.18")
    expect(tokens["--accent-foreground"]).toBe("var(--primary)")
    expect(tokens["--muted"]).toBe("var(--primary) / 0.07")
    expect(tokens["--secondary"]).toBe("var(--primary) / 0.14")
    expect(tokens["--secondary-foreground"]).toBe("var(--primary)")
  })

  describe("surfaceRecipe", () => {
    const slate = surfaceColors.slate as ColorScale

    it("surfaces match the default preset family (neutral cards)", () => {
      expect(playful.surfaceRecipe.surfaceRaised(slate, "light")).toBe(
        "0 0% 100%",
      )
      expect(playful.surfaceRecipe.surfaceRaised(slate, "dark")).toBe(
        slate[900],
      )
    })

    it("base drop-shadow overrides are present (component-level fallback)", () => {
      expect(playful.surfaceRecipe.overrides.shadowCard).toMatch(/rgb/i)
      expect(playful.surfaceRecipe.overrides.shadowDropdown).toMatch(/rgb/i)
    })
  })
})
