import { describe, expect, it } from "vitest"
import { resolveRegistry } from "../../../config/registry"
import type { ModeTokens } from "../../../config/schema"
import { KIT_FALLBACK, type PaintToken } from "../../../config/tokens"
import { glass } from "../glass"
import { auroraNight } from "./aurora-night"

const MODES = ["shared", "light", "dark"] as const

/** Every token the preset writes, in any mode. */
function written(tokens: ModeTokens | undefined): PaintToken[] {
  return MODES.flatMap(
    (mode) => Object.keys(tokens?.[mode] ?? {}) as PaintToken[],
  )
}

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

  it("pools accent light at the top right of a clear shell ground", () => {
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
    expect(dark.surfaceFillAlpha).toBe("0.55")
    expect(shared.surfaceBackdrop).toBe("blur(20px) saturate(160%)")
    const translucency = written(auroraNight.tokens).filter((token) =>
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
  it("thins the rail's glass from the card alpha, opaque when the cards are", () => {
    expect(KIT_FALLBACK.surfaceFillAlpha).toBe("1")
    const [, factor, offset] =
      /^hsl\(var\(--card\) \/ calc\(var\(--surface-fill-alpha\) \* ([\d.]+) - ([\d.]+)\)\)$/.exec(
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
    const tokens = written(auroraNight.tokens)
    expect(tokens.filter((token) => owned.includes(token))).toEqual([])
  })
})
