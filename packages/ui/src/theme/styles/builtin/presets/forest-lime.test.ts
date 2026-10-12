import { describe, expect, it } from "vitest"
import { resolveRegistry } from "../../../config/registry"
import { PAINT_TOKENS, type PaintToken } from "../../../config/tokens"
import { forestLime } from "./forest-lime"

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

describe("Forest & Lime", () => {
  const registry = resolveRegistry()

  it("resolves as a Flat preset with no issue", () => {
    expect(registry.issues).toEqual([])
    expect(registry.presets["forest-lime"]).toMatchObject({
      style: "flat",
      builtIn: true,
      shellStyle: "framed",
    })
  })

  it("tones the rail and the bar with the accent and rings its fields", () => {
    expect(forestLime.signatures).toEqual({
      railTone: "accent",
      barTone: "accent",
      navSelection: "tint",
      menuHighlight: "neutral",
      labelCase: "auto",
      fieldFill: "surface",
      fieldBorder: "box",
      dialogHeader: "plain",
    })
    expect(registry.signaturesFor("flat", "forest-lime")).toMatchObject({
      railTone: "accent",
      barTone: "accent",
      navSelection: "tint",
      fieldBorder: "box",
      tooltipTone: "inverse",
      badgeStyle: "tint",
      bannerMark: "icon",
      tableHead: "plain",
    })
  })

  it("sets taller pill controls and leaves depth and the canvas to Flat", () => {
    expect(forestLime.axes).toEqual({
      accentColor: "lime",
      surfaceColor: "olive",
      tintWithAccent: "off",
      signalColor: "none",
      font: "inter",
      headingFont: "body",
      radius: "pill",
      density: "comfortable",
    })
  })

  it("draws no blurred shadow in either mode, under the frame included", () => {
    expect(forestLime.tokens?.shared?.shellShadow).toBe("0 0 transparent")
    for (const mode of ["shared", "light", "dark"] as const) {
      const tokens = forestLime.tokens?.[mode] ?? {}
      for (const token of SHADOW_TOKENS) {
        const value = tokens[token]
        if (value === undefined || value === "none") continue
        expect(blurs(value), `${mode} ${token}: ${value}`).toEqual(
          blurs(value).map(() => 0),
        )
      }
    }
  })

  it("paints the frame's seams and ring in the frame's own fill", () => {
    expect(forestLime.tokens?.shared).toMatchObject({
      chromeEdge: "hsl(var(--surface-sidebar))",
      shellFrameEdge: "hsl(var(--surface-sidebar))",
    })
  })

  it("stands the content on white in light and on the accent's deepest step in dark", () => {
    expect(forestLime.tokens?.shared?.shellGroundFill).toBe("hsl(var(--card))")
    expect(forestLime.tokens?.dark?.shellGroundFill).toBe(
      "hsl(var(--primary-1))",
    )
  })

  it("edges cards in light and dialogs in dark", () => {
    expect(forestLime.tokens?.shared).toMatchObject({
      cardBorder: "hsl(var(--border))",
      dialogBorder: "transparent",
    })
    expect(forestLime.tokens?.dark).toMatchObject({
      cardBorder: "transparent",
      dialogBorder: "rgb(255 255 255 / 0.2)",
    })
  })
})
