// packages/ui/src/theme/presets/neon/neon.test.ts
import { describe, it, expect } from "vitest"
import { neon } from "./neon"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import type { ColorScale } from "@theme/types"

describe("neon preset", () => {
  it("identity fields", () => {
    expect(neon.name).toBe("neon")
    expect(neon.label).toBe("Neon")
    expect(neon.description).toMatch(/glow/i)
  })

  it("declares zero preset-specific axes", () => {
    expect(Object.keys(neon.axes)).toHaveLength(0)
  })

  it("declares supportedModes: ['dark']", () => {
    expect(neon.supportedModes).toEqual(["dark"])
  })

  it("has no generateTokens (all dynamic via CSS attribute selectors)", () => {
    expect(neon.generateTokens).toBeUndefined()
  })

  it("ownedTokenKeys covers the rebound elevation + shadow tokens", () => {
    expect(neon.ownedTokenKeys).toEqual([
      "--elevation-flat",
      "--elevation-low",
      "--elevation-medium",
      "--elevation-high",
      "--elevation-current",
      "--card-elevation-low",
      "--card-elevation-medium",
      "--card-elevation-high",
      "--shadow-button",
      "--shadow-card",
      "--shadow-dropdown",
    ])
  })

  describe("surfaceRecipe (dark — the only supported mode)", () => {
    const slate = surfaceColors.slate as ColorScale

    it("surface tokens favour near-black", () => {
      expect(neon.surfaceRecipe.surfaceRaised(slate, "dark")).toBe(slate[950])
      expect(neon.surfaceRecipe.surfaceOverlay(slate, "dark")).toBe(slate[900])
      expect(neon.surfaceRecipe.surfaceSunken(slate, "dark")).toBe("0 0% 4%")
      expect(neon.surfaceRecipe.surfaceSidebar(slate, "dark")).toBe("0 0% 4%")
      expect(neon.surfaceRecipe.surfaceHeader(slate, "dark")).toBe(slate[950])
    })

    it("borders use surface palette mid-tier shades", () => {
      expect(neon.surfaceRecipe.borderSubtle(slate, "dark")).toBe(slate[800])
      expect(neon.surfaceRecipe.borderDefault(slate, "dark")).toBe(slate[700])
    })

    it("drop-shadow overrides are inert (depth comes from glow)", () => {
      expect(neon.surfaceRecipe.overrides.shadowCard).toBe("none")
      expect(neon.surfaceRecipe.overrides.shadowDropdown).toBe("none")
    })
  })

  describe("surfaceRecipe (light — unreachable in normal use, type-safe fallback)", () => {
    const slate = surfaceColors.slate as ColorScale

    it("light branch returns sane fallbacks even though supportedModes blocks it", () => {
      expect(neon.surfaceRecipe.surfaceRaised(slate, "light")).toBe("0 0% 100%")
      expect(neon.surfaceRecipe.surfaceOverlay(slate, "light")).toBe(
        "0 0% 100%",
      )
      expect(neon.surfaceRecipe.surfaceSunken(slate, "light")).toBe(slate[100])
    })
  })
})
