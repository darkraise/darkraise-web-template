import { describe, expect, it } from "vitest"
import { resolveRegistry } from "../../../config/registry"
import { darkInstrument } from "./dark-instrument"

const RAISED = [
  "cardEdge",
  "dropdownShadow",
  "modalShadow",
  "navSelectionShadow",
  "buttonEdge",
  "buttonNeutralEdge",
] as const

/** An inset white line along the top, half a pixel or one pixel down. */
const SPECULAR_TOP = /inset 0 (?:0\.5|1)px [\d.px ]*rgb\(255 255 255/

describe("Dark Instrument", () => {
  const registry = resolveRegistry()

  it("resolves with no issue as a Tactile preset in the layout's own shell", () => {
    expect(registry.issues).toEqual([])
    const preset = registry.presets["dark-instrument"]
    expect(preset).toMatchObject({ style: "tactile", builtIn: true })
    expect(preset?.shellStyle).toBeUndefined()
  })

  it("sets its palette and faces, and no other axis", () => {
    expect(darkInstrument.axes).toEqual({
      accentColor: "coral",
      surfaceColor: "graphite",
      tintWithAccent: "off",
      signalColor: "none",
      font: "ibm-plex-sans",
      headingFont: "body",
    })
  })

  it("sets a flush bar, uppercase labels, monospace figures and lamps on banners", () => {
    expect(darkInstrument.signatures).toEqual({
      barTone: "page",
      barSpan: "content",
      labelCase: "upper",
      figureFamily: "mono",
      cardDivider: "seam",
      tableHead: "seam",
      bannerMark: "lamp",
      bannerSurface: "card",
      fieldFill: "well",
      dialogFooter: "plain",
      switchStyle: "marked",
      tabStyle: "outline",
      sliderStyle: "ruled",
    })
    expect(registry.signaturesFor("tactile", "dark-instrument")).toMatchObject({
      ...darkInstrument.signatures,
      navSelection: "chip",
      badgeStyle: "tint",
      avatarShape: "square",
    })
  })

  it("edges the flush chrome with a double seam under a 44px bar", () => {
    expect(darkInstrument.tokens?.shared?.chromeBarHeight).toBe("2.75rem")
    expect(darkInstrument.tokens?.dark).toMatchObject({
      chromeBarFill: "hsl(var(--background))",
      chromeEdge: "rgb(0 0 0)",
      chromeShadow: "1px 1px 0 rgb(255 255 255 / 0.06)",
      seam: "rgb(0 0 0)",
      seamHighlight: "rgb(255 255 255 / 0.04)",
    })
    expect(darkInstrument.tokens?.light).toMatchObject({
      chromeEdge: "hsl(var(--foreground) / 0.22)",
      chromeShadow: "1px 1px 0 rgb(255 255 255 / 0.7)",
    })
  })

  // Tactile bevels all four sides of a raised surface. Here each carries a
  // specular line on top only, in both modes: a mode left out would fall
  // back to the bevel.
  it("puts a specular top edge on every raised surface", () => {
    for (const mode of ["light", "dark"] as const) {
      const tokens = darkInstrument.tokens?.[mode] ?? {}
      for (const token of RAISED) {
        const value = tokens[token] ?? ""
        expect(value, `${mode} ${token}`).toMatch(SPECULAR_TOP)
        expect(value, `${mode} ${token}`).not.toContain("--tactile-bevel")
      }
    }
  })

  it("lights the filled key with a glow in the accent", () => {
    for (const mode of ["light", "dark"] as const) {
      expect(darkInstrument.tokens?.[mode]?.buttonShadow ?? "", mode).toMatch(
        /0 0 1[24]px hsl\(var\(--primary\) \/ 0\.25\)/,
      )
    }
    expect(darkInstrument.tokens?.shared?.buttonSheen).toBe("none")
  })

  // The preset's layer sits above Tactile's dark values, so a shared black,
  // white or ink shadow would paint dark mode too. The scrim alone is light
  // only: dark keeps Tactile's.
  it("writes every literal and ink shadow per mode", () => {
    const shared = Object.entries(darkInstrument.tokens?.shared ?? {})
    expect(shared.length).toBeGreaterThan(0)
    for (const [token, value] of shared) {
      expect(value, token).not.toMatch(/rgb\(|--foreground/)
    }
    const light = Object.entries(darkInstrument.tokens?.light ?? {})
      .filter(([, value]) => /rgb\(|--foreground/.test(value))
      .map(([token]) => token)
    const dark = Object.keys(darkInstrument.tokens?.dark ?? {})
    expect(light.filter((token) => !dark.includes(token))).toEqual(["scrim"])
  })
})
