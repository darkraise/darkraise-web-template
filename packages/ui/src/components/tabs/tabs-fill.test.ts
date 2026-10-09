import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { stripCssComments } from "../../test/strip-css-comments"

// The enclosed-tab indicator must stay OPAQUE — a translucent fill cannot
// erase the baseline and the seam ghosts through (see tabs.css). It must
// still follow the `surface` prop, so it reads the opaque fill variable
// rather than either `bg-card` or a bare hsl(var(--card)).
describe("tabs enclosed fill", () => {
  const css = stripCssComments(
    readFileSync("src/components/tabs/tabs.css", "utf8"),
  ).replace(/\s+/g, " ")

  it("no longer reads the raw card token", () => {
    expect(css).not.toContain("hsl(var(--card))")
  })

  it("reads the opaque fill variable", () => {
    expect(css).toContain("var(--surface-card-fill-opaque)")
  })

  it("never routes through the opacity-bearing fill", () => {
    expect(css).not.toContain("var(--surface-card-fill)")
  })

  // An elevated dark card lifts its face with an overlay tint; the opaque
  // fill paints the same tint so the panel does not read as recessed.
  it("paints the card lift over every enclosed fill", () => {
    const fills = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(
      ([, , body]) =>
        body?.includes("background-color: var(--surface-card-fill-opaque);"),
    )
    expect(fills).toHaveLength(4)
    for (const [, selector, body] of fills) {
      expect(body, selector).toContain(
        "background-image: linear-gradient( var(--card-lift-tint, transparent), var(--card-lift-tint, transparent) );",
      )
    }
  })
})
