import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

// Disabled controls faded by three amounts — 0.5 on most, 0.6 on compound
// roots, 0.7 on the label and Editable — so two unavailable controls side by
// side disagreed about how unavailable they were. Every disabled rule now
// reads one token.
//
// A disabled rule is one whose selector, or the Tailwind variant on the
// utility, names `disabled`, `data-disabled`, `aria-disabled` or
// `peer-disabled`. A `:not(…)` guard means the opposite — it keeps a hover
// rule off disabled controls — so it is stripped before the check.

const TOKEN_DECLARATION = "var(--disabled-opacity)"
const TOKEN_UTILITY = "opacity-[var(--disabled-opacity)]"

function filesUnder(dir: string, pattern: RegExp): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return filesUnder(path, pattern)
    const skip = /\.(test|stories)\.tsx?$/.test(entry.name)
    return pattern.test(entry.name) && !skip ? [path] : []
  })
}

/** Comments blanked out, keeping every newline so line numbers still match. */
function withoutComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "))
}

interface Rule {
  where: string
  selector: string
  body: string
}

function rulesOf(path: string): Rule[] {
  const css = withoutComments(readFileSync(path, "utf8"))
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => {
    // The match starts right after the previous brace.
    const start = (match.index as number) + (match[1] as string).search(/\S/)
    return {
      where: `${path}:${css.slice(0, start).split("\n").length}`,
      selector: (match[1] as string).trim().replace(/\s+/g, " "),
      body: match[2] as string,
    }
  })
}

function isDisabledSelector(selector: string): boolean {
  return /disabled/.test(selector.replace(/:not\((?:[^()]|\([^()]*\))*\)/g, ""))
}

/** Variants and utility of an @apply token; brackets may hold colons. */
function splitToken(token: string): { variants: string[]; utility: string } {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < token.length; i++) {
    const ch = token[i]
    if (ch === "[") depth++
    else if (ch === "]") depth--
    else if (ch === ":" && depth === 0) {
      parts.push(token.slice(start, i))
      start = i + 1
    }
  }
  return { variants: parts, utility: token.slice(start) }
}

const RULES = filesUnder("src", /\.css$/).flatMap(rulesOf)

function disabledOpacities(): Array<{ where: string; text: string }> {
  const found: Array<{ where: string; text: string }> = []
  for (const rule of RULES) {
    const selectorDisabled = isDisabledSelector(rule.selector)
    if (selectorDisabled) {
      for (const decl of rule.body.matchAll(
        /(?<![\w-])opacity\s*:\s*([^;]+);/g,
      )) {
        found.push({ where: rule.where, text: decl[0] })
      }
    }
    for (const apply of rule.body.matchAll(/@apply([^;]*);/g)) {
      for (const token of (apply[1] as string).trim().split(/\s+/)) {
        const { variants, utility } = splitToken(token)
        if (!utility.startsWith("opacity-")) continue
        if (selectorDisabled || variants.some((v) => /disabled/.test(v))) {
          found.push({ where: rule.where, text: token })
        }
      }
    }
  }
  return found
}

function ruleBody(path: string, selector: string): string {
  const rule = rulesOf(path).find((r) => r.selector === selector)
  expect(rule, `no rule ${selector} in ${path}`).toBeDefined()
  return rule?.body ?? ""
}

describe("disabled opacity", () => {
  const theme = readFileSync("src/styles/theme.css", "utf8")

  it("declares the disabled and loading opacities", () => {
    expect(theme).toMatch(/--disabled-opacity:\s*0\.5;/)
    expect(theme).toMatch(/--loading-opacity:\s*0\.7;/)
  })

  it("reports the line a rule's selector starts on", () => {
    const path = "src/components/button/button.css"
    const rule = rulesOf(path).find(
      (r) => r.selector === ".dr-btn[data-loading]",
    )
    const line =
      readFileSync(path, "utf8")
        .split("\n")
        .findIndex((text) => text.trim().startsWith(".dr-btn[data-loading]")) +
      1
    expect(line).toBeGreaterThan(0)
    expect(rule?.where).toBe(`${path}:${line}`)
  })

  it("finds the disabled rules it must check", () => {
    expect(disabledOpacities().length).toBeGreaterThan(60)
  })

  it("reads the token in every disabled rule", () => {
    const offenders = disabledOpacities()
      .filter(({ text }) => {
        const declaration = /^opacity\s*:\s*([^;]+);$/.exec(text)
        if (declaration) return declaration[1]?.trim() !== TOKEN_DECLARATION
        return splitToken(text).utility !== TOKEN_UTILITY
      })
      .map(({ where, text }) => `${text} at ${where}`)
    expect(offenders).toEqual([])
  })

  it("keeps a loading button above the disabled opacity", () => {
    // Loading is busy, not unavailable, so it stays less faded than disabled.
    expect(
      ruleBody("src/components/button/button.css", ".dr-btn[data-loading]"),
    ).toMatch(/opacity:\s*var\(--loading-opacity\);/)
  })

  it("dims a pinned panel's drag handle with the disabled token", () => {
    expect(
      ruleBody(
        "src/components/floating-panel/floating-panel.css",
        '.dr-floating-panel[data-pinned="true"] .dr-floating-panel-drag-handle',
      ),
    ).toMatch(/opacity:\s*var\(--disabled-opacity\);/)
  })

  it.each([
    ["src/components/toggle/toggle.css", ".dr-toggle"],
    ["src/components/tabs/tabs.css", ".dr-tabs-trigger"],
    [
      "src/components/navigation-menu/navigation-menu.css",
      ".dr-navigation-menu-trigger",
    ],
    [
      "src/components/number-input/number-input.css",
      ".dr-number-input-stepper",
    ],
    [
      "src/components/password-input/password-input.css",
      ".dr-password-input-trigger",
    ],
  ])("%s keeps pointer events on a disabled %s", (path, selector) => {
    // A native disabled button ignores clicks by itself; pointer-events: none
    // only cost it the not-allowed cursor and any tooltip explaining why.
    const body = ruleBody(path, selector)
    expect(body).not.toMatch(/(?<![\w-])disabled:pointer-events-none/)
    expect(body).toMatch(/(?<![\w-])disabled:cursor-not-allowed(?![\w-])/)
  })

  it("keeps the navigation-menu trigger's hover off a disabled trigger", () => {
    const path = "src/components/navigation-menu/navigation-menu.css"
    expect(ruleBody(path, ".dr-navigation-menu-trigger")).not.toMatch(
      /(?<![\w-])(?:[\w-]+-\[[^\]]*\]:|[\w-]+:)*hover:/,
    )
    const hovers = rulesOf(path).filter(
      (r) =>
        r.selector.includes(".dr-navigation-menu-trigger") &&
        r.selector.includes(":hover"),
    )
    expect(hovers.length).toBeGreaterThan(0)
    for (const rule of hovers) {
      expect(rule.selector, rule.where).toContain(":not(:disabled)")
    }
  })

  it("sets no disabled opacity from TSX class strings", () => {
    const offenders: string[] = []
    for (const path of filesUnder("src", /\.tsx?$/)) {
      const source = readFileSync(path, "utf8")
      for (const literal of source.matchAll(/"[^"\n]*"|'[^'\n]*'|`[^`]*`/g)) {
        for (const token of literal[0].slice(1, -1).split(/\s+/)) {
          const { variants, utility } = splitToken(token)
          if (!utility.startsWith("opacity-")) continue
          if (variants.some((v) => /disabled/.test(v))) {
            offenders.push(`${token} in ${path}`)
          }
        }
      }
      for (const match of source.matchAll(
        /\w*[dD]isabled\w*\s*&&\s*["'`][^"'`]*(?<![\w-])opacity-/g,
      )) {
        offenders.push(`${match[0]} in ${path}`)
      }
    }
    expect(offenders).toEqual([])
  })
})
