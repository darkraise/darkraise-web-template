import { describe, it, expect } from "vitest"
import { defaultPreset } from "./default"
import { surfaceStyles } from "@theme/styles/surfaceStyles"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import type { ColorScale, ResolvedMode } from "@theme/types"

describe("defaultPreset.surfaceRecipe", () => {
  const slate = surfaceColors.slate as ColorScale
  const modes: ResolvedMode[] = ["light", "dark"]
  const tokens = [
    "surfaceRaised",
    "surfaceOverlay",
    "surfaceSunken",
    "surfaceSidebar",
    "surfaceHeader",
    "borderSubtle",
    "borderDefault",
  ] as const

  it.each(modes)("%s: matches surfaceStyles.default output exactly", (mode) => {
    for (const token of tokens) {
      const newValue = defaultPreset.surfaceRecipe[token](slate, mode)
      const legacyValue = surfaceStyles.default.tokens[token](slate, mode)
      expect(newValue, `${token} (${mode})`).toBe(legacyValue)
    }
  })

  it("overrides match the legacy default", () => {
    expect(defaultPreset.surfaceRecipe.overrides.shadowCard).toBe(
      surfaceStyles.default.overrides.shadowCard,
    )
    expect(defaultPreset.surfaceRecipe.overrides.shadowDropdown).toBe(
      surfaceStyles.default.overrides.shadowDropdown,
    )
  })

  it("declares no axes", () => {
    expect(Object.keys(defaultPreset.axes)).toHaveLength(0)
  })

  it("has no generateTokens function (no cross-axis math needed)", () => {
    expect(defaultPreset.generateTokens).toBeUndefined()
  })

  it("has no ownedTokenKeys (nothing to clean up on leaving)", () => {
    expect(defaultPreset.ownedTokenKeys).toBeUndefined()
  })
})
