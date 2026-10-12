import { describe, expect, it } from "vitest"
import { layers, written } from "@test/preset-tokens"
import { resolveRegistry } from "../../../config/registry"
import { glass } from "../glass"
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
    expect(layers(light.shellGroundFill).slice(-2)).toEqual([
      "linear-gradient(155deg, transparent 30%, hsl(var(--primary-6) / 0.18))",
      "hsl(var(--primary-5))",
    ])
    expect(layers(dark.shellGroundFill).slice(-2)).toEqual([
      "linear-gradient(155deg, hsl(var(--primary-6) / 0.22), transparent 55%)",
      "linear-gradient(155deg, hsl(var(--primary-2)), hsl(var(--primary-1)))",
    ])
    expect(shared.shellGroundFill).toBeUndefined()
  })

  // The rail's ink is solved on the page colour, not on this ground: the
  // grain may only move the ground away from the ink.
  it("grains the ground with dots that lighten in light and darken in dark", () => {
    const tile = (colour: string) =>
      new RegExp(
        `^radial-gradient\\(circle at \\d+px \\d+px, ${colour} / 0\\.\\d+\\) 0\\.\\dpx, transparent 1\\.\\dpx\\) 0 0 / (\\d+)px \\1px$`,
      )
    const lightGrain = layers(light.shellGroundFill).slice(0, -2)
    const darkGrain = layers(dark.shellGroundFill).slice(0, -2)
    expect(lightGrain).toHaveLength(4)
    expect(darkGrain).toHaveLength(4)
    for (const layer of lightGrain) {
      expect(layer).toMatch(tile("rgb\\(255 255 255"))
    }
    for (const layer of darkGrain) {
      expect(layer).toMatch(tile("rgb\\(0 0 0"))
    }
  })

  it("sets the work on an opaque pane with a shadow, and writes no translucency", () => {
    expect(shared.shellContentFill).toBe("hsl(var(--background))")
    for (const tokens of [light, dark]) {
      expect(tokens.shellContentFill).toBeUndefined()
      expect(tokens.shellContentEdge).toBeDefined()
      expect(tokens.shellContentShadow).toMatch(/^0 \d+px \d+px -\d+px /)
    }
    expect(
      written(coralSpace.tokens).filter((token) =>
        /Backdrop$|Alpha$/.test(token),
      ),
    ).toEqual([])
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

  // Glass keys these on the glassOpacity and glassBlur axes; a preset that
  // set one would take the axis away from the user.
  it("leaves the overlay fill and every overlay blur to the glass axes", () => {
    const owned = [
      ...new Set(
        glass.when?.flatMap((entry) => Object.keys(entry.tokens ?? {})),
      ),
    ]
    expect(owned).toEqual([
      "overlayFillBase",
      "overlayBackdrop",
      "scrimBackdrop",
    ])
    const tokens = written(coralSpace.tokens)
    expect(tokens.filter((token) => owned.includes(token))).toEqual([])
  })
})
