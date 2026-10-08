import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

// A touch screen reports :hover on whatever was last tapped and keeps it
// until the next tap elsewhere, so an ungated hover wash sticks to a tapped
// control. Every hover rule in the kit therefore sits inside
// `@media (hover: hover)`; press, focus and data-state rules stay outside it.

/** [stylesheet, selector, why it may stay outside the media block] */
const ALLOWED: Array<[string, string, string]> = []

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

/** True for `@media <feature>`, alone or joined to others with `and`. */
function mediaRequires(prelude: string, feature: string): boolean {
  const match = /^@media\s+(.+)$/.exec(prelude)
  if (!match) return false
  const query = match[1] as string
  if (/,|\bor\b|\bnot\b|\bonly\b/.test(query)) return false
  return query.split(/\s+and\s+/).some((part) => part === feature)
}

const isHoverGate = (prelude: string) =>
  mediaRequires(prelude, "(hover: hover)")
const isHoverNone = (prelude: string) => mediaRequires(prelude, "(hover: none)")

function gated(rule: StyleRule): boolean {
  return rule.ancestors.some(isHoverGate)
}

const HOVER = /:hover(?![\w-])/

/**
 * A Tailwind variant chain that hovers: `hover:`, `group-hover:`,
 * `peer-hover/name:`, or an arbitrary variant such as `[&>a:hover]:`.
 */
const HOVER_VARIANT =
  /(?:^|:)(?:group-|peer-)?hover(?:\/[\w-]+)?:|\[[^\]]*:hover(?![\w-])[^\]]*\]:/

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

/** The last compound selector: the element the rule styles. */
function subject(selector: string): string {
  let depth = 0
  let start = 0
  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i] as string
    if (ch === "(" || ch === "[") depth++
    else if (ch === ")" || ch === "]") depth--
    else if (depth === 0 && /[\s>+~]/.test(ch)) start = i + 1
  }
  return selector.slice(start)
}

/** The opacity a rule sets, from `opacity: N` or an applied `opacity-N`. */
function opacityOf(rule: StyleRule): number | null {
  let found: number | null = null
  for (const statement of rule.statements) {
    const plain = /^opacity: ([\d.]+)$/.exec(statement)
    if (plain) found = Number(plain[1])
    const applied = /^@apply\b.*(?<![\w-])opacity-(\d+)(?![\w-])/.exec(
      statement,
    )
    if (applied) found = Number(applied[1]) / 100
  }
  return found
}

/**
 * What hovering an ancestor does to an element's opacity, as
 * [stylesheet, the element's compound selector, opacity].
 */
function hoverDrivenOpacities(): Array<[string, string, number]> {
  return RULES.filter(gated).flatMap((rule) => {
    const opacity = opacityOf(rule)
    if (opacity === null) return []
    return rule.selectors
      .filter((s) => HOVER.test(s) && !HOVER.test(subject(s)))
      .map((s): [string, string, number] => [rule.path, subject(s), opacity])
  })
}

function ungatedHoverUtilities(): string[] {
  return RULES.filter((rule) => !gated(rule)).flatMap((rule) =>
    rule.statements
      .filter((statement) => statement.startsWith("@apply "))
      .flatMap((statement) => statement.slice("@apply ".length).split(" "))
      .filter((token) => HOVER_VARIANT.test(token))
      .map((token) => `${rule.path}: ${rule.selectors.join(", ")} ${token}`),
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

  it("recognises every way a utility can hover", () => {
    const hovering = [
      "hover:bg-accent",
      "dark:hover:bg-accent",
      "group-hover:opacity-100",
      "peer-hover/field:text-foreground",
      "[&>a:hover]:text-primary-text",
    ]
    const resting = [
      "bg-accent",
      "data-[state=hover]:bg-accent",
      "[&_.dr-hover-card]:hidden",
      "hover-none",
    ]
    expect(hovering.filter((token) => !HOVER_VARIANT.test(token))).toEqual([])
    expect(resting.filter((token) => HOVER_VARIANT.test(token))).toEqual([])
  })

  it("keeps every hover utility in @apply inside @media (hover: hover)", () => {
    expect(ungatedHoverUtilities()).toEqual([])
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

// A control that appears only while its row or toast is hovered would never
// appear on a touch screen, so a device without hover shows it at rest.
describe("controls revealed on hover show at rest without hover", () => {
  it("finds every element whose opacity an ancestor's hover changes", () => {
    expect(
      hoverDrivenOpacities().map(([path, element, opacity]) =>
        [path, element, opacity].join(" "),
      ),
    ).toEqual([
      "src/components/json-tree-view/json-tree-view.css .dr-json-row-actions 1",
      "src/components/json-tree-view/json-tree-view.css .dr-json-copy 1",
      "src/components/sonner/sonner.css .dr-toast-close 1",
      "src/layout/sidebar/sidebar-layout.css .dr-brand-logo 0",
      "src/layout/sidebar/sidebar-layout.css .dr-sidebar-layout-toggle 1",
    ])
  })

  it("gives each the same opacity inside @media (hover: none)", () => {
    const where = (match: (rule: StyleRule) => boolean) =>
      RULES.flatMap((rule, index) => (match(rule) ? [index] : []))
    const missing = hoverDrivenOpacities()
      .filter(([path, element, opacity]) => {
        const styles = (rule: StyleRule) =>
          rule.path === path &&
          rule.selectors.some((s) => subject(s) === element)
        const touch = where(
          (rule) =>
            styles(rule) &&
            rule.ancestors.some(isHoverNone) &&
            opacityOf(rule) === opacity,
        )
        // Equal specificity: the touch rule wins only after the resting one.
        const resting = where(
          (rule) =>
            styles(rule) &&
            !gated(rule) &&
            !rule.ancestors.some(isHoverNone) &&
            opacityOf(rule) !== null &&
            opacityOf(rule) !== opacity,
        )
        return !touch.some((at) => resting.every((rest) => rest < at))
      })
      .map(([path, element, opacity]) => `${path}: ${element} ${opacity}`)
    expect(missing).toEqual([])
  })
})
