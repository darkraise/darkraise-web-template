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
    expect(value(dark, "--elevation-lift-low")).toBe(
      "inset 0 1px 0 rgb(255 255 255 / 0.05), inset 0 0 0 100vmax rgb(255 255 255 / 0.025)",
    )
    expect(value(dark, "--elevation-lift-medium")).toBe(
      "inset 0 1px 0 rgb(255 255 255 / 0.07), inset 0 0 0 100vmax rgb(255 255 255 / 0.05)",
    )
    expect(value(dark, "--elevation-lift-high")).toBe(
      "inset 0 1px 0 rgb(255 255 255 / 0.09), inset 0 0 0 100vmax rgb(255 255 255 / 0.08)",
    )
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
