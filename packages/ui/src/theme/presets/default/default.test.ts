import { describe, it, expect } from "vitest"
import { defaultPreset } from "./default"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import type { ColorScale } from "@theme/types"

describe("defaultPreset.surfaceRecipe", () => {
  const slate = surfaceColors.slate as ColorScale

  it("light mode: surface tokens", () => {
    expect(defaultPreset.surfaceRecipe.surfaceRaised(slate, "light")).toBe(
      "0 0% 100%",
    )
    expect(defaultPreset.surfaceRecipe.surfaceOverlay(slate, "light")).toBe(
      "0 0% 100%",
    )
    expect(defaultPreset.surfaceRecipe.surfaceSunken(slate, "light")).toBe(
      slate[100],
    )
    expect(defaultPreset.surfaceRecipe.surfaceSidebar(slate, "light")).toBe(
      slate[50],
    )
    expect(defaultPreset.surfaceRecipe.surfaceHeader(slate, "light")).toBe(
      "0 0% 100%",
    )
    expect(defaultPreset.surfaceRecipe.borderSubtle(slate, "light")).toBe(
      slate[100],
    )
    expect(defaultPreset.surfaceRecipe.borderDefault(slate, "light")).toBe(
      slate[200],
    )
  })

  it("dark mode: surface tokens", () => {
    expect(defaultPreset.surfaceRecipe.surfaceRaised(slate, "dark")).toBe(
      slate[900],
    )
    expect(defaultPreset.surfaceRecipe.surfaceOverlay(slate, "dark")).toBe(
      slate[800],
    )
    expect(defaultPreset.surfaceRecipe.surfaceSunken(slate, "dark")).toBe(
      slate[950],
    )
    expect(defaultPreset.surfaceRecipe.surfaceSidebar(slate, "dark")).toBe(
      slate[950],
    )
    expect(defaultPreset.surfaceRecipe.surfaceHeader(slate, "dark")).toBe(
      slate[900],
    )
    expect(defaultPreset.surfaceRecipe.borderSubtle(slate, "dark")).toBe(
      slate[800],
    )
    expect(defaultPreset.surfaceRecipe.borderDefault(slate, "dark")).toBe(
      slate[700],
    )
  })

  it("overrides", () => {
    expect(defaultPreset.surfaceRecipe.overrides.shadowCard).toBe("none")
    expect(defaultPreset.surfaceRecipe.overrides.shadowDropdown).toBe(
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    )
  })

  it("declares no axes, no generateTokens, no ownedTokenKeys", () => {
    expect(Object.keys(defaultPreset.axes)).toHaveLength(0)
    expect(defaultPreset.generateTokens).toBeUndefined()
    expect(defaultPreset.ownedTokenKeys).toBeUndefined()
  })
})
