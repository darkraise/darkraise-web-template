import { describe, expect, it } from "vitest"
import { resolveRegistry } from "@theme/config/registry"
import { linenTeal } from "./linen-teal"

/** The layers of a box-shadow value. */
function layers(value: string): string[] {
  return value
    .split(/,(?![^(]*\))/)
    .map((layer) => layer.trim())
    .filter((layer) => layer !== "")
}

describe("Linen & Teal", () => {
  const registry = resolveRegistry()
  const preset = registry.presets["linen-teal"]
  const shared = linenTeal.tokens?.shared ?? {}
  const dark = linenTeal.tokens?.dark ?? {}

  it("resolves as a Quiet preset with no issue", () => {
    expect(registry.issues).toEqual([])
    expect(preset).toMatchObject({ style: "quiet", builtIn: true })
  })

  it("marks the nav row with a neutral pill and sets labels as written", () => {
    expect(linenTeal.signatures).toEqual({
      navSelection: "pill",
      navMarker: "none",
      railTone: "page",
      barTone: "page",
      tooltipTone: "inverse",
      labelCase: "none",
      badgeStyle: "tint",
      fieldFill: "surface",
      dialogHeader: "plain",
      avatarShape: "round",
    })
    expect(registry.signaturesFor("quiet", "linen-teal")).toMatchObject(
      linenTeal.signatures ?? {},
    )
  })

  it("writes a signature only where it differs from Quiet", () => {
    const quiet = registry.signaturesFor("quiet", "base")
    for (const [key, value] of Object.entries(linenTeal.signatures ?? {})) {
      expect(value, key).not.toBe(quiet[key as keyof typeof quiet])
    }
  })

  it("sets its palette and its faces, and no other axis", () => {
    expect(linenTeal.axes).toEqual({
      accentColor: "cyan",
      surfaceColor: "neutral",
      tintWithAccent: "off",
      signalColor: "none",
      font: "geist",
      headingFont: "body",
    })
  })

  it("draws its greys as the text colour at a low strength", () => {
    expect(shared.chromeFlatFill).toBe(
      "color-mix(in oklab, hsl(var(--foreground)) 3.5%, hsl(var(--background)))",
    )
    expect(shared.cardBorder).toBe("hsl(var(--foreground) / 0.08)")
    expect(dark.cardBorder).toBe("hsl(var(--foreground) / 0.1)")
  })

  it("lifts cards, menus and dialogs on a shadow of the text colour, black in dark", () => {
    for (const token of [
      "cardEdge",
      "dropdownShadow",
      "modalShadow",
    ] as const) {
      const cast = layers(shared[token] ?? "").filter(
        (layer) => !layer.includes("--quiet-"),
      )
      expect(cast.length, `shared ${token}`).toBeGreaterThan(0)
      for (const layer of cast) {
        expect(layer, `shared ${token}`).toContain("hsl(var(--foreground) / ")
      }
      const night = layers(dark[token] ?? "").filter(
        (layer) => !layer.includes("--quiet-"),
      )
      expect(night.length, `dark ${token}`).toBe(cast.length)
      for (const layer of night) {
        expect(layer, `dark ${token}`).toContain("rgb(0 0 0 / ")
      }
    }
  })

  it("glows a focused field in the accent instead of ringing it", () => {
    for (const [mode, tokens] of [
      ["shared", shared],
      ["dark", dark],
    ] as const) {
      const ring = tokens.fieldFocusRing ?? ""
      expect(ring, mode).toMatch(/^0 0 24px 2px hsl\(var\(--primary\) \/ /)
      expect(layers(ring), mode).toHaveLength(1)
    }
    expect(shared.fieldFocusBorder).toBeUndefined()
    expect(dark.fieldFocusBorder).toBeUndefined()
  })

  it("washes the page behind a dialog in a page tone rather than in black", () => {
    expect(shared.scrim).toBe("hsl(var(--neutral-6) / 0.7)")
    expect(dark.scrim).toBe("hsl(var(--background) / 0.7)")
  })

  it("rounds panels one step past the controls, relative to the radius axis", () => {
    expect(shared).toMatchObject({
      cardRadius: "calc(var(--radius) + 0.25rem)",
      overlayRadius: "calc(var(--radius) + 0.25rem)",
      bannerRadius: "calc(var(--radius) + 0.25rem)",
      dialogRadius: "calc(var(--radius) + 0.5rem)",
    })
  })

  it("sets dark text and titles lighter than their light weights", () => {
    const weights = [
      "pageTitleWeight",
      "sectionTitleWeight",
      "dialogTitleWeight",
      "figureWeight",
    ] as const
    for (const token of weights) {
      expect(Number(dark[token]), token).toBeLessThan(Number(shared[token]))
    }
    expect(dark.uiWeight).toBe("360")
    expect(dark.buttonWeight).toBe("470")
    expect(shared.uiWeight).toBeUndefined()
    expect(shared.buttonWeight).toBeUndefined()
  })
})
