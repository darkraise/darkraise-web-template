import { describe, expect, it } from "vitest"
import { resolveRegistry } from "../../../config/registry"
import { cardStock } from "./card-stock"

const RAISED = [
  "cardEdge",
  "dropdownShadow",
  "modalShadow",
  "navSelectionShadow",
  "selectedViewShadow",
] as const

describe("Card Stock", () => {
  const registry = resolveRegistry()

  it("resolves with no issue as a Tactile preset in the inset shell", () => {
    expect(registry.issues).toEqual([])
    expect(registry.presets["card-stock"]).toMatchObject({
      style: "tactile",
      shellStyle: "inset",
      builtIn: true,
    })
  })

  it("sets its palette, faces, tight corners and calm dark accent, and no other axis", () => {
    expect(cardStock.axes).toEqual({
      accentColor: "blue",
      surfaceColor: "sand",
      tintWithAccent: "off",
      signalColor: "none",
      font: "geist",
      headingFont: "newsreader",
      radius: "subtle",
      darkAccentChroma: "calm",
    })
  })

  it("sets the bar on the desk, rules card heads and outlines badges", () => {
    expect(cardStock.signatures).toEqual({
      barTone: "page",
      barSpan: "content",
      labelCase: "auto",
      tooltipTone: "inverse",
      cardDivider: "hairline",
      tableHead: "plain",
      badgeStyle: "outline",
      fieldFill: "well",
      dialogFooter: "plain",
      avatarShape: "round",
    })
    expect(registry.signaturesFor("tactile", "card-stock")).toMatchObject({
      ...cardStock.signatures,
      navSelection: "chip",
      bannerMark: "icon",
      ghostButton: "wash",
    })
  })

  // In a shell whose content is not detached the page stands on the shell
  // ground, so the light desk stops at the muted step, where status text
  // still holds its floor. Dark keeps the kit's ground, and the borderless
  // sheet shows it: a dark pane without an edge takes the backdrop colour.
  it("lays one sheet on the desk, edged like a card and nothing more", () => {
    expect(cardStock.tokens?.shared?.shellContentEdge).toBe("transparent")
    expect(cardStock.tokens?.shared?.shellContentShadow).toBe("0 0 transparent")
    expect(cardStock.tokens?.light).toMatchObject({
      shellGroundFill: "hsl(var(--neutral-3))",
      shellContentFill: "hsl(var(--card))",
    })
    expect(cardStock.tokens?.dark?.shellGroundFill).toBeUndefined()
    expect(cardStock.tokens?.dark?.shellContentFill).toBe("transparent")
    for (const mode of ["light", "dark"] as const) {
      expect(cardStock.tokens?.[mode]?.shellContentShadow, mode).toBeUndefined()
    }
  })

  // Tactile bevels all four sides of a raised surface. Here each is a sheet
  // of paper with a hairline ring, in both modes: a mode left out would fall
  // back to the bevel.
  it("rings raised surfaces like paper instead of bevelling them", () => {
    for (const mode of ["light", "dark"] as const) {
      const tokens = cardStock.tokens?.[mode] ?? {}
      for (const token of RAISED) {
        const value = tokens[token] ?? ""
        expect(value, `${mode} ${token}`).toMatch(/(?:^|, )0 0 0 1px /)
        expect(value, `${mode} ${token}`).not.toContain("--tactile-bevel")
      }
    }
  })

  // A sheen that opened with a white alpha, or a white grain denser than a
  // sheen may be, would lift the card face above what the lifted field edge
  // is solved for.
  it("grains the card under a sheen that opens clear", () => {
    const opensClear =
      /^linear-gradient\(180deg, rgb\(255 255 255 \/ 0\), rgb\(255 255 255 \/ 0\)\), url\("data:image\/svg\+xml;utf8,<svg /
    const ink = (value: string) =>
      /feColorMatrix values='0 0 0 0 ([01]) 0 0 0 0 \1 0 0 0 0 \1 ([\d.]+) 0 0 0 0'/.exec(
        value,
      )
    const light = cardStock.tokens?.light?.cardSheen ?? ""
    const dark = cardStock.tokens?.dark?.cardSheen ?? ""
    expect(light).toMatch(opensClear)
    expect(dark).toMatch(opensClear)
    expect(light).toContain("feTurbulence type='fractalNoise'")
    expect(ink(light)?.slice(1)).toEqual(["0", "0.05"])
    expect(ink(dark)?.slice(1)).toEqual(["1", "0.03"])
  })

  it("presses fields into the sheet and rings the focused one in the accent", () => {
    expect(cardStock.tokens?.shared).toMatchObject({
      fieldFocusRing: "0 0 0 3px hsl(var(--primary) / 0.2)",
      fieldFocusBorder: "hsl(var(--primary-text))",
    })
    for (const mode of ["light", "dark"] as const) {
      expect(cardStock.tokens?.[mode]?.fieldShadow ?? "", mode).toMatch(
        /^inset 0 1px [\d.]+px .+, 0 1px 0 rgb\(255 255 255 \/ [\d.]+\)$/,
      )
    }
  })

  // The preset's layer sits above Tactile's dark values, so a shared black,
  // white or ink shadow would paint dark mode too.
  it("writes every literal and ink shadow per mode", () => {
    const shared = Object.entries(cardStock.tokens?.shared ?? {})
    expect(shared.length).toBeGreaterThan(0)
    for (const [token, value] of shared) {
      expect(value, token).not.toMatch(/rgb\(|--foreground/)
    }
    const light = Object.entries(cardStock.tokens?.light ?? {})
      .filter(([, value]) => /rgb\(|--foreground/.test(value))
      .map(([token]) => token)
    const dark = Object.keys(cardStock.tokens?.dark ?? {})
    expect(light.length).toBeGreaterThan(0)
    expect(light.filter((token) => !dark.includes(token))).toEqual([])
  })
})
