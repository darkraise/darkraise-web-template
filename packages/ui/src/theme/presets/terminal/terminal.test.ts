// packages/ui/src/theme/presets/terminal/terminal.test.ts
import { describe, it, expect } from "vitest"
import { terminal } from "./terminal"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import type { ColorScale } from "@theme/types"

describe("terminal preset", () => {
  it("identity fields", () => {
    expect(terminal.name).toBe("terminal")
    expect(terminal.label).toBe("Terminal")
    expect(terminal.description).toMatch(/crt|monospace|phosphor/i)
  })

  it("declares phosphor + scanlines axes", () => {
    expect(Object.keys(terminal.axes).sort()).toEqual(["phosphor", "scanlines"])
    expect(terminal.axes.phosphor.values).toEqual(["off", "dim", "bright"])
    expect(terminal.axes.phosphor.default).toBe("dim")
    expect(terminal.axes.scanlines.values).toEqual(["off", "subtle", "visible"])
    expect(terminal.axes.scanlines.default).toBe("off")
  })

  it("declares supportedModes: ['dark']", () => {
    expect(terminal.supportedModes).toEqual(["dark"])
  })

  it("hides elevation, buttonElevation, and radius common axes", () => {
    expect(terminal.hiddenCommonAxes).toEqual([
      "elevation",
      "buttonElevation",
      "radius",
    ])
  })

  it("generateTokens forces sharp corners, monospace font, primary-tinted accent", () => {
    const generateTokens = terminal.generateTokens
    if (!generateTokens) throw new Error("generateTokens missing")
    const tokens = generateTokens(
      {} as unknown as Parameters<typeof generateTokens>[0],
      { phosphor: "dim", scanlines: "off" },
    )
    expect(tokens["--radius"]).toBe("0px")
    expect(tokens["--font-sans"]).toMatch(/monospace/i)
    expect(tokens["--accent"]).toBe("var(--primary) / 0.12")
    expect(tokens["--accent-foreground"]).toBe("var(--primary)")
  })

  describe("surfaceRecipe (dark — the only supported mode)", () => {
    const slate = surfaceColors.slate as ColorScale

    it("surfaces favor near-black, borders are full-white at high tier", () => {
      expect(terminal.surfaceRecipe.surfaceRaised(slate, "dark")).toBe(
        "0 0% 6%",
      )
      expect(terminal.surfaceRecipe.surfaceOverlay(slate, "dark")).toBe(
        "0 0% 8%",
      )
      expect(terminal.surfaceRecipe.surfaceSunken(slate, "dark")).toBe(
        "0 0% 3%",
      )
      expect(terminal.surfaceRecipe.borderDefault(slate, "dark")).toBe(
        "0 0% 25%",
      )
    })

    it("drop-shadow overrides are inert (CRT aesthetic doesn't drop shadows)", () => {
      expect(terminal.surfaceRecipe.overrides.shadowCard).toBe("none")
      expect(terminal.surfaceRecipe.overrides.shadowDropdown).toBe("none")
    })
  })
})
