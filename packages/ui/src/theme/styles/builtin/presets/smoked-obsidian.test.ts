import { describe, expect, it } from "vitest"
import { written } from "@test/preset-tokens"
import { resolveRegistry } from "../../../config/registry"
import { KIT_FALLBACK } from "../../../config/tokens"
import { smokedObsidian } from "./smoked-obsidian"

describe("Smoked Obsidian", () => {
  const registry = resolveRegistry()
  const { shared = {}, light = {}, dark = {} } = smokedObsidian.tokens ?? {}

  it("resolves as a Glass preset that leaves the shell to the layout", () => {
    expect(registry.issues).toEqual([])
    expect(registry.presets["smoked-obsidian"]).toMatchObject({
      style: "glass",
      builtIn: true,
    })
    expect(registry.presets["smoked-obsidian"]?.shellStyle).toBeUndefined()
  })

  it("tones the chrome inverse, rules the bar and washes the nav in the accent", () => {
    expect(smokedObsidian.signatures).toEqual({
      navSelection: "accent",
      railTone: "inverse",
      barTone: "inverse",
      barEdge: "rule",
      menuHighlight: "neutral",
      cardDivider: "hairline",
      bannerMark: "stripe",
      badgeStyle: "chip",
      fieldFill: "well",
    })
    expect(registry.signaturesFor("glass", "smoked-obsidian")).toMatchObject({
      ...smokedObsidian.signatures,
      tooltipTone: "inverse",
      tableHead: "plain",
    })
  })

  it("sets a calm dark accent on a grain canvas under nearly opaque menus", () => {
    expect(smokedObsidian.axes).toEqual({
      accentColor: "amber",
      surfaceColor: "neutral",
      tintWithAccent: "off",
      signalColor: "none",
      font: "geist",
      headingFont: "body",
      darkAccentChroma: "calm",
      gradientPattern: "grain",
    })
  })

  // Glass docks its rail on the page colour; the inverse tone's ink is
  // solved on the sidebar surface, so the rail must be painted in it.
  it("paints the toned rail in the fill its ink is solved on, rimmed in the accent", () => {
    expect(shared.chromeRailFill).toBe("hsl(var(--surface-sidebar))")
    expect(shared.chromeEdge).toBe("hsl(var(--primary) / 0.3)")
    for (const tokens of [light, dark]) {
      expect(tokens.chromeRailFill).toBeUndefined()
      expect(tokens.chromeBarFill).toBeUndefined()
    }
  })

  it("lights the page and the card rims from the top right", () => {
    for (const tokens of [light, dark]) {
      expect(tokens.shellGroundGradient).toMatch(
        /^radial-gradient\(70% 55% at 80% -10%, hsl\(var\(--primary\) \/ 0\.\d+\), transparent 60%\)$/,
      )
    }
    expect(shared.shellGroundGradient).toBeUndefined()
    expect(shared.cardRim).toMatch(
      /^linear-gradient\(200deg, hsl\(var\(--primary\) \/ 0\.4\), /,
    )
  })

  it("makes cards dimming glass through tokens the kit's fallback resets", () => {
    expect(shared.surfaceFillAlpha).toBe("0.7")
    expect(light.surfaceBackdrop).toBe(
      "var(--glass-backdrop-off, blur(var(--glass-blur)) saturate(90%))",
    )
    expect(dark.surfaceBackdrop).toBe(
      "var(--glass-backdrop-off, blur(var(--glass-blur)) saturate(110%) brightness(0.7))",
    )
    const translucency = written(smokedObsidian.tokens).filter((token) =>
      /Backdrop$|Alpha$/.test(token),
    )
    expect([...new Set(translucency)].sort()).toEqual([
      "overlayFillAlpha",
      "surfaceBackdrop",
      "surfaceFillAlpha",
    ])
    for (const token of translucency) {
      expect(KIT_FALLBACK[token], token).toBeDefined()
    }
  })

  it("recesses fields with an inner top shadow", () => {
    for (const tokens of [light, dark]) {
      expect(tokens.fieldShadow).toMatch(/^inset 0 1px 2px /)
    }
  })
})
