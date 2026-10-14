import { describe, expect, it } from "vitest"
import { SHADOW_TOKENS } from "@test/preset-tokens"
import { resolveRegistry } from "@theme/config/registry"
import { paperInk } from "./paper-ink"

/** The layers of a box-shadow value that cast outside the box. */
function dropLayers(value: string): string[] {
  return value
    .split(/,(?![^(]*\))/)
    .map((layer) => layer.trim())
    .filter((layer) => layer !== "" && !layer.startsWith("inset"))
}

describe("Paper & Ink", () => {
  const registry = resolveRegistry()
  const preset = registry.presets["paper-ink"]

  it("resolves as a Quiet preset with no issue", () => {
    expect(registry.issues).toEqual([])
    expect(preset).toMatchObject({ style: "quiet", builtIn: true })
  })

  it("sets the page as a printed sheet: paper chrome, a ruled nav row, margin-note footers", () => {
    expect(paperInk.signatures).toEqual({
      navSelection: "rule",
      railTone: "page",
      barTone: "page",
      tooltipTone: "inverse",
      cardFooter: "inset",
      bannerMark: "stripe",
      badgeStyle: "tint",
      fieldFill: "surface",
      tableHead: "ruled",
      dialogHeader: "plain",
      dialogFooter: "ruled",
      avatarShape: "round",
      switchStyle: "track",
      checkStyle: "outline",
      tabStyle: "underline",
      sliderStyle: "ruled",
    })
    expect(registry.signaturesFor("quiet", "paper-ink")).toMatchObject(
      paperInk.signatures ?? {},
    )
  })

  it("writes a signature only where it differs from Quiet", () => {
    const quiet = registry.signaturesFor("quiet", "base")
    for (const [key, value] of Object.entries(paperInk.signatures ?? {})) {
      expect(value, key).not.toBe(quiet[key as keyof typeof quiet])
    }
  })

  it("sets its palette, its faces and a calm dark accent, and no other axis", () => {
    expect(paperInk.axes).toEqual({
      accentColor: "blue",
      surfaceColor: "sand",
      tintWithAccent: "off",
      signalColor: "none",
      font: "geist",
      headingFont: "newsreader",
      darkAccentChroma: "calm",
    })
  })

  it("paints the flat chrome in the page colour", () => {
    expect(paperInk.tokens?.shared?.chromeFlatFill).toBe(
      "hsl(var(--background))",
    )
  })

  it("casts every light shadow in the text colour and every dark one in black", () => {
    const shared = paperInk.tokens?.shared ?? {}
    const dark = paperInk.tokens?.dark ?? {}
    const cast = SHADOW_TOKENS.filter((token) =>
      dropLayers(shared[token] ?? "").some(
        (layer) => !layer.includes("--quiet-"),
      ),
    )
    expect(cast).toEqual([
      "buttonShadow",
      "buttonNeutralShadow",
      "thumbShadow",
      "cardEdge",
      "dropdownShadow",
      "buttonDangerShadow",
      "modalShadow",
    ])
    for (const token of cast) {
      for (const layer of dropLayers(shared[token] ?? "")) {
        if (layer.includes("--quiet-")) continue
        expect(layer, `shared ${token}`).toContain("hsl(var(--foreground) / ")
      }
      expect(dark[token], `dark ${token}`).toBeDefined()
      for (const layer of dropLayers(dark[token] ?? "")) {
        if (layer.includes("--quiet-")) continue
        expect(layer, `dark ${token}`).toContain("rgb(0 0 0 / ")
      }
    }
  })

  it("sets every title at the serif's medium weight", () => {
    expect(paperInk.tokens?.shared).toMatchObject({
      pageTitleWeight: "500",
      sectionTitleWeight: "500",
      dialogTitleWeight: "500",
    })
  })
})
