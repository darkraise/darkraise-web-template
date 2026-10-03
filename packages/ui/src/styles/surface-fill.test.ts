import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

// jsdom never parses CSS, so the rules themselves are what this asserts.
// Every `surface` value must redeclare the whole fill family: a fill left out
// of one rule inherits the ancestor's value instead of the one the prop asked
// for.
const FAMILY = [
  "--surface-card-fill",
  "--surface-popover-fill",
  "--surface-raised-fill",
  "--surface-overlay-fill",
  "--surface-card-fill-opaque",
  "--surface-overlay-bg",
  "--overlay-bg",
]

const FILLS = [
  "--surface-card-fill",
  "--surface-popover-fill",
  "--surface-raised-fill",
  "--surface-overlay-fill",
]

const VALUES = ["card", "page", "muted", "none"] as const

function source(): string {
  return readFileSync("src/styles/theme.css", "utf8")
}

// Prettier wraps long declarations across lines, and where it wraps depends
// on indentation, so every assertion about source text is made against
// whitespace-collapsed input with no padding inside parentheses.
interface Rule {
  selector: string
  body: string
}

function rules(): Rule[] {
  const flat = source()
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
  return [...flat.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(
    ([, selector, body]) => {
      if (selector === undefined || body === undefined) {
        throw new Error("rule match is missing a group")
      }
      return { selector: selector.trim(), body: body.trim() }
    },
  )
}

function bodyOf(selector: string): string {
  const found = rules().find((r) => r.selector === selector)
  if (!found) throw new Error(`no rule with selector ${selector}`)
  return found.body
}

function fillRule(value: (typeof VALUES)[number]): string {
  return bodyOf(`[data-surface-fill="${value}"]`)
}

function decl(body: string, name: string): string {
  const afterName = body.split(`${name}:`)[1]
  if (afterName === undefined) throw new Error(`no ${name} declaration`)
  const value = afterName.split(";")[0]
  if (value === undefined) throw new Error(`no ${name} value`)
  return value.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").trim()
}

describe("surface fill rules", () => {
  it.each(VALUES.flatMap((value) => FAMILY.map((name) => [value, name])))(
    "%s declares %s",
    (value, name) => {
      expect(fillRule(value as (typeof VALUES)[number])).toContain(`${name}:`)
    },
  )

  it.each(FILLS)("card paints %s from its own plane", (fill) => {
    expect(decl(fillRule("card"), fill)).toBe(decl(bodyOf(":root"), fill))
  })

  it("card restores the overlay composition", () => {
    expect(decl(fillRule("card"), "--surface-overlay-bg")).toBe(
      "var(--surface-overlay-layers) var(--surface-overlay-base)",
    )
  })

  it.each([
    ["page", "--background"],
    ["muted", "--muted"],
  ] as const)("%s reads %s", (value, token) => {
    const body = fillRule(value)
    for (const fill of FILLS) {
      expect(decl(body, fill)).toBe(`hsl(var(${token}))`)
    }
    expect(decl(body, "--surface-card-fill-opaque")).toBe(`hsl(var(${token}))`)
    expect(decl(body, "--surface-overlay-bg")).toBe(
      `var(--surface-overlay-layers) hsl(var(${token}))`,
    )
  })

  it.each([...FILLS, "--surface-card-fill-opaque", "--surface-overlay-bg"])(
    "none blanks %s",
    (name) => {
      expect(decl(fillRule("none"), name)).toBe("transparent")
    },
  )

  // --surface-card-fill-opaque exists so the enclosed-tab indicator
  // (tabs.css) can follow the surface without going translucent: a
  // translucent fill cannot erase the baseline under it and the seam ghosts
  // through.
  it.each([":root", ...VALUES.map((v) => `[data-surface-fill="${v}"]`)])(
    "keeps every fill opaque in %s",
    (selector) => {
      for (const name of [...FILLS, "--surface-card-fill-opaque"]) {
        expect(decl(bodyOf(selector), name)).not.toContain(" / ")
      }
    },
  )

  // A custom property that reads another resolves where it is declared, so
  // --overlay-bg declared on :root alone would carry <html>'s overlay
  // background into every overlay that sets the prop.
  it.each([":root", ...VALUES.map((v) => `[data-surface-fill="${v}"]`)])(
    "redeclares --overlay-bg beside --surface-overlay-bg in %s",
    (selector) => {
      expect(decl(bodyOf(selector), "--overlay-bg")).toBe(
        "var(--surface-overlay-bg)",
      )
    },
  )

  it("routes the Tailwind colors through the fill variables", () => {
    const theme = source().replace(/\s+/g, " ")
    expect(theme).toContain("--color-card: var(--surface-card-fill)")
    expect(theme).toContain("--color-popover: var(--surface-popover-fill)")
    expect(theme).toContain(
      "--color-surface-raised: var(--surface-raised-fill)",
    )
    expect(theme).toContain(
      "--color-surface-overlay: var(--surface-overlay-fill)",
    )
  })

  it("leaves no trace of the surface-intensity wash", () => {
    expect(source()).not.toContain("[data-surface-intensity")
    expect(source()).not.toContain("--surface-wash")
  })
})
