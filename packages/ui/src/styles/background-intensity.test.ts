import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { BACKGROUND_INTENSITIES } from "@theme/types"

// jsdom never parses CSS, so the rules themselves are what this asserts. The
// axis drives two mechanisms: a canvas saturation cap in the token engine
// (covered in generateTokens.test.ts) and this blob scale, which only matters
// under `background-style: gradient`.
const css = readFileSync("src/styles/theme.css", "utf8").replace(/\s+/g, " ")

describe("background intensity blob scale", () => {
  it("declares a blob scale for every step", () => {
    for (const step of BACKGROUND_INTENSITIES) {
      expect(css).toMatch(
        new RegExp(
          `\\[data-background-intensity="${step}"\\] \\{ --canvas-blob-scale:`,
        ),
      )
    }
  })

  it("keeps neutral faint rather than absent", () => {
    // 0 would make gradient identical to solid at the lowest step and strand
    // the backgroundStyle control, so neutral removes the tint but leaves the
    // blobs faintly visible.
    expect(css).toMatch(
      /\[data-background-intensity="neutral"\] \{ --canvas-blob-scale: 0\.25/,
    )
  })
})
