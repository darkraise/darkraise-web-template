import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

/**
 * `text-primary` paints `--primary`, which only clears 3:1: fine for a
 * graphic, not for text. These two keep it because what they colour is a
 * graphic.
 */
const GRAPHICS = new Map([
  ["src/components/spinner/spinner.css", "the spinner's stroke is a graphic"],
  ["src/components/radio-group/radio-group.css", "the radio dot is a graphic"],
])

/**
 * `color: hsl(var(--primary))` declarations that colour a graphic, as
 * [file, text in the selector, reason].
 */
const GRAPHIC_DECLARATIONS: Array<[string, string, string]> = [
  [
    "src/layout/sidebar/sidebar-nav.css",
    ".dr-sidebar-nav-icon-svg",
    "the active nav icon is a graphic",
  ],
]

/** A ::before or ::after glyph is decoration, not text a reader must read. */
const PSEUDO = /::(?:before|after)\s*$/

function filesUnder(dir: string, test: (name: string) => boolean): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return filesUnder(path, test)
    return test(entry.name) ? [path] : []
  })
}

const stylesheets = (dir: string) =>
  filesUnder(dir, (name) => name.endsWith(".css"))

describe("primary-coloured text", () => {
  it("uses text-primary-text outside the graphic exemptions", () => {
    const offenders: string[] = []
    for (const path of [
      ...stylesheets("src/components"),
      ...stylesheets("src/layout"),
    ]) {
      if (GRAPHICS.has(path)) continue
      const css = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
      for (const match of css.matchAll(/(?<![\w-])text-primary(?![\w-])/g)) {
        offenders.push(`${path} at ${match.index}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it("colours no text with a raw --primary declaration", () => {
    const offenders: string[] = []
    for (const path of [
      ...stylesheets("src/components"),
      ...stylesheets("src/layout"),
      ...stylesheets("src/theme/presets"),
    ]) {
      const css = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
      for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (
          !/(?<![\w-])color:\s*hsl\(var\(--primary\)/.test(rule[2] as string)
        ) {
          continue
        }
        const selector = (rule[1] as string).trim()
        const exempt =
          selector.split(",").every((part) => PSEUDO.test(part.trim())) ||
          GRAPHIC_DECLARATIONS.some(
            ([file, text]) => path === file && selector.includes(text),
          )
        if (!exempt) offenders.push(`${selector} in ${path}`)
      }
    }
    expect(offenders).toEqual([])
  })

  // Text colours are solved to 4.5:1 at full strength; an alpha lets the
  // ground through and undoes the solve.
  it("never dims a solved text colour with an alpha", () => {
    const offenders: string[] = []
    for (const path of [
      ...stylesheets("src/components"),
      ...stylesheets("src/layout"),
      ...stylesheets("src/theme/presets"),
    ]) {
      const css = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
      for (const match of css.matchAll(
        /(?<![\w-])color:\s*hsl\(var\(--(?:primary-text|primary|success|warning|info|destructive)\)\s*\/\s*[\d.]+\)/g,
      )) {
        offenders.push(`${match[0]} in ${path}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it("uses no text-primary in component class strings", () => {
    const offenders: string[] = []
    const sources = filesUnder(
      "src",
      (name) => /\.tsx?$/.test(name) && !/\.(test|stories)\.tsx?$/.test(name),
    )
    for (const path of sources) {
      const source = readFileSync(path, "utf8")
      for (const literal of source.matchAll(/"[^"\n]*"|'[^'\n]*'|`[^`]*`/g)) {
        if (/(?<![\w-])text-primary(?![\w-])/.test(literal[0])) {
          offenders.push(`${literal[0]} in ${path}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it("glass paints its accent text with --primary-text", () => {
    const glass = readFileSync("src/theme/presets/glass/glass.ts", "utf8")
    expect(glass).toContain(
      `tokens["--accent-foreground"] = "var(--primary-text)"`,
    )
    expect(glass).toContain(
      `tokens["--secondary-foreground"] = "var(--primary-text)"`,
    )
  })
})
