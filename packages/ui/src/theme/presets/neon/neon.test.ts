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

  it("declares a single preset-specific axis: glow (dim | normal | bright | intense)", () => {
    expect(Object.keys(neon.axes)).toEqual(["glow"])
    expect(neon.axes.glow.values).toEqual([
      "dim",
      "normal",
      "bright",
      "intense",
    ])
    expect(neon.axes.glow.default).toBe("normal")
    expect(neon.axes.glow.label).toBe("Glow")
  })

  it("declares supportedModes: ['dark']", () => {
    expect(neon.supportedModes).toEqual(["dark"])
  })

  it("declares hiddenCommonAxes: ['elevation', 'buttonElevation']", () => {
    expect(neon.hiddenCommonAxes).toEqual(["elevation", "buttonElevation"])
  })

  it("generateTokens rebinds accent/muted/secondary tokens to primary-tinted values", () => {
    const generateTokens = neon.generateTokens
    expect(generateTokens).toBeDefined()
    if (!generateTokens) return // narrowing for TS; expectation above asserts
    // common fixture isn't used by Neon's generateTokens (values are
    // pure CSS expressions referencing --primary at use time) — but
    // the type contract requires a CommonAxisInput shape, so we pass
    // a minimal stub through unknown to bypass strict ColorScale typing.
    const tokens = generateTokens(
      {} as unknown as Parameters<typeof generateTokens>[0],
      {},
    )
    expect(tokens["--accent"]).toBe("var(--primary) / 0.15")
    expect(tokens["--accent-foreground"]).toBe("var(--primary)")
    expect(tokens["--muted"]).toBe("var(--primary) / 0.06")
    expect(tokens["--secondary"]).toBe("var(--primary) / 0.12")
    expect(tokens["--secondary-foreground"]).toBe("var(--primary)")
  })

  it("generateTokens does NOT rebind --muted-foreground (must stay a muted gray for text legibility)", () => {
    const generateTokens = neon.generateTokens
    if (!generateTokens) throw new Error("generateTokens missing")
    const tokens = generateTokens(
      {} as unknown as Parameters<typeof generateTokens>[0],
      {},
    )
    expect(tokens["--muted-foreground"]).toBeUndefined()
  })

  it("ownedTokenKeys lists only what generateTokens actually writes", () => {
    // All glow tokens are CSS-driven (self-clean via cascade) and the
    // engine overwrites --shadow-card / --shadow-dropdown on switch.
    // Only the 5 semantic-token rebinds need explicit cleanup.
    expect(neon.ownedTokenKeys).toEqual([
      "--accent",
      "--accent-foreground",
      "--muted",
      "--secondary",
      "--secondary-foreground",
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
