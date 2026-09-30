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

function stylesheets(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return stylesheets(path)
    return entry.name.endsWith(".css") ? [path] : []
  })
}

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
