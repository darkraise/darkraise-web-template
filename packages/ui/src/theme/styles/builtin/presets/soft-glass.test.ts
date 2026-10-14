import { describe, expect, it } from "vitest"
import { layers, written } from "@test/preset-tokens"
import { resolveRegistry } from "../../../config/registry"
import { KIT_FALLBACK } from "../../../config/tokens"
import { softGlass } from "./soft-glass"

/** `hsl(var(--card) / max(floor, calc(var(--surface-alpha) * factor - offset)))`. */
const CHROME =
  /^hsl\(var\(--card\) \/ max\(([\d.]+), calc\(var\(--surface-alpha\) \* ([\d.]+) - ([\d.]+)\)\)\)$/

describe("Soft Glass", () => {
  const registry = resolveRegistry()
  const { shared = {}, light = {}, dark = {} } = softGlass.tokens ?? {}

  it("resolves as a Glass preset in the island shell", () => {
    expect(registry.issues).toEqual([])
    expect(registry.presets["soft-glass"]).toMatchObject({
      style: "glass",
      shellStyle: "island",
      builtIn: true,
    })
  })

  it("takes darkcloud's nearest ramps, sets Hanken Grotesk under Newsreader titles and blurs hard", () => {
    expect(softGlass.axes).toEqual({
      accentColor: "indigo",
      surfaceColor: "cool",
      tintWithAccent: "off",
      signalColor: "none",
      font: "hanken-grotesk",
      headingFont: "newsreader",
      glassBlur: "high",
    })
    expect(softGlass.signatures).toEqual({ sliderStyle: "round" })
  })

  it("paints four accent blobs over a page-to-tint ground, each with a flat fallback", () => {
    expect(layers(shared.shellGroundGradient)).toEqual([
      "radial-gradient(47vw 62vh at 6% 4%, var(--ground-blob-1, transparent), transparent 66%)",
      "radial-gradient(43vw 60vh at 96% 0%, var(--ground-blob-2, transparent), transparent 64%)",
      "radial-gradient(58vw 70vh at 70% 108%, var(--ground-blob-3, transparent), transparent 64%)",
      "radial-gradient(43vw 57vh at 22% 96%, var(--ground-blob-4, transparent), transparent 62%)",
      "linear-gradient(135deg, hsl(var(--background)), var(--ground-tint, hsl(var(--shell-ground))))",
    ])
    expect(shared.shellGroundFill).toBeUndefined()
    for (const tokens of [light, dark]) {
      expect(tokens.shellGroundGradient).toBeUndefined()
      expect(tokens.shellGroundFill).toBeUndefined()
    }
  })

  it("frosts cards and chrome through the Blur setting", () => {
    expect(shared.surfaceBackdrop).toBe(
      "var(--glass-backdrop-off, blur(var(--glass-blur)) saturate(110%))",
    )
    expect(shared.chromeBackdrop).toBe(
      "var(--glass-backdrop-off, blur(calc(var(--glass-blur) * 0.75)) saturate(115%))",
    )
    expect(written(softGlass.tokens)).not.toContain("overlayBackdrop")
    expect(written(softGlass.tokens)).not.toContain("scrimBackdrop")
  })

  it("declares its Medium alphas in tokens the kit's fallback resets", () => {
    expect(light.surfaceFillAlpha).toBe("0.64")
    expect(dark.surfaceFillAlpha).toBe("0.62")
    expect(shared.overlayFillAlpha).toBe("0.46")
    const translucency = [
      ...new Set(
        written(softGlass.tokens).filter((token) =>
          /Backdrop$|Alpha$/.test(token),
        ),
      ),
    ].sort()
    expect(translucency).toEqual([
      "chromeBackdrop",
      "overlayFillAlpha",
      "surfaceBackdrop",
      "surfaceFillAlpha",
    ])
    for (const token of translucency) {
      expect(KIT_FALLBACK[token], token).toBeDefined()
    }
  })

  // No fallback resets the pane or the chrome fills, so both read the
  // effective card alpha, which the fallback takes to 1.
  it("derives the pane and the chrome from the effective card alpha, opaque when the cards are", () => {
    expect(shared.shellContentFill).toBe(
      "hsl(var(--card) / var(--surface-alpha))",
    )
    for (const [tokens, medium] of [
      [light, 0.26],
      [dark, 0.34],
    ] as const) {
      expect(tokens.chromeBarFill).toBe(tokens.chromeRailFill)
      const [, floor, factor, offset] =
        CHROME.exec(tokens.chromeRailFill ?? "") ?? []
      expect(Number(floor)).toBe(0.12)
      expect(Number(factor) - Number(offset)).toBeCloseTo(1)
      expect(
        Number(tokens.surfaceFillAlpha) * Number(factor) - Number(offset),
      ).toBeCloseTo(medium, 2)
    }
    expect(shared.chromeRailFill).toBeUndefined()
    expect(shared.chromeBarFill).toBeUndefined()
  })

  it("lifts the current nav row with the rail's own ink", () => {
    expect(light.navSelectionFill).toBe(
      "hsl(var(--sidebar-foreground-hover) / 0.1)",
    )
    expect(dark.navSelectionFill).toBe(
      "hsl(var(--sidebar-foreground-hover) / 0.1)",
    )
    expect(shared.navSelectionFill).toBeUndefined()
  })

  // Glass's white rim and top highlight, over the preset's one soft drop.
  it("edges panes in white under a top highlight and one soft drop, with no ring", () => {
    expect(written(softGlass.tokens)).not.toContain("cardBorder")
    expect(light.cardEdge).toBe(
      "inset 0 1px 0 rgb(255 255 255 / 0.6), 0 10px 26px -18px rgb(0 0 0 / 0.35)",
    )
    expect(dark.cardEdge).toBe(
      "inset 0 1px 0 rgb(255 255 255 / 0.08), 0 10px 26px -18px rgb(0 0 0 / 0.6)",
    )
    expect(written(softGlass.tokens)).not.toContain("cardSheen")
    expect(written(softGlass.tokens)).not.toContain("cardRim")
  })

  it("rounds cards on the radius axis", () => {
    expect(shared.cardRadius).toBe("var(--radius)")
    expect(softGlass.axes?.radius).toBeUndefined()
  })

  it("scrims in the ink in light and near-black in dark", () => {
    expect(light.scrim).toBe("hsl(var(--foreground) / 0.16)")
    expect(dark.scrim).toBe("rgb(0 0 0 / 0.65)")
  })
})
