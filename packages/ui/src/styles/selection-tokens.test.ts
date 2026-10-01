import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

// Selection reads from four families instead of six visual languages: a
// neutral raised pill for view switches, an accent fill for checked and
// selected items, an accent underline with foreground text, and an accent
// tint for the active navigation row. A family token defaults at :root only
// to variables bound on <html>.

const THEME = readFileSync("src/styles/theme.css", "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
)

/** The contents of the first block `opener` opens, braces balanced. */
function block(css: string, opener: RegExp): string {
  const match = opener.exec(css)
  if (!match) throw new Error(`no block for ${String(opener)}`)
  const start = match.index + match[0].length
  let depth = 1
  let end = start
  while (depth > 0 && end < css.length) {
    if (css[end] === "{") depth++
    else if (css[end] === "}") depth--
    end++
  }
  return css.slice(start, end - 1).replace(/\s+/g, " ")
}

interface Rule {
  selectors: string[]
  body: string
}

/** Prettier wraps long selectors inside :is( … ); undo that. */
function normalise(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
}

/** Innermost rules; wrappers such as @layer and @media are transparent. */
function rulesOf(path: string): Rule[] {
  const css = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selectors: (match[1] as string)
      .split(/,(?![^(]*\))/)
      .map(normalise)
      .filter(Boolean),
    body: normalise(match[2] as string),
  }))
}

/** The body of the rule whose selector list holds `selector`. */
function bodyOf(path: string, selector: string): string {
  const rule = rulesOf(path).find((r) => r.selectors.includes(selector))
  if (!rule) throw new Error(`no rule ${selector} in ${path}`)
  return rule.body
}

const ROOT = block(THEME, /@layer base \{\s*:root \{/)
const DARK_ROOT = block(THEME, /:root\[data-mode="dark"\] \{/)

const FAMILIES: Array<[string, string]> = [
  ["--selected-view-bg", "hsl(var(--card))"],
  ["--selected-view-fg", "hsl(var(--foreground))"],
  ["--selected-view-shadow", "var(--shadow-button)"],
  ["--selected-check-bg", "hsl(var(--primary-fill))"],
  ["--selected-check-fg", "hsl(var(--primary-foreground))"],
  ["--selected-mark", "hsl(var(--primary-fill))"],
  ["--selected-mark-fg", "hsl(var(--foreground))"],
  ["--selected-nav-bg", "hsl(var(--sidebar-active-bg))"],
  ["--selected-nav-fg", "hsl(var(--foreground))"],
]

describe("selection family tokens", () => {
  it.each(FAMILIES)("declares %s as %s on :root", (name, value) => {
    expect(ROOT).toContain(`${name}: ${value};`)
  })

  it("raises the view-switch pill on --border in dark mode", () => {
    expect(DARK_ROOT.trim()).toBe("--selected-view-bg: hsl(var(--border));")
  })
})

const TABS = "src/components/tabs/tabs.css"
const SEGMENT = "src/components/segment-group/segment-group.css"

describe("view switch family", () => {
  it.each([
    [
      TABS,
      '.dr-tabs-indicator[data-variant="default"]',
      "background-color: var(--selected-view-bg);",
    ],
    [
      TABS,
      '.dr-tabs-indicator[data-variant="default"]',
      "box-shadow: var(--selected-view-shadow),",
    ],
    [
      TABS,
      '.dr-tabs-indicator[data-variant="outline"]',
      "background-color: var(--selected-view-bg);",
    ],
    [
      TABS,
      '.dr-tabs-trigger:is([data-variant="default"], [data-variant="outline"])[data-state="active"]',
      "color: var(--selected-view-fg);",
    ],
    [
      SEGMENT,
      ".dr-segment-group-indicator",
      "background-color: var(--selected-view-bg);",
    ],
    [
      SEGMENT,
      '.dr-segment-group .dr-segment-group-item[data-state="checked"]',
      "color: var(--selected-view-fg);",
    ],
    // color="accent" is an opt-in that reads the checked family.
    [
      SEGMENT,
      '.dr-segment-group[data-color="accent"] .dr-segment-group-indicator[data-variant="default"]',
      "background-color: var(--selected-check-bg);",
    ],
    [
      SEGMENT,
      '.dr-segment-group[data-color="accent"] .dr-segment-group-item[data-variant="default"][data-state="checked"]',
      "color: var(--selected-check-fg);",
    ],
  ])("%s %s reads %s", (path, selector, declaration) => {
    expect(bodyOf(path, selector)).toContain(declaration)
  })

  // The outline variants have no outline at rest, so the ring on the pill
  // is what still tells them apart from default.
  it.each([
    [TABS, '.dr-tabs-indicator[data-variant="outline"]'],
    [SEGMENT, '.dr-segment-group-indicator[data-variant="outline"]'],
  ])("%s %s rings the pill with a 1px neutral line", (path, selector) => {
    expect(bodyOf(path, selector)).toContain(
      "inset 0 0 0 1px hsl(var(--border-strong))",
    )
  })
})
