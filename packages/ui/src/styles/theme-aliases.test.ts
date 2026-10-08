import { describe, it, expect } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join, resolve } from "node:path"
import ts from "typescript"
import { splitToken } from "./interactive-classes"

const thisDir = dirname(fileURLToPath(import.meta.url))
const themeCssPath = resolve(thisDir, "theme.css")
const themeCss = readFileSync(themeCssPath, "utf8")

function extractRuleBody(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  // Match either @utility name { ... } or .name { ... }
  const utilityPattern = new RegExp(`@utility\\s+${escaped}\\s*\\{([^}]*)\\}`)
  const classPattern = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`)
  const match = themeCss.match(utilityPattern) ?? themeCss.match(classPattern)
  if (!match || match[1] === undefined) {
    throw new Error(`Selector not found in theme.css: ${selector}`)
  }
  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n")
}

const REMOVED_UTILITIES = [
  "glass",
  "glass-thin",
  "glass-strong",
  "card-surface",
  "dr-surface",
]

const REPO = resolve(thisDir, "..", "..", "..", "..")
const SOURCE_ROOTS = ["packages/ui/src", "apps/template/src"]

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    // Tests and stories name removed utilities on purpose, to assert absence.
    const skip =
      /\.(?:test|stories)\./.test(entry.name) || entry.name.endsWith(".d.ts")
    return /\.(?:css|tsx?)$/.test(entry.name) && !skip ? [path] : []
  })
}

const isClassName = (name: string) => /^className$|ClassName$/.test(name)

/**
 * Class tokens a TS or TSX file hands to the DOM: className attributes and
 * properties, and cn() arguments. A literal compared with === is a value,
 * not a class.
 */
function scriptClasses(source: string): string[] {
  const file = ts.createSourceFile(
    "scan.tsx",
    source,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TSX,
  )
  const found: string[] = []
  const comparison = new Set([
    ts.SyntaxKind.EqualsEqualsEqualsToken,
    ts.SyntaxKind.ExclamationEqualsEqualsToken,
    ts.SyntaxKind.EqualsEqualsToken,
    ts.SyntaxKind.ExclamationEqualsToken,
  ])
  const collect = (node: ts.Node) => {
    if (
      ts.isBinaryExpression(node) &&
      comparison.has(node.operatorToken.kind)
    ) {
      return
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      found.push(...node.text.split(/\s+/))
    } else if (ts.isTemplateExpression(node)) {
      for (const part of [
        node.head,
        ...node.templateSpans.map((s) => s.literal),
      ]) {
        found.push(...part.text.split(/\s+/))
      }
    }
    ts.forEachChild(node, collect)
  }
  // collect() walks the whole subtree, so a class context is not revisited.
  const visit = (node: ts.Node) => {
    if (
      (ts.isJsxAttribute(node) || ts.isPropertyAssignment(node)) &&
      isClassName(node.name.getText(file)) &&
      node.initializer
    ) {
      collect(node.initializer)
    } else if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "cn"
    ) {
      node.arguments.forEach(collect)
    } else {
      ts.forEachChild(node, visit)
    }
  }
  visit(file)
  return found.filter(Boolean)
}

/** Class selectors and @apply utilities of a stylesheet. */
function stylesheetClasses(css: string): string[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "")
  const applied = [...text.matchAll(/@apply\s+([^;]+);/g)].flatMap((m) =>
    (m[1] as string)
      .trim()
      .split(/\s+/)
      .map((token) => splitToken(token).utility.replace(/^!|!$/g, "")),
  )
  const selected = [...text.matchAll(/([^{};]+)\{/g)].flatMap((m) =>
    [...(m[1] as string).matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map(
      (c) => c[1] as string,
    ),
  )
  return [...applied, ...selected]
}

function classUses(path: string): string[] {
  const source = readFileSync(path, "utf8")
  return path.endsWith(".css")
    ? stylesheetClasses(source)
    : scriptClasses(source)
}

describe("theme aliases", () => {
  it("modal-surface draws no backdrop", () => {
    expect(extractRuleBody("modal-surface")).not.toContain("backdrop-filter")
  })

  it("defines none of the removed fog utilities", () => {
    expect(themeCss).not.toMatch(
      /@utility\s+(?:glass|glass-thin|glass-strong|card-surface)\s*\{/,
    )
  })

  it("overlay-surface applies the overlay recipe and nothing else", () => {
    expect(extractRuleBody("overlay-surface").split("\n")).toEqual([
      "background: var(--overlay-bg);",
      "background-blend-mode: var(--surface-overlay-blend-mode);",
      "border-color: var(--overlay-border);",
      "-webkit-backdrop-filter: var(--overlay-backdrop);",
      "backdrop-filter: var(--overlay-backdrop);",
      "--field-edge: var(--field-edge-lifted);",
    ])
    expect(themeCss).toMatch(/@utility\s+overlay-surface\s*\{/)
    expect(themeCss).not.toMatch(/\.overlay-surface\s*\{/)
  })

  it("reads class names from the kit and template sources", () => {
    expect(
      scriptClasses(`<a className={cn("x", s === "glass" && "y")} />`),
    ).toEqual(["x", "y"])
    expect(
      stylesheetClasses(".a > .b:hover { @apply md:c !d; } /* .e */"),
    ).toEqual(["c", "d", "a", "b"])
    const files = SOURCE_ROOTS.flatMap((root) => sourceFiles(join(REPO, root)))
    const classes = new Set(files.flatMap(classUses))
    expect(classes).toContain("dr-btn")
    expect(classes).toContain("focus-ring")
    expect(classes.size).toBeGreaterThan(1000)
  })

  it("uses none of the removed fog utilities as a class", () => {
    const offenders = SOURCE_ROOTS.flatMap((root) =>
      sourceFiles(join(REPO, root)),
    ).flatMap((path) =>
      classUses(path)
        .filter((cls) => REMOVED_UTILITIES.includes(cls))
        .map((cls) => `${cls} in ${path.slice(REPO.length + 1)}`),
    )
    expect(offenders).toEqual([])
  })
})
