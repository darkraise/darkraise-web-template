import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

// One rule for every floating surface and severity message: Alert, Banner
// and Toast share a 10% status tint over an opaque base, toasts read the
// overlay tokens, the menu family agrees on its details, header chrome is
// transparent at rest, and sheets square their viewport edge.

interface Rule {
  selectors: string[]
  body: string
}

/** Prettier wraps long selectors and values inside ( … ); undo that. */
function normalise(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
}

function source(path: string): string {
  return readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
}

/** Innermost rules; wrappers such as @layer and @media are transparent. */
function rulesOf(path: string): Rule[] {
  return [...source(path).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selectors: (match[1] as string)
      .split(/,(?![^(]*\))/)
      .map(normalise)
      .filter(Boolean),
    body: normalise(match[2] as string),
  }))
}

/** Every rule body naming `selector`, joined in source order. */
function bodyOf(path: string, selector: string): string {
  const bodies = rulesOf(path)
    .filter((rule) => rule.selectors.includes(selector))
    .map((rule) => rule.body)
  if (bodies.length === 0) throw new Error(`no rule ${selector} in ${path}`)
  return bodies.join(" ")
}

const THEME = "src/styles/theme.css"
const ALERT = "src/components/alert/alert.css"
const BANNER = "src/components/banner/banner.css"

/** A status colour written with a literal alpha instead of --status-tint. */
const LITERAL_TINT =
  /hsl\(var\(--(?:alert|banner|toast)-accent\) \/ (?:\d*\.)?\d+\)/

describe("severity tint", () => {
  it("declares one tint for every severity surface", () => {
    expect(normalise(source(THEME))).toContain("--status-tint: 0.1;")
  })

  it.each([
    [ALERT, '.dr-alert[data-variant="destructive"]', "--alert-accent"],
    [BANNER, '.dr-banner[data-variant="info"]', "--banner-accent"],
  ])("%s %s paints the tint over its opaque base", (path, selector, accent) => {
    const body = bodyOf(path, selector)
    const tint = `hsl(var(${accent}) / var(--status-tint))`
    expect(body).toContain(
      `background-image: linear-gradient(${tint}, ${tint});`,
    )
    expect(body).not.toMatch(/background-color:/)
    expect(body).toContain(`border-left-color: hsl(var(${accent}));`)
  })

  it.each([ALERT, BANNER])("%s writes no literal tint alpha", (path) => {
    expect(normalise(source(path))).not.toMatch(LITERAL_TINT)
  })

  it("keeps the banner on its muted base and neutral frame", () => {
    const body = bodyOf(BANNER, '.dr-banner[data-variant="info"]')
    expect(body).toMatch(/(?<![\w:-])bg-muted(?![\w-])/)
    expect(body).toMatch(/(?<![\w:-])border-border(?![\w-])/)
  })

  it("leaves the banner's body text on the foreground in dark mode", () => {
    const dark = rulesOf(BANNER).flatMap((rule) =>
      rule.selectors.filter((s) => s.startsWith('[data-mode="dark"]')),
    )
    expect(dark).toEqual([])
  })
})
