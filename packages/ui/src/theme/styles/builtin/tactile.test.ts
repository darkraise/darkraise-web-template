import { describe, expect, it } from "vitest"
import { AXES } from "../../axes/registry"
import { resolveRegistry } from "../../config/registry"
import { tactile } from "./tactile"

/** A white sheen or a black scrim reads the same over either mode's fills. */
const MODE_NEUTRAL = ["buttonSheen", "scrim"]

/** Where a linear gradient's first colour stop sits, as written. */
function firstStop(gradient: string): string {
  const inner = /^linear-gradient\((.*)\)$/.exec(gradient)?.[1]
  if (inner === undefined) throw new Error(`not a linear gradient: ${gradient}`)
  const [first = ""] = inner.split(/,(?![^(]*\))/).slice(1)
  return first.trim().replace(/^\S+\s+/, "")
}

describe("Tactile", () => {
  const registry = resolveRegistry()

  it("resolves with no issue", () => {
    expect(registry.issues).toEqual([])
    expect(registry.styles.tactile?.builtIn).toBe(true)
  })

  it("leaves every brand axis to the app", () => {
    const brand = Object.keys(tactile.defaults ?? {}).filter(
      (key) => AXES[key as keyof typeof AXES].layer === "brand",
    )
    expect(brand).toEqual([])
  })

  it("draws a dark bar over a raised sheet for the current nav item", () => {
    expect(registry.signaturesFor("tactile", "base")).toMatchObject({
      navSelection: "chip",
      barTone: "inverse",
      barSpan: "full",
      fieldFill: "surface",
    })
  })

  // The light values sit in a layer above @layer base, so a literal black or
  // white one would reach dark mode unless the dark block restates it.
  it("restates in dark every literal-colour value it sets for light", () => {
    const literal = (values: Readonly<Record<string, string>>) =>
      Object.entries(values)
        .filter(
          ([name, value]) =>
            /rgb\(/.test(value) &&
            value !== "0 0 transparent" &&
            !MODE_NEUTRAL.includes(name),
        )
        .map(([name]) => name)
    const tokens = literal(tactile.tokens?.shared ?? {})
    const vars = literal(tactile.vars?.shared ?? {})
    expect(tokens.length).toBeGreaterThan(0)
    expect(vars.length).toBeGreaterThan(0)
    const dark = [
      ...Object.keys(tactile.tokens?.dark ?? {}),
      ...Object.keys(tactile.vars?.dark ?? {}),
    ]
    expect([...tokens, ...vars].filter((name) => !dark.includes(name))).toEqual(
      [],
    )
  })

  it("draws the four-line bevel on every raised surface", () => {
    for (const mode of ["shared", "dark"] as const) {
      const bevel = tactile.vars?.[mode]?.["--tactile-bevel"]
      expect(bevel?.match(/inset/g), mode).toHaveLength(4)
    }
    const shared = tactile.tokens?.shared ?? {}
    for (const token of [
      "cardEdge",
      "dropdownShadow",
      "modalShadow",
      "navSelectionShadow",
    ] as const) {
      expect(shared[token], token).toContain("var(--tactile-bevel)")
    }
  })

  // The overlay shadow composes the elevation lift and the glow axes around
  // the dropdown shadow, and the outline edge is the kit's 3:1 boundary.
  it("leaves the overlay shadow and the outline edge to the kit", () => {
    for (const mode of ["shared", "light", "dark"] as const) {
      expect(tactile.tokens?.[mode]?.overlayShadow, mode).toBeUndefined()
      expect(tactile.tokens?.[mode]?.buttonNeutralBorder, mode).toBeUndefined()
    }
  })

  // Engine fills sit at their label's 4.5:1 floor, so a sheen that lightens
  // behind a light label stays below the glyphs' descenders: the bottom
  // quarter of the key.
  it("keeps the filled key's sheen below its label", () => {
    for (const mode of ["shared", "dark"] as const) {
      const sheens = Object.entries(tactile.tokens?.[mode] ?? {}).filter(
        ([name, value]) => name.endsWith("Sheen") && value !== "none",
      )
      expect(
        sheens.map(([name]) => name),
        mode,
      ).toEqual(mode === "shared" ? ["buttonSheen"] : [])
      for (const [name, value] of sheens) {
        // 75% of the face, or the foot of the label's line box where that
        // is lower (a 32px or smaller face).
        expect(firstStop(value), name).toBe("max(75%, 50% + 0.5lh)")
      }
    }
  })
})
