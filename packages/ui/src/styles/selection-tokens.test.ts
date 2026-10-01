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
