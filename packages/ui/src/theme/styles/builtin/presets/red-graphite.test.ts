import { describe, expect, it } from "vitest"
import { resolveRegistry } from "@theme/config/registry"
import type { PaintToken } from "@theme/config/tokens"
import { quiet } from "../quiet"
import { redGraphite } from "./red-graphite"

/** The layers of a box-shadow value. */
function layers(value: string): string[] {
  return value
    .split(/,(?![^(]*\))/)
    .map((layer) => layer.trim())
    .filter((layer) => layer !== "")
}

describe("Red Graphite", () => {
  const registry = resolveRegistry()
  const preset = registry.presets["red-graphite"]
  const shared = redGraphite.tokens?.shared ?? {}
  const light = redGraphite.tokens?.light ?? {}
  const dark = redGraphite.tokens?.dark ?? {}

  it("resolves as a Quiet preset with no issue", () => {
    expect(registry.issues).toEqual([])
    expect(preset).toMatchObject({ style: "quiet", builtIn: true })
  })

  it("sets a graphite rail beside a page-tone bar and marks with stripes", () => {
    expect(redGraphite.signatures).toEqual({
      navSelection: "pill",
      navMarker: "none",
      railTone: "inverse",
      barTone: "page",
      tooltipTone: "inverse",
      labelCase: "none",
      bannerMark: "rule",
      badgeStyle: "chip",
      fieldBorder: "none",
      rowSelection: "stripe",
      dialogHeader: "plain",
      avatarShape: "round",
    })
    expect(registry.signaturesFor("quiet", "red-graphite")).toMatchObject(
      redGraphite.signatures ?? {},
    )
  })

  it("writes a signature only where it differs from Quiet", () => {
    const base = registry.signaturesFor("quiet", "base")
    for (const [key, value] of Object.entries(redGraphite.signatures ?? {})) {
      expect(value, key).not.toBe(base[key as keyof typeof base])
    }
  })

  it("sets its palette and its faces, and no other axis", () => {
    expect(redGraphite.axes).toEqual({
      accentColor: "red",
      surfaceColor: "zinc",
      tintWithAccent: "off",
      signalColor: "none",
      font: "geist",
      headingFont: "body",
    })
    expect(redGraphite.shellStyle).toBeUndefined()
  })

  it("puts the banner's status rule on a neutral fill", () => {
    expect(shared.bannerFill).toBe("hsl(var(--muted))")
    expect(shared.bannerBorder).toBeUndefined()
  })

  it("clears the neutral button in light, where the rail's ink is light", () => {
    expect(light.buttonNeutralFill).toBe("transparent")
    expect(shared.buttonNeutralFill).toBeUndefined()
    expect(dark.buttonNeutralFill).toBeUndefined()
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

  it("casts menus and dialogs on one black shadow, stronger in dark", () => {
    for (const token of ["dropdownShadow", "modalShadow"] as const) {
      const strength = (value: string | undefined) => {
        const cast = layers(value ?? "").filter(
          (layer) => !layer.includes("--quiet-"),
        )
        expect(cast, token).toHaveLength(1)
        const alpha = /rgb\(0 0 0 \/ ([\d.]+)\)$/.exec(cast[0] ?? "")
        expect(alpha, `${token}: ${cast[0]}`).not.toBeNull()
        return Number(alpha?.[1])
      }
      expect(strength(dark[token]), token).toBeGreaterThan(
        strength(light[token]),
      )
    }
    expect(light.modalShadow).toContain("0 0 0 1px var(--quiet-ring)")
    expect(dark.modalShadow).toContain("0 0 0 1px var(--quiet-ring)")
  })

  it("rounds chips fully and cards a step past the controls", () => {
    expect(shared).toMatchObject({
      cardRadius: "calc(var(--radius) + 2px)",
      badgeRadius: "calc(var(--radius-control) * 2)",
      bannerRadius: "calc(var(--radius) - 2px)",
    })
  })

  it("sets titles and figures bold", () => {
    expect(shared).toMatchObject({
      pageTitleWeight: "700",
      sectionTitleWeight: "700",
      dialogTitleWeight: "700",
      figureWeight: "700",
    })
  })
})
