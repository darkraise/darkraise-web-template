import { describe, expect, it } from "vitest"
import { resolveRegistry } from "../../../config/registry"
import { PAINT_TOKENS, type PaintToken } from "../../../config/tokens"
import { pastelSoft } from "./pastel-soft"

const SHADOW_TOKENS = (Object.keys(PAINT_TOKENS) as PaintToken[]).filter(
  (token) => /Shadow|Edge|Rim|Glow|Ring/.test(token),
)

/** The blur radius of each layer of a box-shadow value. */
function blurs(value: string): number[] {
  return value.split(/,(?![^(]*\))/).map((layer) => {
    const lengths = layer
      .replace(/(rgb|hsl|color-mix|var)\([^)]*(\([^)]*\))*[^)]*\)/g, "")
      .trim()
      .split(/\s+/)
      .filter((part) => /^-?[\d.]+(px)?$/.test(part))
    return lengths.length >= 3 ? Number.parseFloat(lengths[2] ?? "0") : 0
  })
}

describe("Pastel Soft-Flat", () => {
  const registry = resolveRegistry()

  it("resolves as a Flat preset with no issue", () => {
    expect(registry.issues).toEqual([])
    expect(registry.presets["pastel-soft"]).toMatchObject({
      style: "flat",
      builtIn: true,
      shellStyle: "flat",
    })
  })

  it("selects the nav row as a chip, washes the menu row and capitalises the rail's group labels", () => {
    expect(pastelSoft.signatures).toEqual({
      navSelection: "chip",
      menuHighlight: "tint",
      labelCase: "auto",
    })
    expect(registry.signaturesFor("flat", "pastel-soft")).toMatchObject({
      navSelection: "chip",
      menuHighlight: "tint",
      labelCase: "auto",
      tooltipTone: "inverse",
      fieldBorder: "none",
      badgeStyle: "tint",
      bannerMark: "icon",
      dialogHeader: "band",
    })
  })

  it("sets pill controls and leaves depth and the canvas to Flat", () => {
    expect(pastelSoft.axes).toEqual({
      accentColor: "indigo",
      surfaceColor: "sand",
      tintWithAccent: "off",
      signalColor: "none",
      font: "geist",
      headingFont: "body",
      radius: "pill",
    })
  })

  it("draws no blurred shadow in either mode", () => {
    for (const mode of ["shared", "light", "dark"] as const) {
      const tokens = pastelSoft.tokens?.[mode] ?? {}
      for (const token of SHADOW_TOKENS) {
        const value = tokens[token]
        if (value === undefined || value === "none") continue
        expect(blurs(value), `${mode} ${token}: ${value}`).toEqual(
          blurs(value).map(() => 0),
        )
      }
    }
  })

  it("lays a dot grain over the page colour under the whole shell", () => {
    const grain =
      /^radial-gradient\(hsl\(var\(--foreground\) \/ 0\.0\d\) 1px, transparent 1px\) 0 0 \/ 12px 12px, hsl\(var\(--background\)\)$/
    expect(pastelSoft.tokens?.shared?.shellGroundFill).toMatch(grain)
    expect(pastelSoft.tokens?.dark?.shellGroundFill).toMatch(grain)
    expect(pastelSoft.tokens?.shared?.chromeFlatFill).toBe("transparent")
  })

  it("leaves cards borderless and fills the outline button from the accent", () => {
    expect(pastelSoft.tokens?.shared).toMatchObject({
      cardBorder: "transparent",
      buttonNeutralFill: "hsl(var(--primary-3))",
    })
  })

  it("rings a focused field outside a gap in the card colour", () => {
    expect(pastelSoft.tokens?.shared).toMatchObject({
      fieldFocusRing:
        "0 0 0 2px hsl(var(--card)), 0 0 0 4px hsl(var(--primary))",
    })
    expect(pastelSoft.tokens?.shared?.fieldFocusBorder).toBeUndefined()
  })
})
