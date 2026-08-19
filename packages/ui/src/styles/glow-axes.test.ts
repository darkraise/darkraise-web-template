import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { GLOW_LEVELS } from "@theme/types"

// jsdom never parses CSS, so the rules themselves are what this asserts.
//
// The Default preset consumes two composed tokens rather than a per-component
// recipe. Glass and Sci-fi drive their own multi-layer glow from the same axis
// steps instead, because a single composed layer cannot express a three-layer
// directional halo — see the preset re-expression in glow-baseline.test.ts.
const theme = readFileSync("src/styles/theme.css", "utf8").replace(/\s+/g, " ")
const card = readFileSync("src/components/card/card.css", "utf8").replace(
  /\s+/g,
  " ",
)

describe("glow axes — composed tokens", () => {
  it("defaults the hue to the surface tint", () => {
    expect(theme).toMatch(/--glow-hue: var\(--surface-tint\)/)
  })

  it("resolves to a no-op shadow at rest", () => {
    // `none` is the axis default, so the tokens must exist and paint nothing —
    // the `none` keyword is invalid as a shadow-list item and would invalidate
    // every declaration composing them.
    expect(theme).toMatch(/--glow-outer: 0 0 transparent/)
    expect(theme).toMatch(/--glow-inner: 0 0 transparent/)
  })

  it("ramps every step above none", () => {
    for (const step of GLOW_LEVELS.filter((s) => s !== "none")) {
      expect(theme, `outer ${step}`).toMatch(
        new RegExp(`\\[data-outer-glow="${step}"\\] \\{ --glow-outer:`),
      )
      expect(theme, `inner ${step}`).toMatch(
        new RegExp(`\\[data-inner-glow="${step}"\\] \\{ --glow-inner:`),
      )
    }
  })

  it("marks the inner ramp inset and the outer ramp not", () => {
    expect(theme).toMatch(
      /\[data-inner-glow="balanced"\] \{ --glow-inner: inset 0 0 20px/,
    )
    expect(theme).toMatch(
      /\[data-outer-glow="balanced"\] \{ --glow-outer: 0 0 20px/,
    )
  })
})

describe("glow axes — adoption", () => {
  it("reaches the modal tier through its shared utility", () => {
    expect(theme).toMatch(
      /@utility modal-surface \{ box-shadow: var\(--elevation-high\), var\(--inset-hi-strong\), var\(--glow-outer\), var\(--glow-inner\); \}/,
    )
  })

  it("reaches the overlay tier through its shared token", () => {
    expect(theme).toMatch(
      /--surface-overlay-shadow: var\(--shadow-dropdown\), var\(--glow-outer\), var\(--glow-inner\)/,
    )
  })

  it("reaches every card elevation, including flat", () => {
    // flat hard-zeroes its drop shadow, but the glow is a separate effect and
    // must survive there — otherwise the axis silently does nothing on the
    // elevation most likely to be paired with it.
    for (const level of ["auto", "flat", "low", "medium", "high"]) {
      expect(card, level).toMatch(
        new RegExp(
          `\\.dr-card\\[data-elevation="${level}"\\] \\{ box-shadow:[^;]*var\\(--glow-outer\\), var\\(--glow-inner\\)`,
        ),
      )
    }
  })

  it("switches an accent-bordered card onto the brand hue", () => {
    expect(card).toMatch(
      /\.dr-card\[data-border="accent"\] \{[^}]*--glow-hue: var\(--primary\)/,
    )
  })
})
