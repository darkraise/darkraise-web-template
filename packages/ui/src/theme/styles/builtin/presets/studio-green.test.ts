import { describe, expect, it } from "vitest"
import { layers } from "@test/preset-tokens"
import { resolveRegistry } from "@theme/config/registry"
import type { PaintToken } from "@theme/config/tokens"
import { quiet } from "../quiet"
import { studioGreen } from "./studio-green"

describe("Studio Green", () => {
  const registry = resolveRegistry()
  const preset = registry.presets["studio-green"]
  const shared = studioGreen.tokens?.shared ?? {}
  const light = studioGreen.tokens?.light ?? {}
  const dark = studioGreen.tokens?.dark ?? {}

  it("resolves as a Quiet preset with no issue", () => {
    expect(registry.issues).toEqual([])
    expect(preset).toMatchObject({ style: "quiet", builtIn: true })
  })

  it("sets the chrome on the page tone and banners on the card surface", () => {
    expect(studioGreen.signatures).toEqual({
      navSelection: "pill",
      navMarker: "none",
      railTone: "page",
      barTone: "page",
      bannerSurface: "card",
      fieldFill: "surface",
      dialogHeader: "plain",
      dialogFooter: "ruled",
      avatarShape: "round",
      buttonStyle: "soft",
      switchStyle: "track",
      checkStyle: "round",
      tabStyle: "underline",
      sliderStyle: "knob",
    })
    expect(registry.signaturesFor("quiet", "studio-green")).toMatchObject(
      studioGreen.signatures ?? {},
    )
  })

  it("writes a signature only where it differs from Quiet", () => {
    const base = registry.signaturesFor("quiet", "base")
    for (const [key, value] of Object.entries(studioGreen.signatures ?? {})) {
      expect(value, key).not.toBe(base[key as keyof typeof base])
    }
  })

  it("sets its palette and its faces, and no other axis", () => {
    expect(studioGreen.axes).toEqual({
      accentColor: "emerald",
      surfaceColor: "neutral",
      tintWithAccent: "off",
      signalColor: "none",
      font: "inter",
      headingFont: "geist",
    })
    expect(studioGreen.shellStyle).toBeUndefined()
  })

  it("draws the chrome rule and the card edge as the text colour at 8%", () => {
    expect(shared.chromeEdge).toBe("hsl(var(--foreground) / 0.08)")
    expect(shared.cardBorder).toBe("hsl(var(--foreground) / 0.08)")
  })

  it("sets a low top bar", () => {
    expect(shared.chromeBarHeight).toBe("3rem")
  })

  it("writes per mode every token Quiet gives a dark value", () => {
    const darkened = Object.keys(quiet.tokens?.dark ?? {}) as PaintToken[]
    expect(darkened).toContain("dropdownShadow")
    for (const token of darkened) {
      expect(shared[token], `shared ${token}`).toBeUndefined()
      expect(light[token] === undefined, `light and dark ${token}`).toBe(
        dark[token] === undefined,
      )
    }
  })

  it("casts buttons, menus and dialogs on black shadows in both modes", () => {
    for (const token of [
      "buttonShadow",
      "buttonDangerShadow",
      "buttonNeutralShadow",
      "dropdownShadow",
      "modalShadow",
    ] as const) {
      const cast = (value: string | undefined) =>
        layers(value ?? "").filter((layer) => !layer.includes("--quiet-"))
      expect(cast(light[token]).length, `light ${token}`).toBeGreaterThan(0)
      expect(cast(dark[token]), `dark ${token}`).toHaveLength(
        cast(light[token]).length,
      )
      for (const layer of [...cast(light[token]), ...cast(dark[token])]) {
        expect(layer, token).toMatch(/ rgb\(0 0 0 \/ [\d.]+\)$/)
      }
      expect(shared[token], `shared ${token}`).toBeUndefined()
    }
    expect(light.modalShadow).toContain("0 0 0 1px var(--quiet-ring)")
    expect(dark.modalShadow).toContain("0 0 0 1px var(--quiet-ring)")
  })

  it("rings a focused field in the accent at 2px in both modes", () => {
    expect(light.fieldFocusRing).toBe("0 0 0 2px hsl(var(--primary) / 0.55)")
    expect(dark.fieldFocusRing).toBe(light.fieldFocusRing)
  })

  it("gives the knob a shadow in light only", () => {
    expect(light.thumbShadow).toBe("0 1px 2px rgb(0 0 0 / 0.2)")
    expect(shared.thumbShadow).toBeUndefined()
    expect(dark.thumbShadow).toBeUndefined()
  })

  it("sets body text at 450 under tight titles at 600", () => {
    expect(shared).toMatchObject({
      uiWeight: "450",
      pageTitleWeight: "600",
      figureWeight: "600",
      pageTitleTracking: "-0.025em",
      sectionTitleTracking: "-0.025em",
      dialogTitleTracking: "-0.025em",
    })
  })
})
