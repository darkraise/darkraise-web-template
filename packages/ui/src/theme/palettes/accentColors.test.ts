import { describe, it, expect } from "vitest"
import { accentColors } from "@theme/palettes/accentColors"
import { ACCENT_COLORS } from "@theme/types"

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

function lightness(hsl: string): number {
  return parseFloat(hsl.split(" ")[2] ?? "0")
}

function hue(hsl: string): number {
  return parseFloat(hsl.split(" ")[0] ?? "0")
}

describe("accent ramps", () => {
  it("registers a scale for every name in ACCENT_COLORS", () => {
    const missing = ACCENT_COLORS.filter((name) => !accentColors[name])
    expect(missing).toEqual([])
  })

  it("offers coral", () => {
    expect((ACCENT_COLORS as readonly string[])).toContain("coral")
  })

  it("pins coral's mid-tone to the brand value", () => {
    expect(accentColors.coral[500]).toBe("12 75% 59%")
  })

  it("orders coral between red and orange", () => {
    // The swatch grid renders ACCENT_COLORS in order and reads as a hue wheel.
    // Coral is hue 12; red is 0 and orange is 25.
    const names = ACCENT_COLORS as readonly string[]
    expect(names.indexOf("coral")).toBe(names.indexOf("red") + 1)
    expect(names.indexOf("orange")).toBe(names.indexOf("coral") + 1)
  })

  it.each(ACCENT_COLORS)("gives %s all eleven well-formed stops", (name) => {
    for (const step of STEPS) {
      expect(accentColors[name][step], `${name}[${step}]`).toMatch(
        /^\d+(\.\d+)? \d+(\.\d+)?% \d+(\.\d+)?%$/,
      )
    }
  })

  it.each(ACCENT_COLORS)("keeps %s's lightness monotonic", (name) => {
    // A reversed stop is invisible in a swatch grid but produces a fill darker
    // than its own base at exactly one intensity.
    const ls = STEPS.map((step) => lightness(accentColors[name][step]))
    for (let i = 1; i < ls.length; i++) {
      expect(ls[i], `${name} step ${STEPS[i]} vs ${STEPS[i - 1]}`).toBeLessThan(
        ls[i - 1] as number,
      )
    }
  })

  it("keeps coral's hue between red's and orange's at every stop", () => {
    for (const step of STEPS) {
      const h = hue(accentColors.coral[step])
      expect(h, `coral[${step}]`).toBeGreaterThan(hue(accentColors.red[step]))
      expect(h, `coral[${step}]`).toBeLessThan(hue(accentColors.orange[step]))
    }
  })
})
