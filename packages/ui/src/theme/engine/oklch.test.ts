import { describe, it, expect } from "vitest"
import {
  contrastRatio,
  hslStringToOklch,
  oklchToHslString,
  relativeLuminance,
} from "./oklch"
import { accentColors } from "@theme/palettes/accentColors"
import { ACCENT_COLORS } from "@theme/types"

describe("oklch", () => {
  it("round-trips every accent shade within one HSL unit per channel", () => {
    for (const name of ACCENT_COLORS) {
      const original = accentColors[name][500]
      const result = oklchToHslString(hslStringToOklch(original))

      const parse = (s: string) => s.split(" ").map((p) => parseFloat(p))
      const [ho, so, lo] = parse(original)
      const [hr, sr, lr] = parse(result)

      // Hue wraps at 360, so compare on the circle.
      const hueDelta = Math.min(
        Math.abs((ho as number) - (hr as number)),
        360 - Math.abs((ho as number) - (hr as number)),
      )
      expect(hueDelta, `${name} hue`).toBeLessThanOrEqual(1)
      expect(
        Math.abs((so as number) - (sr as number)),
        `${name} sat`,
      ).toBeLessThanOrEqual(1)
      expect(
        Math.abs((lo as number) - (lr as number)),
        `${name} light`,
      ).toBeLessThanOrEqual(1)
    }
  })

  it("preserves requested lightness through the round trip", () => {
    // Regression guard: omitting the gamma encode on the OKLCH-to-sRGB path
    // produces silently-too-dark output (L lands near 0.42 for a 0.55
    // request) while every other assertion still passes.
    for (const name of ACCENT_COLORS) {
      const { h } = hslStringToOklch(accentColors[name][500])
      const encoded = oklchToHslString({ L: 0.55, C: 0.19, h })
      // The tolerance is set by the token format, not by the math. These
      // strings are stored as integer HSL like every other token here, and one
      // percent of HSL lightness is worth up to 0.008 in OKLCH L near the
      // gamut cusps (yellow is the worst at 0.0082). The gamma-encode bug this
      // guards against lands about 0.13 away, so 0.02 still catches it with
      // room to spare.
      expect(
        Math.abs(hslStringToOklch(encoded).L - 0.55),
        name,
      ).toBeLessThanOrEqual(0.02)
    }
  })

  it("fits an out-of-gamut request by reducing chroma, not lightness", () => {
    const { h } = hslStringToOklch(accentColors.blue[500])
    const encoded = oklchToHslString({ L: 0.55, C: 0.5, h })
    const fitted = hslStringToOklch(encoded)

    expect(Math.abs(fitted.L - 0.55)).toBeLessThanOrEqual(0.02)
    expect(fitted.C).toBeLessThan(0.5)
  })

  it("clamps chroma at the requested maximum when already in gamut", () => {
    const { h } = hslStringToOklch(accentColors.blue[500])
    const fitted = hslStringToOklch(oklchToHslString({ L: 0.55, C: 0.1, h }))

    expect(fitted.C).toBeCloseTo(0.1, 2)
  })

  it("computes relative luminance for the achromatic endpoints", () => {
    expect(relativeLuminance("0 0% 100%")).toBeCloseTo(1, 5)
    expect(relativeLuminance("0 0% 0%")).toBeCloseTo(0, 5)
  })

  it("computes WCAG contrast ratios", () => {
    expect(contrastRatio("0 0% 100%", "0 0% 0%")).toBeCloseTo(21, 1)
    expect(contrastRatio("0 0% 0%", "0 0% 100%")).toBeCloseTo(21, 1)
    expect(contrastRatio("0 0% 50%", "0 0% 50%")).toBeCloseTo(1, 5)
  })
})
