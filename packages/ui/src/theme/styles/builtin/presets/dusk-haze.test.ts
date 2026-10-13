import { describe, expect, it } from "vitest"
import { written } from "@test/preset-tokens"
import { resolveRegistry } from "../../../config/registry"
import { KIT_FALLBACK } from "../../../config/tokens"
import { duskHaze } from "./dusk-haze"

/** The engine tokens a value names, sorted. */
function named(value: string | undefined): string[] {
  const names = new Set<string>()
  for (const [, name] of (value ?? "").matchAll(/var\(--([\w-]+)\)/g)) {
    if (name) names.add(name)
  }
  return [...names].sort()
}

describe("Dusk Haze", () => {
  const registry = resolveRegistry()
  const { shared = {}, light = {}, dark = {} } = duskHaze.tokens ?? {}

  it("resolves as a Glass preset in the flat shell", () => {
    expect(registry.issues).toEqual([])
    expect(registry.presets["dusk-haze"]).toMatchObject({
      style: "glass",
      shellStyle: "flat",
      builtIn: true,
    })
  })

  it("washes the nav row in a neutral tint with no marker, and keeps menus neutral", () => {
    expect(duskHaze.signatures).toEqual({
      navSelection: "pill",
      navMarker: "none",
      menuHighlight: "neutral",
      labelCase: "none",
      cardDivider: "hairline",
      bannerSurface: "card",
      badgeStyle: "tint",
      fieldFill: "translucent",
    })
    expect(registry.signaturesFor("glass", "dusk-haze")).toMatchObject({
      ...duskHaze.signatures,
      barEdge: "veil",
      tooltipTone: "inverse",
      bannerMark: "icon",
      tableHead: "plain",
    })
  })

  it("sets pill controls over a faint spotlight canvas", () => {
    expect(duskHaze.axes).toEqual({
      accentColor: "indigo",
      surfaceColor: "sand",
      tintWithAccent: "on",
      signalColor: "none",
      font: "geist",
      headingFont: "body",
      radius: "pill",
      gradientPattern: "spotlight",
      backgroundIntensity: "subtle",
    })
  })

  it("builds the haze from the neutral ramp under one light, clear at the top", () => {
    expect(light.shellGroundFill).toMatch(
      /^radial-gradient\(42% 24% at 46% 12%, rgb\(255 255 255 \/ 0\.85\), transparent 70%\), /,
    )
    expect(named(light.shellGroundFill)).toEqual(["neutral-6", "neutral-7"])
    expect(light.shellGroundFill).toMatch(
      /, linear-gradient\(180deg, hsl\(var\(--neutral-6\) \/ 0\.35\), hsl\(var\(--neutral-6\)\) 46%\)$/,
    )
    expect(dark.shellGroundFill).toMatch(
      /^radial-gradient\(38% 20% at 45% 22%, hsl\(var\(--primary-text\) \/ 0\.14\), transparent 70%\), /,
    )
    expect(named(dark.shellGroundFill)).toEqual([
      "neutral-3",
      "neutral-7",
      "primary-text",
    ])
    expect(dark.shellGroundFill).toMatch(
      /, linear-gradient\(180deg, hsl\(var\(--neutral-3\) \/ 0\.7\), transparent 70%\)$/,
    )
    expect(shared.shellGroundFill).toBeUndefined()
  })

  it("makes cards thin glass through tokens the kit's fallback resets", () => {
    expect(light.surfaceFillAlpha).toBe("0.72")
    expect(dark.surfaceFillAlpha).toBe("0.7")
    expect(light.surfaceBackdrop).toBe(
      "var(--glass-backdrop-off, blur(var(--glass-blur)) saturate(140%))",
    )
    expect(dark.surfaceBackdrop).toBe(
      "var(--glass-backdrop-off, blur(var(--glass-blur)))",
    )
    const translucency = written(duskHaze.tokens).filter((token) =>
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
    expect(shared.chromeFlatFill).toBeUndefined()
    for (const tokens of [light, dark]) {
      const [, factor, offset] =
        /^hsl\(var\(--card\) \/ calc\(var\(--surface-alpha\) \* ([\d.]+) - ([\d.]+)\)\)$/.exec(
          tokens.chromeFlatFill ?? "",
        ) ?? []
      expect(Number(factor) - Number(offset)).toBeCloseTo(1)
      const cards = Number(tokens.surfaceFillAlpha)
      const rail = cards * Number(factor) - Number(offset)
      expect(rail).toBeGreaterThan(0.5)
      expect(rail).toBeLessThan(cards)
    }
  })

  it("draws flat capsule buttons and sets the type light", () => {
    for (const token of [
      "buttonEdge",
      "buttonShadow",
      "buttonNeutralEdge",
      "buttonNeutralShadow",
    ] as const) {
      expect(shared[token], token).toBe("0 0 transparent")
      expect(light[token], token).toBeUndefined()
      expect(dark[token], token).toBeUndefined()
    }
    expect(shared).toMatchObject({
      buttonWeight: "400",
      uiWeight: "380",
      pageTitleWeight: "380",
      sectionTitleWeight: "450",
      dialogTitleWeight: "450",
      figureWeight: "360",
    })
  })

  // The pill radius axis sets --radius to 16px; panes and boxes scale down
  // from it.
  it("keeps panes and boxes at modest radii under the pill axis", () => {
    expect(shared).toMatchObject({
      cardRadius: "calc(var(--radius) * 0.75)",
      overlayRadius: "calc(var(--radius) * 0.75)",
      dialogRadius: "var(--radius)",
      bannerRadius: "calc(var(--radius) * 0.75)",
      badgeRadius: "calc(var(--radius) * 0.25)",
      checkRadius: "calc(var(--radius) * 0.25)",
      navItemRadius: "calc(var(--radius) * 0.5)",
    })
  })
})
