import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

const THEME = readFileSync("src/styles/theme.css", "utf8")

function block(selector: string): string {
  const start = THEME.indexOf(`\n${selector} {`)
  if (start < 0) throw new Error(`no top-level ${selector} block`)
  return THEME.slice(start, THEME.indexOf("\n}", start)).replace(/\s+/g, " ")
}

function value(body: string, name: string): string {
  const match = new RegExp(`${name}: ([^;]*);`).exec(body)
  if (!match?.[1]) throw new Error(`${name} not declared`)
  return match[1].trim()
}

const LEVELS = ["low", "medium", "high"] as const

describe("dark elevation lift", () => {
  it("is a no-op outside dark mode", () => {
    for (const level of LEVELS) {
      expect(THEME).toContain(`--elevation-lift-${level}: 0 0 transparent;`)
    }
  })

  it("lightens each dark level by its own step", () => {
    const dark = block('[data-mode="dark"]')
    for (const [level, edge, tint] of [
      ["low", "0.05", "0.025"],
      ["medium", "0.07", "0.05"],
      ["high", "0.09", "0.08"],
    ]) {
      expect(value(dark, `--elevation-lift-tint-${level}`)).toBe(
        `rgb(255 255 255 / ${tint})`,
      )
      expect(value(dark, `--elevation-lift-${level}`)).toBe(
        `inset 0 1px 0 rgb(255 255 255 / ${edge}), inset 0 0 0 100vmax var(--elevation-lift-tint-${level})`,
      )
    }
  })

  it("puts the lift first in every dark elevation token", () => {
    const dark = block('[data-mode="dark"]')
    const high = block('[data-mode="dark"][data-elevation="high"]')
    for (const level of LEVELS) {
      expect(value(dark, `--elevation-${level}`)).toMatch(
        new RegExp(`^var\\(--elevation-lift-${level}\\), `),
      )
      expect(value(dark, `--card-elevation-${level}`)).toMatch(
        new RegExp(`^var\\(--elevation-lift-${level}\\), `),
      )
      expect(value(high, `--elevation-${level}`)).toMatch(
        new RegExp(`^var\\(--elevation-lift-${level}\\), `),
      )
    }
  })

  it("lifts popups by the medium step", () => {
    expect(THEME.replace(/\s+/g, " ")).toContain(
      "--surface-overlay-shadow: var(--elevation-lift-medium), var(--shadow-dropdown), var(--glow-outer), var(--glow-inner);",
    )
  })
})
