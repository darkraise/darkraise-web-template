import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { stripCssComments } from "../test/strip-css-comments"

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
  const css = stripCssComments(readFileSync(path, "utf8"))
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

const THEME = "src/styles/theme.css"

describe("scrollbars and skeletons at rest", () => {
  const scrollbars = rulesOf(THEME).filter(
    (rule) =>
      rule.selectors.some((s) => s.includes("::-webkit-scrollbar")) ||
      rule.body.includes("scrollbar-color"),
  )

  it("paints the global scrollbar on a foreground alpha", () => {
    expect(scrollbars.length).toBeGreaterThanOrEqual(3)
    expect(scrollbars.map((rule) => rule.body).join(" ")).toContain(
      "scrollbar-color: hsl(var(--foreground) / 0.25) transparent;",
    )
    expect(bodyOf(THEME, "*::-webkit-scrollbar-thumb")).toContain(
      "background-color: hsl(var(--foreground) / 0.25);",
    )
    expect(bodyOf(THEME, "*::-webkit-scrollbar-thumb:hover")).toContain(
      "background-color: hsl(var(--foreground) / 0.4);",
    )
    for (const rule of scrollbars) expect(rule.body).not.toContain("--primary")
  })

  it("paints the ScrollArea thumb the same way", () => {
    const css = "src/components/scroll-area/scroll-area.css"
    const thumb = bodyOf(css, ".dr-scroll-thumb")
    expect(thumb).toContain("background-color: hsl(var(--foreground) / 0.25);")
    expect(thumb).not.toMatch(/primary/)
    expect(bodyOf(css, ".dr-scroll-thumb:hover")).toContain(
      "background-color: hsl(var(--foreground) / 0.4);",
    )
  })

  it("paints the skeleton with no accent mixed in", () => {
    const body = bodyOf("src/components/skeleton/skeleton.css", ".dr-skeleton")
    expect(body).toContain("background-color: hsl(var(--foreground) / 0.1);")
    expect(body).not.toContain("--primary")
  })
})

const BADGE = "src/components/badge/badge.css"
const INTERACTIVE = ':is(a, button, [role="button"])'

describe("badge hover", () => {
  const badgeRules = rulesOf(BADGE).filter((rule) =>
    rule.selectors.some((s) => /\.dr-badge(?![\w-])/.test(s)),
  )

  it("puts no hover utility in a badge's resting rule", () => {
    const offenders = badgeRules
      .filter((rule) => /(?<![\w-])hover:/.test(rule.body))
      .map((rule) => rule.selectors.join(", "))
    expect(offenders).toEqual([])
  })

  it("hovers only a badge that is a link or a button", () => {
    const hovers = badgeRules.flatMap((rule) =>
      rule.selectors.filter((s) => s.includes(":hover")),
    )
    // default, secondary, the four status solids and the 17 fixed colours.
    expect(hovers.length).toBe(23)
    expect(
      hovers.filter((s) => !s.includes(`.dr-badge${INTERACTIVE}`)),
    ).toEqual([])
  })
})

describe("floating panel triggers at rest", () => {
  const css = "src/components/floating-panel/floating-panel.css"

  it("rims the trigger with the neutral field edge", () => {
    const body = bodyOf(css, ".dr-floating-panel-trigger")
    expect(body).toContain("border-color: var(--field-edge);")
    expect(body).not.toContain("--primary")
  })

  it("leaves the rim alone on hover", () => {
    const offenders = rulesOf(css)
      .filter(
        (rule) =>
          rule.selectors.some(
            (s) =>
              s.includes(".dr-floating-panel-trigger") && s.includes(":hover"),
          ) && /border-color|(?<![\w-])bg-/.test(rule.body),
      )
      .map((rule) => rule.selectors.join(", "))
    expect(offenders).toEqual([])
  })
})
