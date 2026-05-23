// packages/ui/src/theme/presets/scifi/scifi.test.ts
import { describe, it, expect } from "vitest"
import { scifi } from "./scifi"

describe("scifi preset", () => {
  it("identity fields", () => {
    expect(scifi.name).toBe("scifi")
    expect(scifi.label).toBe("Sci-fi")
    expect(scifi.description).toMatch(/hud|angular|glowing/i)
  })

  it("declares intensity + frame axes", () => {
    expect(Object.keys(scifi.axes).sort()).toEqual(["frame", "intensity"])
    expect(scifi.axes.intensity.values).toEqual(["dim", "normal", "bright"])
    expect(scifi.axes.intensity.default).toBe("normal")
    expect(scifi.axes.frame.values).toEqual(["clean", "notched", "bracketed"])
    expect(scifi.axes.frame.default).toBe("notched")
  })

  it("declares supportedModes: ['dark']", () => {
    expect(scifi.supportedModes).toEqual(["dark"])
  })

  it("hides elevation, buttonElevation, and radius common axes", () => {
    expect(scifi.hiddenCommonAxes).toEqual([
      "elevation",
      "buttonElevation",
      "radius",
    ])
  })

  it("generateTokens forces sharp corners + monospace + primary-tinted accent", () => {
    const generateTokens = scifi.generateTokens
    if (!generateTokens) throw new Error("generateTokens missing")
    const tokens = generateTokens(
      {} as unknown as Parameters<typeof generateTokens>[0],
      { intensity: "normal", frame: "notched" },
    )
    expect(tokens["--radius"]).toBe("0px")
    expect(tokens["--radius-button"]).toBe("0px")
    // Geometric squared-sans stack (Orbitron / Rajdhani / Eurostile),
    // not monospace — sci-fi HUDs use squared geometric sans, monospace
    // is the Terminal preset's signature.
    expect(tokens["--font-sans"]).toMatch(/orbitron/i)
    expect(tokens["--accent"]).toBe("var(--primary) / 0.14")
    expect(tokens["--accent-foreground"]).toBe("var(--primary)")
    expect(tokens["--muted"]).toBe("var(--primary) / 0.05")
    expect(tokens["--secondary"]).toBe("var(--primary) / 0.1")
    expect(tokens["--secondary-foreground"]).toBe("var(--primary)")
  })

  it("ownedTokenKeys lists only what generateTokens actually writes", () => {
    expect(scifi.ownedTokenKeys).toEqual([
      "--accent",
      "--accent-foreground",
      "--muted",
      "--secondary",
      "--secondary-foreground",
      "--radius",
      "--radius-button",
      "--font-sans",
    ])
  })

  describe("surfaceRecipe (dark — the only supported mode)", () => {
    // Sci-fi's surfaceRecipe ignores the palette argument (uses
    // hardcoded blue-tinted hsl values) so a stub is fine. Cast
    // through unknown to bypass the strict ColorScale requirement
    // — eslint forbids non-null assertion shortcuts.
    const stub = {} as unknown as Parameters<
      typeof scifi.surfaceRecipe.surfaceRaised
    >[0]

    it("surfaces use cool blue-tinted near-black", () => {
      expect(scifi.surfaceRecipe.surfaceRaised(stub, "dark")).toBe("215 28% 7%")
      expect(scifi.surfaceRecipe.surfaceSunken(stub, "dark")).toBe("215 32% 5%")
    })

    it("drop-shadow overrides are inert (depth comes from intensity glow)", () => {
      expect(scifi.surfaceRecipe.overrides.shadowCard).toBe("none")
      expect(scifi.surfaceRecipe.overrides.shadowDropdown).toBe("none")
    })
  })
})
