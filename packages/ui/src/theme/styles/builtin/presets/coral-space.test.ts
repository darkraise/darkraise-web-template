import { describe, expect, it } from "vitest"
import { layers, written } from "@test/preset-tokens"
import { resolveRegistry } from "../../../config/registry"
import { KIT_FALLBACK } from "../../../config/tokens"
import { coralSpace } from "./coral-space"

describe("Coral Space", () => {
  const registry = resolveRegistry()
  const { shared = {}, light = {}, dark = {} } = coralSpace.tokens ?? {}

  it("resolves as a Glass preset in the inset shell", () => {
    expect(registry.issues).toEqual([])
    expect(registry.presets["coral-space"]).toMatchObject({
      style: "glass",
      shellStyle: "inset",
      builtIn: true,
    })
  })

  it("drops the bar's veil, sets rail labels as written and rules card headers", () => {
    expect(coralSpace.signatures).toEqual({
      barEdge: "none",
      labelCase: "none",
      cardDivider: "hairline",
      badgeStyle: "tint",
      fieldFill: "translucent",
    })
    expect(registry.signaturesFor("glass", "coral-space")).toMatchObject({
      ...coralSpace.signatures,
      navSelection: "chip",
      menuHighlight: "tint",
      tooltipTone: "inverse",
      bannerMark: "icon",
      tableHead: "plain",
    })
  })

  // The ground is opaque paint, so no canvas axis would show behind it.
  it("sets no axis beyond its palette, its faces and the calm dark accent", () => {
    expect(coralSpace.axes).toEqual({
      accentColor: "rose",
      surfaceColor: "olive",
      tintWithAccent: "on",
      signalColor: "none",
      font: "inter",
      headingFont: "body",
      darkAccentChroma: "calm",
    })
  })

  it("paints the shell ground opaque from the accent ramp", () => {
    expect(layers(light.shellGroundGradient).slice(-2)).toEqual([
      "linear-gradient(155deg, transparent 30%, hsl(var(--primary-6) / 0.18))",
      "hsl(var(--primary-5))",
    ])
    expect(layers(dark.shellGroundGradient).slice(-2)).toEqual([
      "linear-gradient(155deg, hsl(var(--primary-6) / 0.22), transparent 55%)",
      "linear-gradient(155deg, hsl(var(--primary-2)), hsl(var(--primary-1)))",
    ])
    expect(shared.shellGroundGradient).toBeUndefined()
  })

  // The rail's ink is solved on the page colour, not on this ground: the
  // grain may only move the ground away from the ink.
  it("grains the ground with dots that lighten in light and darken in dark", () => {
    const tile = (colour: string) =>
      new RegExp(
        `^radial-gradient\\(circle at \\d+px \\d+px, ${colour} / 0\\.\\d+\\) 0\\.\\dpx, transparent 1\\.\\dpx\\) 0 0 / (\\d+)px \\1px$`,
      )
    const lightGrain = layers(light.shellGroundGradient).slice(0, -2)
    const darkGrain = layers(dark.shellGroundGradient).slice(0, -2)
    expect(lightGrain).toHaveLength(4)
    expect(darkGrain).toHaveLength(4)
    for (const layer of lightGrain) {
      expect(layer).toMatch(tile("rgb\\(255 255 255"))
    }
    for (const layer of darkGrain) {
      expect(layer).toMatch(tile("rgb\\(0 0 0"))
    }
  })

  it("sets the work on a pane fainter than its cards, with a shadow, opaque when they are", () => {
    expect(shared.shellContentFill).toBe(
      "hsl(var(--background) / calc(var(--surface-alpha) * 2 - 1))",
    )
    expect(light.surfaceFillAlpha).toBe("0.82")
    expect(dark.surfaceFillAlpha).toBe("0.8")
    expect(shared.overlayFillAlpha).toBe("0.65")
    for (const tokens of [light, dark]) {
      expect(tokens.shellContentFill).toBeUndefined()
      expect(tokens.shellContentEdge).toBeDefined()
      expect(tokens.shellContentShadow).toMatch(/^0 \d+px \d+px -\d+px /)
    }
    const translucency = written(coralSpace.tokens).filter((token) =>
      /Backdrop$|Alpha$/.test(token),
    )
    expect([...new Set(translucency)].sort()).toEqual([
      "overlayFillAlpha",
      "surfaceFillAlpha",
    ])
    for (const token of translucency) {
      expect(KIT_FALLBACK[token], token).toBeDefined()
    }
  })

  it("marks the current nav row with a white pill that has no edge", () => {
    expect(shared.navSelectionEdge).toBe("transparent")
    expect(light.navSelectionFill).toBe("hsl(var(--card) / 0.9)")
    expect(dark.navSelectionFill).toBe("rgb(255 255 255 / 0.14)")
    expect(light.navSelectionShadow).toMatch(
      /^0 1px 2px hsl\(var\(--foreground\) /,
    )
    expect(dark.navSelectionShadow).toBe(
      "inset 0 1px 0 rgb(255 255 255 / 0.08)",
    )
    expect(shared.navItemRadius).toBe("calc(var(--radius) * 1.25)")
  })
})
