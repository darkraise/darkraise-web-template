import { describe, expect, it } from "vitest"
import { resolveRegistry } from "../../../config/registry"
import { braunPanel } from "./braun-panel"

const RAISED = [
  "cardEdge",
  "dropdownShadow",
  "modalShadow",
  "navSelectionShadow",
] as const

describe("Braun Panel", () => {
  const registry = resolveRegistry()

  it("resolves with no issue as a Tactile preset", () => {
    expect(registry.issues).toEqual([])
    expect(registry.presets["braun-panel"]).toMatchObject({
      style: "tactile",
      shellStyle: "framed",
      builtIn: true,
    })
  })

  it("sets its palette and faces, and no other axis", () => {
    expect(braunPanel.axes).toEqual({
      accentColor: "neutral",
      surfaceColor: "sand",
      tintWithAccent: "off",
      signalColor: "yellow",
      font: "geist",
      headingFont: "body",
    })
  })

  it("sets the bar on the housing, lowers labels and lights lamps on banners", () => {
    expect(braunPanel.signatures).toEqual({
      barTone: "page",
      barSpan: "content",
      labelCase: "lower",
      tooltipTone: "inverse",
      cardDivider: "seam",
      tableHead: "seam",
      bannerMark: "lamp",
      bannerSurface: "card",
      badgeStyle: "outline",
      fieldFill: "well",
      dialogFooter: "plain",
      avatarShape: "round",
    })
    expect(registry.signaturesFor("tactile", "braun-panel")).toMatchObject({
      ...braunPanel.signatures,
      navSelection: "chip",
    })
  })

  it("rings a focused field with the signal colour", () => {
    expect(braunPanel.tokens?.shared?.fieldFocusRing).toBe(
      "0 0 0 3px hsl(var(--signal-fill) / 0.55)",
    )
  })

  it("joins parts at a seam, a dark line over a light one", () => {
    expect(braunPanel.tokens?.light?.seamHighlight).toBe("rgb(255 255 255)")
    expect(braunPanel.tokens?.dark).toMatchObject({
      seam: "rgb(0 0 0 / 0.5)",
      seamHighlight: "rgb(255 255 255 / 0.05)",
    })
  })

  // Tactile bevels all four sides of a raised surface. Here each takes a
  // soft drop, in both modes: a mode left out would fall back to the bevel.
  it("lights raised surfaces from above instead of bevelling them", () => {
    for (const mode of ["light", "dark"] as const) {
      const tokens = braunPanel.tokens?.[mode] ?? {}
      for (const token of RAISED) {
        expect(tokens[token], `${mode} ${token}`).toBeDefined()
        expect(tokens[token], `${mode} ${token}`).not.toContain(
          "--tactile-bevel",
        )
      }
      for (const token of [
        "cardEdge",
        "navSelectionShadow",
        "buttonNeutralEdge",
      ] as const) {
        expect(tokens[token], `${mode} ${token}`).toMatch(
          /^inset 0 1px 0 rgb\(255 255 255/,
        )
      }
    }
  })

  // The preset's layer sits above Tactile's dark values, so a shared black,
  // white or ink shadow would paint dark mode too. The chrome seam alone is
  // light only: dark keeps the kit's edge.
  it("writes every literal and ink shadow per mode", () => {
    const shared = Object.entries(braunPanel.tokens?.shared ?? {})
    expect(shared.length).toBeGreaterThan(0)
    for (const [token, value] of shared) {
      expect(value, token).not.toMatch(/rgb\(|--foreground/)
    }
    const light = Object.entries(braunPanel.tokens?.light ?? {})
      .filter(([, value]) => /rgb\(|--foreground/.test(value))
      .map(([token]) => token)
    const dark = Object.keys(braunPanel.tokens?.dark ?? {})
    expect(light.filter((token) => !dark.includes(token))).toEqual([
      "chromeEdge",
    ])
  })
})
