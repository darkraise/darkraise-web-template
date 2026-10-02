import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"

const css = readFileSync("src/components/menubar/menubar.css", "utf8")

function applyLine(selector: string): string {
  const start = css.indexOf(`${selector} {`)
  expect(start, selector).toBeGreaterThan(-1)
  const body = css.slice(start, css.indexOf("}", start))
  const line = body.split("\n").find((l) => l.includes("@apply"))
  expect(line, `${selector} has an @apply line`).toBeDefined()
  return line as string
}

describe("menubar overlays animate out", () => {
  it.each([".dr-menubar-content", ".dr-menubar-sub-content"])(
    "%s plays the closed-state exit animation",
    (selector) => {
      expect(applyLine(selector)).toContain("data-[state=closed]:animate-out")
    },
  )
})
