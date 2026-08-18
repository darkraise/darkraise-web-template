import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

// The enclosed-tab indicator must stay OPAQUE — a translucent fill cannot
// erase the baseline and the seam ghosts through (see tabs.css). It must
// still respond to the surface-intensity axis, so it reads the opaque fill
// variable rather than either `bg-card` or a bare hsl(var(--card)).
describe("tabs enclosed fill", () => {
  const css = readFileSync("src/components/tabs/tabs.css", "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")

  it("no longer reads the raw card token", () => {
    expect(css).not.toContain("hsl(var(--card))")
  })

  it("reads the opaque fill variable", () => {
    expect(css).toContain("var(--surface-card-fill-opaque)")
  })

  it("never routes through the opacity-bearing fill", () => {
    expect(css).not.toContain("var(--surface-card-fill)")
  })
})
