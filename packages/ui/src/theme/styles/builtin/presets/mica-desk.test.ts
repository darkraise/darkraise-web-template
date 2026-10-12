import { describe, expect, it } from "vitest"
import { resolveRegistry } from "../../../config/registry"
import type { ModeTokens } from "../../../config/schema"
import { KIT_FALLBACK, type PaintToken } from "../../../config/tokens"
import { glass } from "../glass"
import { micaDesk } from "./mica-desk"

const MODES = ["shared", "light", "dark"] as const

/** Every token the preset writes, in any mode. */
function written(tokens: ModeTokens | undefined): PaintToken[] {
  return MODES.flatMap(
    (mode) => Object.keys(tokens?.[mode] ?? {}) as PaintToken[],
  )
}

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
      glassOpacity: "subtle",
    })
  })

  it("shows the canvas through the shell ground under an accent bloom", () => {
    for (const tokens of [light, dark]) {
      expect(tokens.shellGroundFill).toMatch(
        /^radial-gradient\(80% 70% at 10% 0%, hsl\(var\(--primary\) \/ 0\.1\d\), transparent 60%\)$/,
      )
    }
    expect(shared.shellGroundFill).toBeUndefined()
  })

  it("lays content on a slab fainter than its cards, opaque when they are", () => {
    expect(shared.surfaceFillAlpha).toBe("0.75")
    expect(shared.shellContentFill).toBe(
      "hsl(var(--card) / calc(var(--surface-fill-alpha) * 2 - 1))",
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

  // Glass keys these on the glassOpacity and glassBlur axes; a preset that
  // set one would take the axis away from the user.
  it("leaves the overlay fill and every blur to the glass axes", () => {
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
    const tokens = written(micaDesk.tokens)
    expect(tokens.filter((token) => owned.includes(token))).toEqual([])
    expect(tokens.filter((token) => token.endsWith("Backdrop"))).toEqual([])
  })
})
