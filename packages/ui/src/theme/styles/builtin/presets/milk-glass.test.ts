import { describe, expect, it } from "vitest"
import { written } from "@test/preset-tokens"
import { resolveRegistry } from "../../../config/registry"
import { KIT_FALLBACK } from "../../../config/tokens"
import { glass } from "../glass"
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
      fieldFill: "surface",
      tableHead: "plain",
    })
  })

  it("sets a faint blob canvas under nearly opaque, hard-blurring menus", () => {
    expect(milkGlass.axes).toEqual({
      accentColor: "coral",
      surfaceColor: "cool",
      tintWithAccent: "off",
      signalColor: "none",
      font: "geist",
      headingFont: "body",
      gradientPattern: "blobs",
      backgroundIntensity: "subtle",
      glassOpacity: "subtle",
      glassBlur: "high",
    })
  })

  it("shows the canvas through the shell ground between three accent halos", () => {
    for (const tokens of [light, dark]) {
      expect(tokens.shellGroundFill).toMatch(
        /^(?:radial-gradient\(\d+% \d+% at \d+% \d+%, hsl\(var\(--primary\) \/ 0\.\d+\), transparent 70%\)(?:, )?){3}$/,
      )
    }
    expect(shared.shellGroundFill).toBeUndefined()
  })

  it("makes cards blurring milk through tokens the kit's fallback resets", () => {
    expect(light.surfaceFillAlpha).toBe("0.78")
    expect(dark.surfaceFillAlpha).toBe("0.8")
    expect(shared.surfaceBackdrop).toBe("blur(32px) saturate(180%)")
    const translucency = written(milkGlass.tokens).filter((token) =>
      /Backdrop$|Alpha$/.test(token),
    )
    expect([...new Set(translucency)].sort()).toEqual([
      "surfaceBackdrop",
      "surfaceFillAlpha",
    ])
    for (const token of translucency) {
      expect(KIT_FALLBACK[token], token).toBeDefined()
    }
  })

  // No fallback resets the flat chrome fill, so its alpha is computed from
  // the card alpha the kit's fallback sets to 1.
  it("thins the rail's milk from the card alpha, opaque when the cards are", () => {
    expect(KIT_FALLBACK.surfaceFillAlpha).toBe("1")
    for (const tokens of [light, dark]) {
      const [, factor, offset] =
        /^hsl\(var\(--card\) \/ calc\(var\(--surface-fill-alpha\) \* ([\d.]+) - ([\d.]+)\)\)$/.exec(
          tokens.chromeFlatFill ?? "",
        ) ?? []
      expect(Number(factor) - Number(offset)).toBeCloseTo(1)
      const cards = Number(tokens.surfaceFillAlpha)
      const rail = cards * Number(factor) - Number(offset)
      expect(rail).toBeGreaterThan(0.5)
      expect(rail).toBeLessThan(cards)
    }
    expect(shared.chromeFlatFill).toBeUndefined()
  })

  it("edges panes in white and floats them on wide soft shadows", () => {
    expect(light.cardBorder).toBe("rgb(255 255 255 / 0.9)")
    expect(dark.cardBorder).toBe("rgb(255 255 255 / 0.1)")
    expect(light.overlayBorder).toBe(light.cardBorder)
    expect(dark.overlayBorder).toBe(dark.cardBorder)
    for (const tokens of [light, dark]) {
      expect(tokens.cardEdge).toMatch(/0 24px 48px -12px /)
    }
  })

  it("fogs the scrim in the page colour and leaves the dialog its border", () => {
    for (const tokens of [light, dark]) {
      expect(tokens.scrim).toBe("hsl(var(--background) / 0.45)")
    }
    expect(written(milkGlass.tokens)).not.toContain("dialogBorder")
    expect(written(milkGlass.tokens)).not.toContain("dialogFill")
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
    const tokens = written(milkGlass.tokens)
    expect(tokens.filter((token) => owned.includes(token))).toEqual([])
  })
})
