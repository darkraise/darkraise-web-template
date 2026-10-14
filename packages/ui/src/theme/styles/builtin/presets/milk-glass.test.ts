import { describe, expect, it } from "vitest"
import { written } from "@test/preset-tokens"
import { resolveRegistry } from "../../../config/registry"
import { KIT_FALLBACK } from "../../../config/tokens"
import { milkGlass } from "./milk-glass"

describe("Milk Glass", () => {
  const registry = resolveRegistry()
  const { shared = {}, light = {}, dark = {} } = milkGlass.tokens ?? {}

  it("resolves as a Glass preset in the flat shell", () => {
    expect(registry.issues).toEqual([])
    expect(registry.presets["milk-glass"]).toMatchObject({
      style: "glass",
      shellStyle: "flat",
      builtIn: true,
    })
  })

  it("frosts the nav row, rules card headers and lights banners with a lamp", () => {
    expect(milkGlass.signatures).toEqual({
      navSelection: "frosted",
      cardDivider: "hairline",
      bannerMark: "lamp",
      bannerSurface: "card",
      badgeStyle: "tint",
    })
    expect(registry.signaturesFor("glass", "milk-glass")).toMatchObject({
      ...milkGlass.signatures,
      barEdge: "veil",
      menuHighlight: "tint",
      tooltipTone: "inverse",
      fieldFill: "translucent",
      tableHead: "plain",
    })
  })

  it("sets a faint blob canvas under milky, hard-blurring menus", () => {
    expect(milkGlass.axes).toEqual({
      accentColor: "coral",
      surfaceColor: "cool",
      tintWithAccent: "off",
      signalColor: "none",
      font: "geist",
      headingFont: "body",
      backgroundIntensity: "subtle",
      glassBlur: "high",
    })
  })

  // The halo at the bottom right is strong enough that a card over it shows
  // the accent (glass-see-through.test.ts); the two at the top stay faint
  // under the page header's text.
  it("shows the canvas through the shell ground between three accent halos", () => {
    const alphas = (value: string | undefined) =>
      [...(value ?? "").matchAll(/hsl\(var\(--primary\) \/ ([\d.]+)\)/g)].map(
        ([, alpha]) => alpha,
      )
    for (const tokens of [light, dark]) {
      expect(tokens.shellGroundGradient).toMatch(
        /^(?:radial-gradient\(\d+% \d+% at \d+% \d+%, hsl\(var\(--primary\) \/ 0\.\d+\), transparent 70%\)(?:, )?){3}$/,
      )
    }
    expect(alphas(light.shellGroundGradient)).toEqual(["0.26", "0.14", "0.38"])
    expect(alphas(dark.shellGroundGradient)).toEqual(["0.2", "0.1", "0.32"])
    expect(shared.shellGroundGradient).toBeUndefined()
  })

  it("makes cards blurring milk through tokens the kit's fallback resets", () => {
    expect(light.surfaceFillAlpha).toBe("0.62")
    expect(dark.surfaceFillAlpha).toBe("0.64")
    expect(shared.surfaceBackdrop).toBe(
      "var(--glass-backdrop-off, blur(var(--glass-blur)) saturate(180%))",
    )
    const translucency = written(milkGlass.tokens).filter((token) =>
      /Backdrop$|Alpha$/.test(token),
    )
    expect([...new Set(translucency)].sort()).toEqual([
      "overlayFillAlpha",
      "surfaceBackdrop",
      "surfaceFillAlpha",
    ])
    for (const token of translucency) {
      expect(KIT_FALLBACK[token], token).toBeDefined()
    }
  })

  // No fallback resets the flat chrome fill, so its alpha is computed from
  // the card alpha the kit's fallback sets to 1, and never clears past 0.4.
  it("thins the rail's milk from the card alpha, opaque when the cards are", () => {
    expect(KIT_FALLBACK.surfaceFillAlpha).toBe("1")
    for (const tokens of [light, dark]) {
      const [, floor, factor, offset] =
        /^hsl\(var\(--card\) \/ max\(([\d.]+), calc\(var\(--surface-alpha\) \* ([\d.]+) - ([\d.]+)\)\)\)$/.exec(
          tokens.chromeFlatFill ?? "",
        ) ?? []
      expect(floor).toBe("0.4")
      expect(Number(factor) - Number(offset)).toBeCloseTo(1)
      const cards = Number(tokens.surfaceFillAlpha)
      const rail = Math.max(
        Number(floor),
        cards * Number(factor) - Number(offset),
      )
      expect(rail).toBeGreaterThanOrEqual(0.4)
      expect(rail).toBeLessThan(cards)
    }
    expect(shared.chromeFlatFill).toBeUndefined()
  })

  it("edges panes in white and floats them on wide soft shadows", () => {
    // The light rim is brighter than Glass's and stays; the dark one is
    // Glass's.
    expect(light.cardBorder).toBe("rgb(255 255 255 / 0.9)")
    expect(light.overlayBorder).toBe(light.cardBorder)
    expect(dark.cardBorder).toBeUndefined()
    expect(dark.overlayBorder).toBeUndefined()
    for (const tokens of [light, dark]) {
      expect(tokens.cardEdge).toMatch(/0 24px 48px -12px /)
      expect(tokens.cardEdge).toMatch(/^inset 0 1px 0 rgb\(255 255 255 \/ /)
    }
  })

  it("fogs the scrim in the page colour and leaves the dialog its border", () => {
    for (const tokens of [light, dark]) {
      expect(tokens.scrim).toBe("hsl(var(--background) / 0.45)")
    }
    expect(written(milkGlass.tokens)).not.toContain("dialogBorder")
    expect(written(milkGlass.tokens)).not.toContain("dialogFill")
  })
})
