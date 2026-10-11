import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { cssRules } from "../../test/css-rules"
import { stripCssComments } from "../../test/strip-css-comments"

// Figures, body text, table heads, selected rows and avatars read style
// tokens and signatures. jsdom computes no cascade, so the source rules are
// what this asserts; the effective values are checked in Chromium by the
// template's e2e suite.

const DIR = join("src", "components")
const TABLE = join(DIR, "table", "table.css")
const STAT = join(DIR, "stat", "stat.css")
const AVATAR = join(DIR, "avatar", "avatar.css")
const THEME = join("src", "styles", "theme.css")

interface Rule {
  selectors: string[]
  wrappers: string[]
  body: string
}

function normalise(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
}

function rulesOf(path: string): Rule[] {
  return cssRules(stripCssComments(readFileSync(path, "utf8"))).map((rule) => ({
    selectors: rule.selector
      .split(/,(?![^(]*\))/)
      .map(normalise)
      .filter(Boolean),
    wrappers: rule.wrappers,
    body: normalise(rule.body),
  }))
}

/** Every body of a rule whose selector list holds `selector`, joined. */
function bodyOf(path: string, selector: string, wrappers?: string[]): string {
  const bodies = rulesOf(path)
    .filter((rule) => rule.selectors.includes(selector))
    .filter(
      (rule) =>
        wrappers === undefined ||
        rule.wrappers.join(" > ") === wrappers.join(" > "),
    )
    .map((rule) => rule.body)
  if (bodies.length === 0) throw new Error(`no rule ${selector} in ${path}`)
  return bodies.join(" ")
}

describe("figure and body weights", () => {
  it("declares --figure-weight on the layered :root", () => {
    expect(bodyOf(STAT, ":root", ["@layer base"])).toBe("--figure-weight: 600;")
  })

  it("sets a stat value in it", () => {
    const body = bodyOf(STAT, ".dr-stat-value")
    expect(body).toContain("font-weight: var(--figure-weight);")
    expect(body).not.toMatch(/(?<![\w-])font-semibold(?![\w-])/)
  })

  it("sets body text in --type-ui-weight", () => {
    expect(bodyOf(THEME, "body", ["@layer base"])).toContain(
      "font-weight: var(--type-ui-weight);",
    )
  })
})

describe("table head signature", () => {
  it.each(["plain", "ruled", "seam"])("drops the band under %s", (value) => {
    expect(bodyOf(TABLE, `[data-table-head="${value}"] .dr-table-header`)).toBe(
      "background-color: transparent;",
    )
  })

  it("rules the head off with the strong border rung", () => {
    expect(bodyOf(TABLE, '[data-table-head="ruled"] .dr-table-header tr')).toBe(
      "border-bottom-color: hsl(var(--border-strong));",
    )
  })

  it("seams the head: a line with a highlight under it", () => {
    expect(bodyOf(TABLE, '[data-table-head="seam"] .dr-table-header tr')).toBe(
      "border-bottom-color: var(--seam);",
    )
    expect(
      bodyOf(TABLE, '[data-table-head="seam"] .dr-table-header .dr-table-head'),
    ).toBe("box-shadow: 0 1px 0 var(--seam-highlight);")
  })
})

describe("row selection signature", () => {
  const ROW = '.dr-table-row[data-state="selected"]'

  it("tints a selected row with the accent", () => {
    expect(bodyOf(TABLE, `[data-row-selection="accent"] ${ROW}`)).toBe(
      "background-color: hsl(var(--primary) / 0.12);",
    )
  })

  it("marks a selected row with an accent stripe on its leading edge", () => {
    expect(
      bodyOf(TABLE, `[data-row-selection="stripe"] ${ROW} > :first-child`),
    ).toBe("box-shadow: inset 3px 0 0 hsl(var(--primary));")
    expect(
      bodyOf(
        TABLE,
        `[data-row-selection="stripe"] ${ROW} > :first-child:dir(rtl)`,
      ),
    ).toBe("box-shadow: inset -3px 0 0 hsl(var(--primary));")
  })
})

describe("figure family signature", () => {
  it.each([
    [STAT, ".dr-stat-value"],
    [TABLE, '.dr-table-cell[data-align="end"]'],
  ])("%s sets %s in the mono family", (path, selector) => {
    expect(bodyOf(path, `[data-figure-family="mono"] ${selector}`)).toBe(
      "font-family: var(--font-mono);",
    )
  })
})

describe("avatar shape signature", () => {
  it("squares the avatar and its fallback to half the radius", () => {
    expect(
      bodyOf(
        AVATAR,
        '[data-avatar-shape="square"] :is(.dr-avatar, .dr-avatar-fallback)',
      ),
    ).toBe("border-radius: calc(var(--radius) / 2);")
  })
})

describe("label case signature on table heads", () => {
  it("uppercases a head", () => {
    expect(bodyOf(TABLE, '[data-label-case="upper"] .dr-table-head')).toBe(
      "text-transform: uppercase;",
    )
  })

  it("lowercases a head", () => {
    expect(bodyOf(TABLE, '[data-label-case="lower"] .dr-table-head')).toBe(
      "text-transform: lowercase;",
    )
  })
})
