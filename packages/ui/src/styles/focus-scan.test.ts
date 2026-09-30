import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

const ROOTS = [
  "src/components",
  "src/layout",
  "src/forms",
  "src/data-table",
  "src/theme/theme-switcher",
]

/**
 * Interactive classes that draw no focus indicator of their own, each with
 * the reason that is acceptable.
 */
const EXEMPT = new Map<string, string>([
  ["dr-label", "a label is not focusable; clicking it focuses its control"],
  [
    "dr-calendar-caption-label",
    "shares its button with dr-calendar-caption-label-btn, which draws the ring",
  ],
  [
    "dr-json-chevron",
    "the chevron button has tabIndex -1; keyboard toggling happens on the focused row",
  ],
  [
    "dr-sidebar-nav-item",
    "shares its element with dr-sidebar-nav-link, dr-sidebar-nav-popover-trigger or dr-stacked-layout-rail-item, each of which draws the ring",
  ],
  [
    "dr-steps-trigger",
    "Steps.tsx passes focus-ring-tight as a separate cn() argument, which this scan cannot pair with the class",
  ],
  [
    "dr-rating-group-item",
    "RatingGroup.tsx passes focus-ring-tight as a separate cn() argument, which this scan cannot pair with the class",
  ],
  [
    "dr-sidebar-nav-collapsible-link",
    "shares its element with dr-sidebar-nav-link, which draws the ring",
  ],
  [
    "dr-sidebar-nav-popover-parent",
    "shares its element with dr-sidebar-popover-child, which draws the ring",
  ],
])

function filesUnder(dir: string, extension: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return filesUnder(path, extension)
    const skip = entry.name.includes(".test.") || entry.name.includes(".stories.")
    return entry.name.endsWith(extension) && !skip ? [path] : []
  })
}

interface Rule {
  path: string
  selectors: string[]
  body: string
}

/** Innermost rules; wrappers such as @layer and @media are transparent. */
function rulesOf(path: string): Rule[] {
  const css = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    path,
    selectors: (match[1] as string)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    body: match[2] as string,
  }))
}

/** The dr-* classes on a selector's last compound: the element the rule styles. */
function subjectClasses(selector: string): string[] {
  const last = selector.split(/\s*[>+~]\s*|\s+/).pop() ?? ""
  return [...last.matchAll(/\.(dr-[\w-]+)/g)].map((m) => m[1] as string)
}

const RULES = ROOTS.flatMap((root) => filesUnder(root, ".css")).flatMap(rulesOf)
const TSX = ROOTS.flatMap((root) => filesUnder(root, ".tsx")).map((path) => ({
  path,
  source: readFileSync(path, "utf8"),
}))

function interactiveClasses(): Map<string, string> {
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
  }
  return found
}

const FOCUS_STATE = /:focus-visible|:focus-within|\[data-highlighted|\[data-focused/
/**
 * Rows whose keyboard-active state is `data-active` (aria-activedescendant).
 * Elsewhere `data-active` means "selected", and a selection glow is not focus.
 */
const ACTIVE_ROW_CLASSES = new Set(["dr-vdm-item", "dr-cascade-item"])

/** Declarations and utilities that remove an indicator rather than draw one. */
const REMOVALS =
  /(?:[\w-]+:)*outline-none|(?:[\w-]+:)*ring-0(?![\w-])|outline\s*:\s*(?:none|0)\s*;|box-shadow\s*:\s*none\s*;/g

function drawsIndicator(body: string): boolean {
  const drawn = body.replace(REMOVALS, "")
  return /outline\s*:|box-shadow\s*:|(?<![\w-])ring-(?!0(?![\w-]))|(?<![\w-])outline-(?!none)\w/.test(
    drawn,
  )
}

function hasFocusRule(cls: string): boolean {
  for (const rule of RULES) {
    for (const selector of rule.selectors) {
      if (!subjectClasses(selector).includes(cls)) continue
      if (/(?<![\w-])focus-ring/.test(rule.body)) return true
      const variantRing = rule.body
        .replace(REMOVALS, "")
        .match(/(?:focus-visible|focus-within):(?:ring-(?!0(?![\w-]))|outline-(?!none)\w)/)
      if (variantRing) return true
      const keyboardState =
        FOCUS_STATE.test(selector) ||
        (ACTIVE_ROW_CLASSES.has(cls) && selector.includes("[data-active"))
      if (keyboardState && drawsIndicator(rule.body)) return true
    }
  }
  for (const { source } of TSX) {
    for (const match of source.matchAll(/["'`]([^"'`]*)["'`]/g)) {
      const classes = (match[1] as string).split(/\s+/)
      if (classes.includes(cls) && classes.some((c) => c.startsWith("focus-ring"))) {
        return true
      }
    }
  }
  return false
}

describe("every interactive class draws a focus indicator", () => {
  const interactive = interactiveClasses()

  it("finds the classes it must check", () => {
    expect(interactive.size).toBeGreaterThan(40)
  })

  it("has no interactive class without a focus rule or a justified exemption", () => {
    const missing = [...interactive]
      .filter(([cls]) => !EXEMPT.has(cls) && !hasFocusRule(cls))
      .map(([cls, path]) => `${cls} (${path})`)
      .sort()
    expect(missing).toEqual([])
  })

  it("keeps every exemption justified and still needed", () => {
    for (const [cls, reason] of EXEMPT) {
      expect(interactive.has(cls), `${cls} is no longer interactive`).toBe(true)
      expect(reason.length, `${cls} needs a reason`).toBeGreaterThan(20)
    }
  })
})
