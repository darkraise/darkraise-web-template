import { describe, expect, it } from "vitest"
import { resolveRegistry } from "../../config/registry"
import type { PaintToken } from "../../config/tokens"
import { glass, glassBackdrop } from "../builtin/glass"

/** A backdrop the Blur setting sizes and switches off: no fixed length. */
const SIZED =
  /^var\(--glass-backdrop-off, blur\((?:var\(--glass-(?:scrim-)?blur\)|calc\(var\(--glass-blur\) \* [\d.]+\))\)(?: [^)]+\)(?: [^)]+\))*)?\)$/

describe("glass backdrops", () => {
  it("builds a backdrop the Blur setting sizes and switches off", () => {
    expect(glassBackdrop()).toBe(
      "var(--glass-backdrop-off, blur(var(--glass-blur)))",
    )
    expect(glassBackdrop("saturate(110%)")).toBe(
      "var(--glass-backdrop-off, blur(var(--glass-blur)) saturate(110%))",
    )
    expect(
      glassBackdrop("saturate(115%)", "calc(var(--glass-blur) * 0.75)"),
    ).toBe(
      "var(--glass-backdrop-off, blur(calc(var(--glass-blur) * 0.75)) saturate(115%))",
    )
  })

  it("lets every built-in glass look's backdrop follow the Blur setting", () => {
    const registry = resolveRegistry()
    const looks = [
      ["glass", glass.tokens],
      ...Object.values(registry.presets)
        .filter(
          (preset) =>
            preset.builtIn &&
            registry.styles[preset.style]?.lineage.includes("glass"),
        )
        .map((preset) => [preset.name, preset.tokens] as const),
    ] as const
    const backdrops: string[] = []
    for (const [name, tokens] of looks) {
      for (const [mode, map] of Object.entries(tokens ?? {})) {
        for (const [token, value] of Object.entries(map ?? {})) {
          if (!(token as PaintToken).endsWith("Backdrop")) continue
          backdrops.push(`${name}.${mode}.${token}`)
          if (value === "none") continue
          expect(value, `${name}.${mode}.${token}`).toMatch(SIZED)
          expect(value, `${name}.${mode}.${token}`).not.toMatch(/\d+px/)
        }
      }
    }
    expect(backdrops).toContain("glass.shared.surfaceBackdrop")
  })

  // Glass's blur steps write sizes, not backdrops, so a preset may set any
  // backdrop under Glass.
  it("keys no Glass backdrop to an axis step", () => {
    expect(
      glass.when
        ?.flatMap((entry) => Object.keys(entry.tokens ?? {}))
        .filter((token) => token.endsWith("Backdrop")),
    ).toEqual([])
    expect(
      resolveRegistry({
        presets: {
          probe: {
            label: "Probe",
            style: "glass",
            tokens: {
              shared: {
                overlayBackdrop: "none",
                scrimBackdrop: "none",
              },
            },
          },
        },
      }).issues,
    ).toEqual([])
  })
})
