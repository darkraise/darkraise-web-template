import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

// Form controls are deliberately outside the surface-intensity axis: fields
// should hold still while panels move around them. They therefore must not
// paint through `bg-card`, whose --color-card now carries the wash.
//
// The pinned fill reads `--control-surface`, which is container-relative:
// `--card` on the page canvas, `--surface-sunken` inside a card. Both are
// raw token triplets, so the wash still cannot reach a field.
const CONTROLS = [
  "components/input/input.css",
  "components/textarea/textarea.css",
  "components/number-input/number-input.css",
  "components/tags-input/tags-input.css",
  "components/select/select.css",
]

describe("form control fills", () => {
  it.each(CONTROLS)("%s does not paint through bg-card", (file) => {
    const css = readFileSync(`src/${file}`, "utf8").replace(
      /\/\*[\s\S]*?\*\//g,
      "",
    )
    expect(css).not.toMatch(/@apply[^;]*\bbg-card\b/)
  })

  it.each(CONTROLS)("%s pins an unwashed fill", (file) => {
    const css = readFileSync(`src/${file}`, "utf8").replace(/\s+/g, " ")
    expect(css).toContain(
      "hsl(var(--control-surface) / var(--surface-opacity, 1))",
    )
  })
})

describe("--control-surface rungs", () => {
  const read = (file: string) =>
    readFileSync(`src/${file}`, "utf8").replace(/\s+/g, " ")

  it("defaults to the card rung so canvas-level fields stay legible", () => {
    expect(read("styles/theme.css")).toContain("--control-surface: var(--card)")
  })

  it("recesses to the sunken rung inside a card", () => {
    expect(read("components/card/card.css")).toContain(
      "--control-surface: var(--surface-sunken)",
    )
  })
})
