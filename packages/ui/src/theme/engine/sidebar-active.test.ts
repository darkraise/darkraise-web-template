import { describe, it, expect } from "vitest"
import { hslStringToOklch, mixedContrast } from "@theme/engine/oklch"
import {
  comboName,
  finalTokens,
  reachableCombos,
} from "../../test/contrast-matrix"

// The active sidebar row reads --sidebar-active-bg, one step above
// --sidebar-hover-bg on the same accent ramp, so hover and active differ by
// fill at every Accent Intensity step and the 3px bar can be opt-in.

/** `H S% L%` or `H S% L% / a` → the colour and the alpha it paints at. */
function split(value: string): [string, number] {
  const [colour, alpha] = value.split("/").map((part) => part.trim())
  return [colour as string, alpha === undefined ? 1 : parseFloat(alpha)]
}

/** OKLab distance: luminance alone ties where a pale hover sits above the ground. */
function distance(a: string, b: string): number {
  const lab = (hsl: string) => {
    const { L, C, h } = hslStringToOklch(hsl)
    const rad = (h * Math.PI) / 180
    return [L, C * Math.cos(rad), C * Math.sin(rad)]
  }
  const [la, aa, ba] = lab(a) as [number, number, number]
  const [lb, ab, bb] = lab(b) as [number, number, number]
  return Math.hypot(la - lb, aa - ab, ba - bb)
}

describe("--sidebar-active-bg", () => {
  it("is one step stronger than the hover fill and keeps the hover text at 4.5:1", () => {
    const failures: string[] = []
    for (const combo of reachableCombos()) {
      const tokens = finalTokens(combo)
      const name = comboName(combo)
      const active = tokens["--sidebar-active-bg"]
      const hover = tokens["--sidebar-hover-bg"]
      const ground = tokens["--surface-sidebar"] as string
      const text = tokens["--sidebar-foreground-hover"] as string
      if (!active || !hover) {
        failures.push(`${name}: active ${String(active)}`)
        continue
      }
      const [activeColour, activeAlpha] = split(active)
      const [hoverColour, hoverAlpha] = split(hover)
      if (combo.mode === "dark") {
        // Same shade, more alpha: the composite moves further from the ground.
        if (activeColour !== hoverColour || activeAlpha <= hoverAlpha) {
          failures.push(`${name}: ${active} is not above ${hover}`)
        }
      } else if (
        activeAlpha !== 1 ||
        distance(activeColour, ground) <= distance(hoverColour, ground)
      ) {
        failures.push(`${name}: ${active} is not further than ${hover}`)
      }
      const ratio = mixedContrast(text, ground, activeColour, activeAlpha)
      if (ratio < 4.5) {
        failures.push(`${name}: hover text ${ratio.toFixed(2)} on active`)
      }
    }
    expect(failures).toEqual([])
  })
})
