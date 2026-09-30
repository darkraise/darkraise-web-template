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
    ]) {
      const css = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
      for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (!/(?<![\w-])color:\s*hsl\(var\(--primary\)/.test(rule[2] as string)) {
          continue
        }
        const selector = (rule[1] as string).trim()
        const exempt = GRAPHIC_DECLARATIONS.some(
          ([file, text]) => path === file && selector.includes(text),
        )
        if (!exempt) offenders.push(`${selector} in ${path}`)
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

  it("glass and sci-fi paint their accent text with --primary-text", () => {
    const glass = readFileSync("src/theme/presets/glass/glass.ts", "utf8")
    expect(glass).toContain(`tokens["--accent-foreground"] = "var(--primary-text)"`)
    expect(glass).toContain(
      `tokens["--secondary-foreground"] = "var(--primary-text)"`,
    )
    const scifi = readFileSync("src/theme/presets/scifi/scifi.ts", "utf8")
    expect(scifi).toContain(`"--accent-foreground": "var(--primary-text)"`)
    expect(scifi).toContain(`"--secondary-foreground": "var(--primary-text)"`)
  })
})
