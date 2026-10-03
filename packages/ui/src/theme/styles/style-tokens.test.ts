import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join, sep } from "node:path"

// Every control and chrome token has its base value in @layer base, and only
// the unlayered style files under theme/styles/ override it, so a style file
// wins over a base value whatever their specificity. An unlayered declaration
// anywhere else would compete with the style files on specificity and source
// order instead of losing to them outright. jsdom never parses CSS, so the
// source text is what this asserts.

const CONTROL_TOKENS = [
  "--btn-edge",
  "--btn-sheen",
  "--btn-shadow",
  "--btn-neutral-edge",
  "--btn-neutral-sheen",
  "--btn-neutral-shadow",
  "--field-shadow",
  "--check-well-shadow",
  "--thumb-shadow",
  "--selected-view-shadow",
]

const CHROME_TOKENS = [
  "--chrome-rail-bg",
  "--chrome-bar-bg",
  "--chrome-edge",
  "--chrome-shadow",
  "--chrome-backdrop",
  "--chrome-canvas",
]

/** The overlay inputs a style may set; theme.css composes the rest. */
const OVERLAY_TOKENS = [
  "--surface-overlay-layers",
  "--surface-overlay-base",
  "--surface-overlay-blend-mode",
  "--overlay-border",
  "--overlay-shadow",
  "--overlay-backdrop",
]

const CONTRACT = [
  ...CONTROL_TOKENS,
  ...CHROME_TOKENS,
  ...OVERLAY_TOKENS,
  "--shadow-dropdown",
]

/**
 * The surface prop recomposes these on the element that carries it
 * (`[data-surface-fill]` in theme.css), outside @layer base: a custom
 * property that reads another resolves where it is declared, so a :root
 * value would keep <html>'s fill. None of them is a contract token.
 */
const RECOMPOSED_BY_SURFACE_PROP = [
  "--overlay-bg",
  "--surface-overlay-bg",
  "--surface-card-fill",
  "--surface-popover-fill",
  "--surface-raised-fill",
  "--surface-overlay-fill",
  "--surface-card-fill-opaque",
]

/**
 * The inset and flat shell styles clear or tone the chrome by rebinding its
 * fill tokens on the region element, so they hold under every style.
 */
const SHELL_STYLES = join("src", "layout", "shell", "shell-styles.css")
const SHELL_STYLE_REBINDS = [
  "--chrome-rail-bg",
  "--chrome-bar-bg",
  "--chrome-canvas",
]

interface Declaration {
  path: string
  /** At-rule and selector preludes, outermost first. */
  context: string[]
  property: string
  value: string
}

/**
 * Every custom-property declaration in a stylesheet with the blocks it sits
 * in. Comments are dropped; a semicolon or brace inside a string or inside
 * parentheses (a data: URL) splits nothing.
 */
function declarations(path: string): Declaration[] {
  const source = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
  const found: Declaration[] = []
  const context: string[] = []
  let text = ""
  let quote = ""
  let parens = 0
  const flush = () => {
    const match = /^\s*(--[\w-]+)\s*:([\s\S]*)$/.exec(text)
    if (match) {
      found.push({
        path,
        context: [...context],
        property: match[1] as string,
        value: (match[2] as string).replace(/\s+/g, " ").trim(),
      })
    }
    text = ""
  }
  for (const ch of source) {
    if (quote) {
      text += ch
      if (ch === quote) quote = ""
    } else if (ch === '"' || ch === "'") {
      quote = ch
      text += ch
    } else if (ch === "(" || ch === ")") {
      parens += ch === "(" ? 1 : -1
      text += ch
    } else if (parens > 0) {
      text += ch
    } else if (ch === "{") {
      context.push(text.replace(/\s+/g, " ").trim())
      text = ""
    } else if (ch === "}") {
      flush()
      context.pop()
    } else if (ch === ";") {
      flush()
    } else {
      text += ch
    }
  }
  return found
}

function stylesheets(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return stylesheets(path)
    return entry.name.endsWith(".css") ? [path] : []
  })
}

const THEME = join("src", "styles", "theme.css")
const STYLES_DIR = join("src", "theme", "styles") + sep
const SHEETS = stylesheets("src")
const KIT_SHEETS = SHEETS.filter((path) => !path.startsWith(STYLES_DIR))

const LIGHT_BASE = ["@layer base", ":root"]
const DARK_BASE = ["@layer base", ':root[data-mode="dark"]']

function sameContext(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((item, i) => item === b[i])
}

function where(d: Declaration): string {
  return `${d.property} in ${d.context.join(" > ") || "(top level)"} (${d.path})`
}

describe("contract base values", () => {
  const base = declarations(THEME)

  it.each(CONTRACT)("declares %s for light on the layered :root", (token) => {
    expect(
      base.some(
        (d) => d.property === token && sameContext(d.context, LIGHT_BASE),
      ),
    ).toBe(true)
  })

  // Only the control tokens differ by mode at their base.
  it.each(CONTROL_TOKENS)(
    "declares %s for dark in the layered dark block",
    (token) => {
      expect(
        base.some(
          (d) => d.property === token && sameContext(d.context, DARK_BASE),
        ),
      ).toBe(true)
    },
  )
})

describe("where contract tokens are declared", () => {
  const kit = KIT_SHEETS.flatMap(declarations)

  it("reads the kit stylesheets", () => {
    expect(KIT_SHEETS).toContain(THEME)
    expect(KIT_SHEETS).toContain(SHELL_STYLES)
  })

  it("declares a contract token outside theme/styles only inside @layer base", () => {
    const offenders = kit
      .filter((d) => CONTRACT.includes(d.property))
      .filter((d) => d.context[0] !== "@layer base")
      .filter(
        (d) =>
          !(
            d.path === SHELL_STYLES && SHELL_STYLE_REBINDS.includes(d.property)
          ),
      )
      .map(where)
    expect(offenders).toEqual([])
  })

  it("sets a control token outside theme/styles only as a light or dark base value", () => {
    const offenders = kit
      .filter((d) => CONTROL_TOKENS.includes(d.property))
      .filter(
        (d) =>
          d.path !== THEME ||
          !(
            sameContext(d.context, LIGHT_BASE) ||
            sameContext(d.context, DARK_BASE)
          ),
      )
      .map(where)
    expect(offenders).toEqual([])
  })

  it("lets the surface prop recompose only its named fills", () => {
    const recomposed = declarations(THEME).filter((d) =>
      d.context.some((c) => c.startsWith("[data-surface-fill=")),
    )
    expect(recomposed.length).toBeGreaterThan(0)
    expect(
      recomposed
        .map((d) => d.property)
        .filter((name) => !RECOMPOSED_BY_SURFACE_PROP.includes(name)),
    ).toEqual([])
    expect(
      RECOMPOSED_BY_SURFACE_PROP.filter((name) => CONTRACT.includes(name)),
    ).toEqual([])
  })
})
