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

  // The light is strong enough in light mode that a card over it shows
  // the accent (glass-see-through.test.ts).
  it("lights the page and the card rims from the top right", () => {
    expect(light.shellGroundGradient).toBe(
      "radial-gradient(70% 55% at 80% -10%, hsl(var(--primary) / 0.34), transparent 60%)",
    )
    expect(dark.shellGroundGradient).toBe(
      "radial-gradient(70% 55% at 80% -10%, hsl(var(--primary) / 0.2), transparent 60%)",
    )
    expect(shared.shellGroundGradient).toBeUndefined()
    expect(shared.cardRim).toMatch(
      /^linear-gradient\(200deg, hsl\(var\(--primary\) \/ 0\.4\), /,
    )
  })

  it("makes cards dimming glass through tokens the kit's fallback resets", () => {
    expect(shared.surfaceFillAlpha).toBeUndefined()
    expect(light.surfaceFillAlpha).toBe("0.58")
    expect(dark.surfaceFillAlpha).toBe("0.62")
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

  // Glass's white rim edges the cards; the light card keeps its own,
  // brighter top highlight and the dark one takes Glass's.
  it("rims cards in Glass's white edge under a top highlight", () => {
    expect(written(smokedObsidian.tokens)).not.toContain("cardBorder")
    expect(light.cardEdge).toMatch(
      /^inset 0 1px 0 rgb\(255 255 255 \/ 0\.7\), /,
    )
    expect(dark.cardEdge).toMatch(
      /^inset 0 1px 0 rgb\(255 255 255 \/ 0\.08\), /,
    )
  })

  it("recesses fields with an inner top shadow", () => {
    for (const tokens of [light, dark]) {
      expect(tokens.fieldShadow).toMatch(/^inset 0 1px 2px /)
    }
  })
})
