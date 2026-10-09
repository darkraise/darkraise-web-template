import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { stripCssComments } from "../test/strip-css-comments"

// Progress and slider tracks share one thickness, so a form that shows both
// draws them alike.

function bodyOf(file: string, selector: string): string {
  const css = stripCssComments(
    readFileSync(`src/components/${file}`, "utf8"),
  ).replace(/\s+/g, " ")
  const rule = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
    (m) => (m[1] as string).trim() === selector,
  )
  if (!rule) throw new Error(`no rule ${selector} in ${file}`)
  return rule[2] as string
}

describe("track height", () => {
  it("declares --track-height", () => {
    const theme = readFileSync("src/styles/theme.css", "utf8")
    expect(theme).toMatch(/--track-height:\s*0\.5rem;/)
  })

  it.each([
    ["progress/progress.css", ".dr-progress"],
    ["slider/slider.css", ".dr-slider-track"],
  ])("%s %s reads --track-height", (file, selector) => {
    const body = bodyOf(file, selector)
    expect(body).toContain("h-[var(--track-height)]")
    expect(body).not.toMatch(/(?<![\w:[-])h-\d/)
  })
})
