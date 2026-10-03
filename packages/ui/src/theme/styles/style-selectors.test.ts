import { describe, it, expect } from "vitest"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { dirname, join, resolve, sep } from "node:path"
import { STYLE_NAMES } from "@theme/styles"

// Styles are token sets. A style file under theme/styles/ sets custom
// properties and nothing else, and no other stylesheet names a style, so a
// component reads one token family whatever style is active. jsdom never
// parses CSS, so the source text is what this asserts.

interface Block {
  prelude: string
  declarations: string[]
  children: Block[]
}

/**
 * A stylesheet as nested blocks, comments dropped. A semicolon or brace
 * inside a string or parentheses (a data: URL) splits nothing.
 */
function parse(css: string): Block {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, "")
  const root: Block = { prelude: "", declarations: [], children: [] }
  const stack: Block[] = [root]
  let text = ""
  let quote = ""
  let escaped = false
  let parens = 0
  for (const ch of source) {
    const top = stack[stack.length - 1] as Block
    if (quote) {
      text += ch
      if (escaped) escaped = false
      else if (ch === "\\") escaped = true
      else if (ch === quote) quote = ""
    } else if (ch === '"' || ch === "'") {
      quote = ch
      text += ch
    } else if (ch === "(" || ch === ")") {
      parens += ch === "(" ? 1 : -1
      text += ch
    } else if (parens > 0) {
      text += ch
    } else if (ch === "{") {
      const block: Block = {
        prelude: text.replace(/\s+/g, " ").trim(),
        declarations: [],
        children: [],
      }
      top.children.push(block)
      stack.push(block)
      text = ""
    } else if (ch === ";" || ch === "}") {
      const declaration = text.replace(/\s+/g, " ").trim()
      if (declaration) top.declarations.push(declaration)
      text = ""
      if (ch === "}") stack.pop()
    } else {
      text += ch
    }
  }
  return root
}

function descendants(block: Block): Block[] {
  return block.children.flatMap((child) => [child, ...descendants(child)])
}

function stylesheets(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return stylesheets(path)
    return entry.name.endsWith(".css") ? [path] : []
  })
}

const STYLES_DIR = join("src", "theme", "styles") + sep
const ALL = stylesheets("src")
const KIT_SHEETS = ALL.filter((path) => !path.startsWith(STYLES_DIR))
const STYLE_SHEETS = ALL.filter((path) => path.startsWith(STYLES_DIR))

/**
 * The style axis, or the preset axis it replaced, as an attribute selector
 * (`[data-style="x"]`, `[data-preset]`) or a Tailwind variant
 * (`data-[style=x]:`, `[[data-style=x]_&]:`).
 */
const STYLE_ATTRIBUTE = /data-\[?(?:style|preset)\s*[\]=~|^$*]/

/** Selectors, at-rule preludes and at-rule statements that name a style. */
function styleSelectors(css: string): string[] {
  const root = parse(css)
  return [root, ...descendants(root)]
    .flatMap((block) => [
      block.prelude,
      ...block.declarations.filter((d) => d.startsWith("@")),
    ])
    .filter((text) => STYLE_ATTRIBUTE.test(text))
}

describe("style selectors", () => {
  it("reads the kit stylesheets and the style files", () => {
    expect(KIT_SHEETS).toContain(join("src", "styles", "theme.css"))
    expect(STYLE_SHEETS.length).toBeGreaterThan(0)
  })

  it("names no style outside theme/styles", () => {
    const offenders = KIT_SHEETS.flatMap((path) =>
      styleSelectors(readFileSync(path, "utf8")).map(
        (selector) => `${selector} (${path})`,
      ),
    )
    expect(offenders).toEqual([])
  })

  it("finds a style selector however it is nested, and nowhere else", () => {
    expect(
      styleSelectors(`
        /* [data-style="glass"] .x { color: red; } */
        @layer components {
          .a { --note: "[data-style=glass]"; }
          @media (hover: hover) { [data-style="glass"] .b { color: red; } }
          .c { &:where([data-preset]) { color: red; } }
          .d { @apply [[data-style=glass]_&]:bg-red-500; }
        }
      `),
    ).toEqual([
      '[data-style="glass"] .b',
      "&:where([data-preset])",
      "@apply [[data-style=glass]_&]:bg-red-500",
    ])
  })
})

/** Attributes a style file may combine with its own [data-style]. */
const CONTEXT_ATTRIBUTES = [
  "data-mode",
  "data-glass-opacity",
  "data-glass-blur",
  "data-background-style",
]

/**
 * Why a style-file selector breaks the grammar, or null when it is valid. A
 * valid selector is one compound: an optional `:root` or `html`, then
 * attribute selectors in any order, exactly one of them the file's own
 * `[data-style="…"]` and the rest context attributes.
 */
function selectorProblem(selector: string, style: string): string | null {
  const compound = /^(?::root|html)?((?:\[[a-z-]+(?:="[a-z0-9-]+")?\])+)$/.exec(
    selector,
  )
  if (!compound) return "is not one compound of attribute selectors"
  const attributes = [
    ...(compound[1] as string).matchAll(/\[([a-z-]+)(?:="([a-z0-9-]+)")?\]/g),
  ]
  const own = attributes.filter(([, name]) => name === "data-style")
  if (own.length !== 1 || own[0]?.[2] !== style) {
    return `is not scoped to [data-style="${style}"] alone`
  }
  const foreign = attributes.find(
    ([, name]) =>
      name !== "data-style" && !CONTEXT_ATTRIBUTES.includes(name as string),
  )
  return foreign ? `names ${foreign[0]}` : null
}

/** A style file's style: `theme/styles/<style>/<style>.css`. */
function styleOf(path: string): string {
  const [style, file, ...rest] = path.slice(STYLES_DIR.length).split(sep)
  if (
    !style ||
    rest.length > 0 ||
    file !== `${style}.css` ||
    !(STYLE_NAMES as readonly string[]).includes(style)
  ) {
    throw new Error(`${path} is not theme/styles/<style>/<style>.css`)
  }
  return style
}

describe("style files", () => {
  it.each(STYLE_SHEETS)("%s declares custom properties only", (path) => {
    const root = parse(readFileSync(path, "utf8"))
    const offenders = [root, ...descendants(root)].flatMap((block) =>
      block.declarations.filter((d) => !d.startsWith("--")),
    )
    expect(offenders).toEqual([])
  })

  it.each(STYLE_SHEETS)(
    "%s scopes every rule to its own style and uses no at-rule but @media",
    (path) => {
      const style = styleOf(path)
      const offenders = descendants(parse(readFileSync(path, "utf8"))).flatMap(
        (block) =>
          block.prelude.startsWith("@")
            ? block.prelude.startsWith("@media")
              ? []
              : [`${block.prelude}: not @media`]
            : block.prelude
                .split(/,(?![^(]*\))/)
                .map((selector) => selector.trim())
                .map((selector) => {
                  const problem = selectorProblem(selector, style)
                  return problem ? `${selector}: ${problem}` : null
                })
                .filter((problem): problem is string => problem !== null),
      )
      expect(offenders).toEqual([])
    },
  )

  it.each([
    '[data-style="glass"]',
    ':root[data-style="glass"]',
    'html[data-style="glass"]',
    '[data-mode="dark"][data-style="glass"]',
    '[data-style="glass"][data-glass-opacity="subtle"]',
    '[data-background-style="gradient"][data-style="glass"][data-glass-blur="none"]',
    // Presence-only context attributes raise specificity without naming a value.
    '[data-style="glass"][data-mode][data-glass-opacity][data-glass-blur][data-background-style]',
  ])("accepts %s in glass.css", (selector) => {
    expect(selectorProblem(selector, "glass")).toBeNull()
  })

  it.each([
    ['[data-style="glass"] .dr-btn', "a class"],
    ['[data-style="glass"].dr-btn', "a class on the same element"],
    ['[data-style="glass"] > [data-region="nav"]', "a region"],
    ['[data-style="glass"][data-shell-style="island"]', "a shell style"],
    ['[data-style="glass"] main[data-content]', "page content"],
    [":root", "an unscoped root"],
    ['[data-mode="dark"]', "a mode with no style"],
    ['[data-style="flat"]', "another style's attribute"],
    ['[data-style="glass"][data-style="flat"]', "two styles"],
    ["[data-style]", "a style attribute with no value"],
  ])("rejects %s (%s) in glass.css", (selector) => {
    expect(selectorProblem(selector, "glass")).not.toBeNull()
  })
})

describe("theme.css imports", () => {
  // Style files and layout sheets are imported by hand, so a deleted file
  // leaves a dangling @import that no selector scan sees; it surfaces only
  // as an ENOENT part-way through the build.
  it("imports only stylesheets that exist", () => {
    const entry = join("src", "styles", "theme.css")
    const dangling = [
      ...readFileSync(entry, "utf8").matchAll(/@import\s+"([^"]+\.css)"/g),
    ]
      .map((match) => match[1] as string)
      .filter((target) => !existsSync(resolve(dirname(entry), target)))
    expect(dangling).toEqual([])
  })
})
