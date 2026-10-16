import { describe, expect, it } from "vitest"
import { written } from "@test/preset-tokens"
import { resolveRegistry } from "../../../config/registry"
import { KIT_FALLBACK } from "../../../config/tokens"
import {
  SURFACE_ALPHA_FLOOR,
  TRANSPARENCY_SCALE,
  effectiveAlpha,
} from "../../../config/transparency"
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
      checkStyle: "box",
      tabStyle: "pill",
      sliderStyle: "round",
    })
    expect(registry.signaturesFor("glass", "aurora-night")).toMatchObject({
      ...auroraNight.signatures,
      fieldFill: "translucent",
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
    expect(light.shellGroundGradient).toMatch(
      new RegExp(`^${pool("primary").source}`),
    )
    expect(dark.shellGroundGradient).toMatch(
      new RegExp(`^${pool("primary-text").source}`),
    )
    expect(shared.shellGroundGradient).toBeUndefined()
  })

  // The light rims are brighter than Glass's and stay; the dark ones are
  // Glass's, and every card carries a top highlight.
  it("rims panes in white under a top highlight", () => {
    expect(light.cardBorder).toBe("rgb(255 255 255 / 0.8)")
    expect(light.overlayBorder).toBe(light.cardBorder)
    expect(dark.cardBorder).toBeUndefined()
    expect(dark.overlayBorder).toBeUndefined()
    expect(light.cardEdge).toMatch(
      /^inset 0 1px 0 rgb\(255 255 255 \/ 0\.6\), /,
    )
    expect(dark.cardEdge).toMatch(/^inset 0 1px 0 rgb\(255 255 255 \/ 0\.1\), /)
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
    expect(light.surfaceFillAlpha).toBe("0.5")
    expect(dark.surfaceFillAlpha).toBe("0.58")
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
      "viewTrackBackdrop",
    ])
    for (const token of translucency) {
      expect(KIT_FALLBACK[token], token).toBeDefined()
    }
  })

  // No fallback resets the flat chrome fill, so its alpha is computed from
  // the card alpha the kit's fallback sets to 1, and never clears past 0.4.
  it("thins the rail's glass from the card alpha, opaque when the cards are", () => {
    expect(KIT_FALLBACK.surfaceFillAlpha).toBe("1")
    const [, floor, factor, offset] =
      /^hsl\(var\(--card\) \/ max\(([\d.]+), calc\(var\(--surface-alpha\) \* ([\d.]+) - ([\d.]+)\)\)\)$/.exec(
        shared.chromeFlatFill ?? "",
      ) ?? []
    expect(floor).toBe("0.4")
    expect(Number(factor) - Number(offset)).toBeCloseTo(1)
    for (const tokens of [light, dark]) {
      const cards = Number(tokens.surfaceFillAlpha)
      const rail = Math.max(
        Number(floor),
        cards * Number(factor) - Number(offset),
      )
      // At High the cards turn as clear as the kit allows; the unfloored
      // term is then under the floor, so the floor is what holds the rail.
      const clearest = effectiveAlpha(
        cards,
        TRANSPARENCY_SCALE.high,
        SURFACE_ALPHA_FLOOR,
      )
      expect(clearest * Number(factor) - Number(offset)).toBeLessThan(
        Number(floor),
      )
      expect(rail).toBeLessThan(cards)
      expect(tokens.chromeFlatFill).toBeUndefined()
    }
  })
})
