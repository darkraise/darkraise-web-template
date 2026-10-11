import { describe, expect, it } from "vitest"
import { AXES } from "../../axes/registry"
import { resolveRegistry } from "../../config/registry"
import { PAINT_TOKENS, type PaintToken } from "../../config/tokens"
import { flat } from "./flat"

const SHADOW_TOKENS = (Object.keys(PAINT_TOKENS) as PaintToken[]).filter(
  (token) => /Shadow|Edge|Rim|Glow/.test(token),
)

/** The blur radius of each layer of a box-shadow value. */
function blurs(value: string): number[] {
  return value.split(/,(?![^(]*\))/).map((layer) => {
    const lengths = layer
      .replace(/(rgb|hsl|color-mix|var)\([^)]*(\([^)]*\))*[^)]*\)/g, "")
      .trim()
      .split(/\s+/)
      .filter((part) => /^-?[\d.]+(px)?$/.test(part))
    return lengths.length >= 3 ? Number.parseFloat(lengths[2] ?? "0") : 0
  })
}

describe("Flat", () => {
  const registry = resolveRegistry()
  const style = registry.styles.flat

  it("resolves with no issue", () => {
    expect(registry.issues).toEqual([])
    expect(style?.builtIn).toBe(true)
  })

  it("leaves every brand axis to the app", () => {
    const brand = Object.keys(flat.defaults ?? {}).filter(
      (key) => AXES[key as keyof typeof AXES].layer === "brand",
    )
    expect(brand).toEqual([])
  })

  it("draws no blurred shadow in either mode", () => {
    for (const mode of ["shared", "light", "dark"] as const) {
      const tokens = flat.tokens?.[mode] ?? {}
      for (const token of SHADOW_TOKENS) {
        const value = tokens[token]
        if (value === undefined || value === "none") continue
        expect(blurs(value), `${mode} ${token}: ${value}`).toEqual(
          blurs(value).map(() => 0),
        )
      }
    }
  })

  it("rounds panels and status marks relative to the radius axis", () => {
    const radii = Object.entries(flat.tokens?.shared ?? {}).filter(([token]) =>
      token.endsWith("Radius"),
    )
    expect(radii.length).toBeGreaterThan(0)
    for (const [token, value] of radii) {
      expect(value, token).toMatch(/var\(--radius(-control)?\)/)
    }
  })

  // The overlay shadow composes the elevation lift and the glow axes around
  // the dropdown shadow, and the outline edge is the kit's 3:1 boundary.
  it("leaves the overlay shadow and the outline edge to the kit", () => {
    for (const mode of ["shared", "light", "dark"] as const) {
      expect(flat.tokens?.[mode]?.overlayShadow, mode).toBeUndefined()
      expect(flat.tokens?.[mode]?.buttonNeutralBorder, mode).toBeUndefined()
    }
  })

  it("marks menu rows solid and turns tooltips inverse", () => {
    expect(registry.signaturesFor("flat", "base")).toMatchObject({
      navSelection: "accent",
      menuHighlight: "solid",
      tooltipTone: "inverse",
      fieldBorder: "none",
      rowSelection: "accent",
    })
  })
})
