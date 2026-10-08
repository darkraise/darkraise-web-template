import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

// A touch screen reports :hover on whatever was last tapped and keeps it
// until the next tap elsewhere, so an ungated hover wash sticks to a tapped
// control. Every hover rule in the kit therefore sits inside
// `@media (hover: hover)`; press, focus and data-state rules stay outside it.

/** [stylesheet, selector, why it may stay outside the media block] */
const ALLOWED: Array<[string, string, string]> = [
  [
    "src/components/virtualized-dropdown-menu/virtualized-dropdown-menu.css",
    ".dr-vdm-item[data-active]:not(:hover)",
    "keyboard highlight that the pointer row takes over",
  ],
  [
    "src/components/listbox/listbox.css",
    '.dr-listbox-item[data-focused="true"]:not(:hover)',
    "keyboard highlight that the pointer row takes over",
  ],
  [
    "src/components/command/command.css",
    '.dr-command-item[data-selected="true"]:not(:hover)',
    "keyboard highlight that the pointer row takes over",
  ],
  [
    "src/components/combobox/combobox.css",
    '.dr-combobox-item[data-highlighted="true"]:not(:hover)',
    "keyboard highlight that the pointer row takes over",
  ],
]

interface StyleRule {
  path: string
  selectors: string[]
  /** Preludes of the enclosing at-rules and style rules, outermost first. */
  ancestors: string[]
  /** Direct declarations and statement at-rules such as `@apply`. */
  statements: string[]
}

function normalise(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
}

function splitSelectors(prelude: string): string[] {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < prelude.length; i++) {
    const ch = prelude[i] as string
    if (ch === "(" || ch === "[") depth++
    else if (ch === ")" || ch === "]") depth--
    else if (ch === "," && depth === 0) {
      parts.push(prelude.slice(start, i))
      start = i + 1
    }
  }
  parts.push(prelude.slice(start))
  return parts.map(normalise).filter(Boolean)
}

/** Style rules at any depth, each with the at-rules and rules around it. */
function parse(path: string, source: string): StyleRule[] {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, "")
  const rules: StyleRule[] = []
  const stack: Array<{ prelude: string; rule: StyleRule | null }> = []
  let buffer = ""
  const flush = () => {
    const statement = normalise(buffer)
    buffer = ""
    const owner = stack[stack.length - 1]?.rule
    if (statement && owner) owner.statements.push(statement)
  }
  for (const ch of css) {
    if (ch === "{") {
      const prelude = normalise(buffer)
      buffer = ""
      const rule = prelude.startsWith("@")
        ? null
        : {
            path,
            selectors: splitSelectors(prelude),
            ancestors: stack.map((entry) => entry.prelude),
            statements: [],
          }
      if (rule) rules.push(rule)
      stack.push({ prelude, rule })
    } else if (ch === ";") {
      flush()
    } else if (ch === "}") {
      flush()
      stack.pop()
    } else {
      buffer += ch
    }
  }
  return rules
}

/** True for `@media (hover: hover)`, alone or joined to others with `and`. */
function isHoverGate(prelude: string): boolean {
  const match = /^@media\s+(.+)$/.exec(prelude)
  if (!match) return false
  const query = match[1] as string
  if (/,|\bor\b|\bnot\b|\bonly\b/.test(query)) return false
  return query.split(/\s+and\s+/).some((part) => part === "(hover: hover)")
}

function gated(rule: StyleRule): boolean {
  return rule.ancestors.some(isHoverGate)
}

const HOVER = /:hover(?![\w-])/

function stylesheets(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return stylesheets(path)
    return entry.name.endsWith(".css") ? [path] : []
  })
}

const RULES: StyleRule[] = stylesheets("src").flatMap((path) =>
  parse(path.replace(/\\/g, "/"), readFileSync(path, "utf8")),
)

const allowed = (path: string, selector: string) =>
  ALLOWED.some(([file, entry]) => file === path && entry === selector)

function ungatedHoverSelectors(): string[] {
  return RULES.filter((rule) => !gated(rule)).flatMap((rule) =>
    rule.selectors
      .filter((s) => HOVER.test(s) && !allowed(rule.path, s))
      .map((s) => `${rule.path}: ${s}`),
  )
}

describe("hover rules apply only on devices that can hover", () => {
  it("sees media nesting around a rule", () => {
    const rules = parse(
      "fixture.css",
      `@layer components {
        .a:hover, .b { color: red; }
        @media (hover: hover) { .c:hover { color: red; } }
        @media (forced-colors: active) {
          @media (hover: hover) { .d:hover { color: red; } }
          .e:hover { color: red; }
        }
        @media (min-width: 40rem) and (hover: hover) { .f:hover { color: red; } }
        @media not (hover: hover) { .g:hover { color: red; } }
      }`,
    )
    expect(
      rules.map((rule) => [rule.selectors.join(", "), gated(rule)]),
    ).toEqual([
      [".a:hover, .b", false],
      [".c:hover", true],
      [".d:hover", true],
      [".e:hover", false],
      [".f:hover", true],
      [".g:hover", false],
    ])
  })

  it("finds hover selectors in the kit's stylesheets", () => {
    expect(
      RULES.some((rule) => rule.selectors.some((s) => HOVER.test(s))),
    ).toBe(true)
  })

  it("keeps every :hover selector inside @media (hover: hover)", () => {
    expect(ungatedHoverSelectors()).toEqual([])
  })

  it("allows only exceptions that still exist outside the media block", () => {
    const stale = ALLOWED.filter(
      ([file, selector]) =>
        !RULES.some(
          (rule) =>
            rule.path === file &&
            !gated(rule) &&
            rule.selectors.includes(selector),
        ),
    ).map(([file, selector]) => `${file}: ${selector}`)
    expect(stale).toEqual([])
  })
})
