import { describe, expect, it } from "vitest"
import { written } from "@test/preset-tokens"
import { resolveRegistry } from "../../../config/registry"
import { KIT_FALLBACK } from "../../../config/tokens"
import { micaDesk } from "./mica-desk"

describe("Mica Desk", () => {
  const registry = resolveRegistry()
  const { shared = {}, light = {}, dark = {} } = micaDesk.tokens ?? {}

  it("resolves as a Glass preset in the inset shell", () => {
    expect(registry.issues).toEqual([])
    expect(registry.presets["mica-desk"]).toMatchObject({
      style: "glass",
      shellStyle: "inset",
      builtIn: true,
    })
  })

  it("marks the nav with the accent pill, drops the veil and underlines fields", () => {
    expect(micaDesk.signatures).toEqual({
      navSelection: "pill",
      barEdge: "none",
      menuHighlight: "neutral",
      cardDivider: "hairline",
      badgeStyle: "tint",
      fieldBorder: "bottom",
      dialogFooter: "band",
    })
    expect(registry.signaturesFor("glass", "mica-desk")).toMatchObject({
      ...micaDesk.signatures,
      tooltipTone: "inverse",
      bannerMark: "icon",
      fieldFill: "surface",
      tableHead: "plain",
    })
  })

  it("sets 4px controls on a balanced blob canvas under nearly opaque menus", () => {
    expect(micaDesk.axes).toEqual({
      accentColor: "blue",
      surfaceColor: "zinc",
      tintWithAccent: "off",
      signalColor: "none",
      font: "inter",
      headingFont: "body",
      radius: "subtle",
      gradientPattern: "blobs",
      backgroundIntensity: "balanced",
    })
  })

  it("shows the canvas through the shell ground under an accent bloom", () => {
    for (const tokens of [light, dark]) {
      expect(tokens.shellGroundGradient).toMatch(
        /^radial-gradient\(80% 70% at 10% 0%, hsl\(var\(--primary\) \/ 0\.1\d\), transparent 60%\)$/,
      )
    }
    expect(shared.shellGroundGradient).toBeUndefined()
  })

  it("lays content on a slab fainter than its cards, opaque when they are", () => {
    expect(shared.surfaceFillAlpha).toBe("0.75")
    expect(shared.shellContentFill).toBe(
      "hsl(var(--card) / calc(var(--surface-alpha) * 2 - 1))",
    )
    expect(KIT_FALLBACK.surfaceFillAlpha).toBe("1")
  })

  it("keeps content flat: cards and buttons cast no shadow", () => {
    for (const token of [
      "cardEdge",
      "buttonShadow",
      "buttonNeutralShadow",
    ] as const) {
      expect(shared[token], token).toBe("0 0 transparent")
      expect(light[token], token).toBeUndefined()
      expect(dark[token], token).toBeUndefined()
    }
  })

  it("underlines a focused field in the accent rather than ringing it", () => {
    expect(shared.fieldFocusBorder).toBe("hsl(var(--primary))")
    expect(shared.fieldFocusRing).toBe("inset 0 -1px 0 hsl(var(--primary))")
  })

  it("edges banners in the ink of each mode, so a dark banner keeps its edge", () => {
    expect(shared.bannerBorder).toBeUndefined()
    expect(light.bannerBorder).toBe("rgb(0 0 0 / 0.06)")
    expect(dark.bannerBorder).toBe(dark.dialogBorder)
  })

  it("rounds cards, menus and dialogs at twice the control radius", () => {
    for (const token of [
      "cardRadius",
      "overlayRadius",
      "dialogRadius",
    ] as const) {
      expect(shared[token], token).toBe("calc(var(--radius) * 2)")
    }
  })

  // Glass's own backdrop frosts the cards and menus, sized by the Blur
  // setting; the preset writes none of its own.
  it("frosts with Glass's backdrops", () => {
    expect(
      written(micaDesk.tokens).filter((token) => token.endsWith("Backdrop")),
    ).toEqual([])
  })
})
