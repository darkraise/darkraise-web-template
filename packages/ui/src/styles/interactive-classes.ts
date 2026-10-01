import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

// Shared by the focus scan and the forced-colours / touch-action coverage
// test. Paths are relative to packages/ui, where Vitest runs.
const ROOTS = [
  "src/components",
  "src/layout",
  "src/forms",
  "src/data-table",
  "src/theme/theme-switcher",
]

function filesUnder(dir: string, extension: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return filesUnder(path, extension)
    const skip =
      entry.name.includes(".test.") || entry.name.includes(".stories.")
    return entry.name.endsWith(extension) && !skip ? [path] : []
  })
}

export interface Rule {
  path: string
  selectors: string[]
  body: string
}

/** Innermost rules of a stylesheet's text; wrappers such as @layer and @media are transparent. */
export function parseRules(css: string, path = ""): Rule[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "")
  return [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    path,
    // Top-level commas only: `:is(a, b)` is one selector, not two.
    selectors: (match[1] as string)
      .split(/,(?![^(]*\))/)
      .map((s) => s.trim())
      .filter(Boolean),
    body: match[2] as string,
  }))
}

function rulesOf(path: string): Rule[] {
  return parseRules(readFileSync(path, "utf8"), path)
}

/** The dr-* classes on a selector's last compound: the element the rule styles. */
export function subjectClasses(selector: string): string[] {
  const last = selector.split(/\s*[>+~]\s*|\s+/).pop() ?? ""
  return [...last.matchAll(/\.(dr-[\w-]+)/g)].map((m) => m[1] as string)
}

/**
 * Classes that land on one element: each string literal on its own, and all
 * the literals of one cn() call together, since cn() joins its arguments.
 */
export function classGroups(source: string): string[][] {
  const literal = /["'`]([^"'`]*)["'`]/g
  const groups = [...source.matchAll(literal)].map((m) =>
    (m[1] as string).split(/\s+/),
  )
  for (const call of source.matchAll(/(?<![\w.])cn\(/g)) {
    let depth = 1
    let end = (call.index as number) + call[0].length
    while (depth > 0 && end < source.length) {
      const ch = source[end]
      if (ch === "(") depth++
      else if (ch === ")") depth--
      end++
    }
    const args = source.slice((call.index as number) + call[0].length, end - 1)
    groups.push(
      [...args.matchAll(literal)].flatMap((m) => (m[1] as string).split(/\s+/)),
    )
  }
  return groups
}

export const RULES = ROOTS.flatMap((root) => filesUnder(root, ".css")).flatMap(
  rulesOf,
)
export const TSX = ROOTS.flatMap((root) => filesUnder(root, ".tsx")).map(
  (path) => ({
    path,
    source: readFileSync(path, "utf8"),
  }),
)

/** A tabIndex other than a literal -1: 0, or a roving expression. */
const INTERACTIVE_ATTRS = /\btabIndex=(?!\{\s*-1\s*\})/

/**
 * Every dr-* class a user can press or focus, mapped to the file it was last
 * seen in.
 */
export function interactiveClasses(): Map<string, string> {
  const found = new Map<string, string>()
  for (const rule of RULES) {
    if (!/cursor-pointer|cursor:\s*pointer/.test(rule.body)) continue
    for (const selector of rule.selectors) {
      for (const cls of subjectClasses(selector)) found.set(cls, rule.path)
    }
  }
  for (const { path, source } of TSX) {
    for (const match of source.matchAll(
      /<(?:button|a|Link)\b(?:=>|[^>])*?className=(?:\{\s*cn\(\s*)?["'`]([^"'`]+)["'`]/g,
    )) {
      for (const cls of (match[1] as string).split(/\s+/)) {
        if (cls.startsWith("dr-")) found.set(cls, path)
      }
    }
    // A plain element given a tabIndex is as focusable as a button, and has
    // no cursor-pointer rule to give it away. A role alone does not make an
    // element focusable.
    for (const tag of source.matchAll(/<[a-z][\w-]*\b((?:=>|[^>])*?)>/g)) {
      const attrs = tag[1] as string
      if (!INTERACTIVE_ATTRS.test(attrs)) continue
      for (const cls of classGroups(attrs).flat()) {
        if (cls.startsWith("dr-")) found.set(cls, path)
      }
    }
  }
  return found
}

/** Variants and utility of an @apply token; brackets may hold colons. */
export function splitToken(token: string): {
  variants: string[]
  utility: string
} {
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
