import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { PRESET_NAMES } from "@theme/presets"

// A `[data-preset="x"]` selector naming a preset that no longer exists can
// never match, but still ships in dist/styles.css. jsdom never parses CSS, so
// the source text is what this asserts.
function everyStylesheet(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return everyStylesheet(path)
    return entry.name.endsWith(".css") ? [path] : []
  })
}

describe("preset-scoped selectors", () => {
  it("only reference presets that still exist", () => {
    const live = new Set<string>(PRESET_NAMES)
    const offenders: string[] = []
    for (const path of everyStylesheet("src")) {
      const css = readFileSync(path, "utf8")
      for (const match of css.matchAll(/\[data-preset="([^"]+)"\]/g)) {
        const name = match[1]
        if (name && !live.has(name)) offenders.push(`${path}: ${name}`)
      }
    }
    expect(offenders).toEqual([])
  })
})
