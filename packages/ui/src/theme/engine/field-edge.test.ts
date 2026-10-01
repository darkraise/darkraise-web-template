import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { contrastRatio } from "@theme/engine/oklch"
import { applyBorderIntensity } from "@theme/engine/generateTokens"
import { BORDER_INTENSITIES } from "@theme/types"
import {
  comboName,
  finalTokens,
  isOpaque,
  reachableCombos,
} from "../../test/contrast-matrix"

// Every ground a field, checkbox, radio or switch can sit on. The edge is
// one value per theme, so it has to hold against all of them at once.
const GROUNDS = [
  "--background",
  "--card",
  "--surface-sunken",
  "--control-well-deep",
  "--surface-sidebar",
  "--surface-header",
] as const

describe("--field-edge-color", () => {
  it("clears 3:1 on every ground at every border intensity, and never moves", () => {
    const failures: string[] = []
    for (const combo of reachableCombos()) {
      const base = finalTokens(combo)
      const edge = base["--field-edge-color"]
      if (!isOpaque(edge)) {
        failures.push(`${comboName(combo)}: edge ${String(edge)} is not an opaque triplet`)
        continue
      }
      for (const step of BORDER_INTENSITIES) {
        const tokens = applyBorderIntensity(base, step)
        if (tokens["--field-edge-color"] !== edge) {
          failures.push(`${comboName(combo)} ${step}: edge moved`)
        }
        for (const ground of GROUNDS) {
          const value = tokens[ground]
          if (!isOpaque(value)) {
            failures.push(`${comboName(combo)} ${step}: ${ground} is not opaque`)
            continue
          }
          const ratio = contrastRatio(edge, value)
          if (ratio < 3) {
            failures.push(
              `${comboName(combo)} ${step}: ${ratio.toFixed(2)} on ${ground}`,
            )
          }
        }
      }
    }
    expect(failures).toEqual([])
  })
})

describe("--field-edge", () => {
  it("wraps the engine triplet for the field family", () => {
    const theme = readFileSync("src/styles/theme.css", "utf8")
    expect(theme).toMatch(/--field-edge:\s*hsl\(var\(--field-edge-color\)\);/)
  })
})
