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

  it("hides elevation + buttonElevation + radius common axes", () => {
    expect(playful.hiddenCommonAxes).toEqual([
      "elevation",
      "buttonElevation",
      "radius",
    ])
  })

  it("generateTokens forces generous radius and mode-aware accent/muted/secondary", () => {
    const generateTokens = playful.generateTokens
    if (!generateTokens) throw new Error("generateTokens missing")

    const dark = generateTokens(
      { mode: "dark" } as unknown as Parameters<typeof generateTokens>[0],
      { pop: "lively" },
    )
    expect(dark["--radius"]).toBe("1rem")
    expect(dark["--radius-button"]).toBe("1rem")
    expect(dark["--accent"]).toBe("var(--primary) / 0.2")
    expect(dark["--accent-foreground"]).toBe("var(--primary)")
    expect(dark["--muted"]).toBe("var(--primary) / 0.08")
    expect(dark["--secondary"]).toBe("var(--primary) / 0.16")
    expect(dark["--secondary-foreground"]).toBe("var(--primary)")

    const light = generateTokens(
      { mode: "light" } as unknown as Parameters<typeof generateTokens>[0],
      { pop: "lively" },
    )
    // Light-mode alphas are lower (white surfaces register tint at
    // smaller alpha values than near-black surfaces).
    expect(light["--accent"]).toBe("var(--primary) / 0.14")
    expect(light["--muted"]).toBe("var(--primary) / 0.06")
    expect(light["--secondary"]).toBe("var(--primary) / 0.11")
  })

  it("ownedTokenKeys lists only what generateTokens actually writes", () => {
    // No CSS-only tokens — those self-clean via the cascade. Just the
    // 2 radius keys + 5 accent/muted/secondary keys.
    expect(playful.ownedTokenKeys).toEqual([
      "--radius",
      "--radius-button",
      "--accent",
      "--accent-foreground",
      "--muted",
      "--secondary",
      "--secondary-foreground",
    ])
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
