import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

const THEME = readFileSync("src/styles/theme.css", "utf8")
const INPUT = readFileSync("src/components/input/input.css", "utf8")

function block(selector: string): string {
  const start = THEME.indexOf(`\n${selector} {`)
  if (start < 0) throw new Error(`no top-level ${selector} block`)
  return THEME.slice(start, THEME.indexOf("\n}", start))
}

describe("colour scheme", () => {
  it("declares the scheme on each mode", () => {
    expect(block('[data-mode="light"]')).toContain("color-scheme: light;")
    expect(block('[data-mode="dark"]')).toContain("color-scheme: dark;")
  })

  it("leaves native indicators to the scheme", () => {
    expect(INPUT).not.toContain("dark:invert")
  })
})
