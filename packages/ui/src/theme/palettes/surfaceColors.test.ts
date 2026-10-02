import { describe, it, expect } from "vitest"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import { SURFACE_COLORS } from "@theme/types"

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

describe("surface ramps", () => {
  it("offers exactly the twelve registered neutral ramps as surfaces", () => {
    expect([...SURFACE_COLORS]).toEqual(Object.keys(surfaceColors))
    expect(SURFACE_COLORS).toHaveLength(12)
  })

  it("gives every registered ramp all eleven stops", () => {
    for (const [name, scale] of Object.entries(surfaceColors)) {
      for (const step of STEPS) {
        expect(scale[step], `${name}[${step}]`).toMatch(
          /^\d+(\.\d+)? \d+(\.\d+)?% \d+(\.\d+)?%$/,
        )
      }
    }
  })
})
