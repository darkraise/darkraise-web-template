import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

// Accent marks action, focus, checked and selected states. Controls at rest
// sit on neutrals: the outline rim on the 3:1 field edge, ghost text on the
// foreground, scrollbars and skeletons on a foreground alpha.

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

const BUTTON = "src/components/button/button.css"

describe("buttons at rest", () => {
  it("rims the outline variant with the neutral field edge", () => {
    const body = bodyOf(BUTTON, '.dr-btn[data-variant="outline"]')
    expect(body).toContain("border-color: var(--field-edge);")
    expect(body).not.toContain("--primary")
  })

  it("rests the ghost variant on foreground text, with hover left to the state layer", () => {
    const body = bodyOf(BUTTON, '.dr-btn[data-variant="ghost"]')
    expect(body).toMatch(/(?<![\w:-])text-foreground(?![\w-])/)
    expect(body).not.toContain("text-muted-foreground")
    expect(body).not.toMatch(/(?<![\w-])hover:/)
  })
})
