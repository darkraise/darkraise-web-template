import { describe, expect, it } from "vitest"
import { written } from "@test/preset-tokens"
import { resolveRegistry } from "../../../config/registry"
import { KIT_FALLBACK } from "../../../config/tokens"
import { auroraNight } from "./aurora-night"

describe("Aurora Night", () => {
  const registry = resolveRegistry()
  const { shared = {}, light = {}, dark = {} } = auroraNight.tokens ?? {}

  it("resolves as a Glass preset in the flat shell", () => {
    expect(registry.issues).toEqual([])
    expect(registry.presets["aurora-night"]).toMatchObject({
      style: "glass",
      shellStyle: "flat",
      builtIn: true,
    })
  })

  it("washes the nav row in the accent and sets figures in the mono face", () => {
    expect(auroraNight.signatures).toEqual({
      navSelection: "accent",
      figureFamily: "mono",
      cardDivider: "hairline",
      badgeStyle: "tint",
      fieldFill: "translucent",
    })
    expect(registry.signaturesFor("glass", "aurora-night")).toMatchObject({
      ...auroraNight.signatures,
      barEdge: "veil",
      menuHighlight: "tint",
      tooltipTone: "inverse",
      bannerMark: "icon",
      tableHead: "plain",
    })
  })

  it("sets a faint aurora canvas and leaves the glass axes to the style", () => {
    expect(auroraNight.axes).toEqual({
      accentColor: "teal",
      surfaceColor: "gray",
      tintWithAccent: "off",
      signalColor: "none",
      font: "geist",
      headingFont: "body",
      gradientPattern: "aurora",
      backgroundIntensity: "subtle",
    })
  })

  it("pools accent light along the top of a clear shell ground, from its middle rightward", () => {
    const pool = (token: string) =>
      new RegExp(
        `(?:radial-gradient\\(\\d+% \\d+% at (?:[5-9]\\d)% (?:1?\\d)%, hsl\\(var\\(--${token}\\) / 0\\.\\d+\\), transparent 70%\\)(?:, )?){3}$`,
      )
    expect(light.shellGroundFill).toMatch(
      new RegExp(`^${pool("primary").source}`),
    )
    expect(dark.shellGroundFill).toMatch(
      new RegExp(`^${pool("primary-text").source}`),
    )
    expect(shared.shellGroundFill).toBeUndefined()
  })

  it("glows the primary action, the focused field and the current nav row", () => {
    const glow = (token: string) =>
      `0 0 0 1px hsl(var(--${token}) / 0.35), 0 0 24px -4px hsl(var(--${token}) / 0.35)`
    expect(light.buttonShadow).toBe(glow("primary"))
    expect(light.fieldFocusRing).toBe(glow("primary"))
    expect(dark.buttonShadow).toBe(glow("primary-text"))
    expect(dark.fieldFocusRing).toBe(glow("primary-text"))
    expect(shared.buttonDangerShadow).toBe(glow("destructive-solid"))
    expect(light.navSelectionGlow).toBe(
      "0 0 16px -4px hsl(var(--primary) / 0.35)",
    )
    expect(dark.navSelectionGlow).toBe(
      "0 0 18px -4px hsl(var(--primary-text) / 0.45)",
    )
    // The focused field keeps the kit's accent border under the glow.
    expect(written(auroraNight.tokens)).not.toContain("fieldFocusBorder")
  })

  it("makes cards thin glass through tokens the kit's fallback resets", () => {
    expect(light.surfaceFillAlpha).toBe("0.62")
    expect(dark.surfaceFillAlpha).toBe("0.57")
    expect(shared.surfaceBackdrop).toBe(
      "var(--glass-backdrop-off, blur(var(--glass-blur)) saturate(160%))",
    )
    const translucency = written(auroraNight.tokens).filter((token) =>
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
  // the card alpha the kit's fallback sets to 1.
  it("thins the rail's glass from the card alpha, opaque when the cards are", () => {
    expect(KIT_FALLBACK.surfaceFillAlpha).toBe("1")
    const [, factor, offset] =
      /^hsl\(var\(--card\) \/ calc\(var\(--surface-alpha\) \* ([\d.]+) - ([\d.]+)\)\)$/.exec(
        shared.chromeFlatFill ?? "",
      ) ?? []
    expect(Number(factor) - Number(offset)).toBeCloseTo(1)
    for (const tokens of [light, dark]) {
      const cards = Number(tokens.surfaceFillAlpha)
      const rail = cards * Number(factor) - Number(offset)
      expect(rail).toBeGreaterThan(0.4)
      expect(rail).toBeLessThan(cards)
      expect(tokens.chromeFlatFill).toBeUndefined()
    }
  })
})
