import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

// Form controls are deliberately outside the surface-intensity axis: fields
// should hold still while panels move around them. They therefore must not
// paint through `bg-card`, whose --color-card now carries the wash.
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
    expect(css).toContain("hsl(var(--card) / var(--surface-opacity, 1))")
  })
})
