import { describe, it, expect } from "vitest"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
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

  // Preset stylesheets are imported by hand, because `presets/` sits outside
  // the component auto-scanner. Deleting a preset therefore leaves a dangling
  // `@import` that no selector scan can see — it surfaces only as an ENOENT
  // part-way through `tsup`, long after the unit suite has gone green.
  it("imports only stylesheets that exist", () => {
    const entry = "src/styles/theme.css"
    const css = readFileSync(entry, "utf8")
    const dangling: string[] = []
    for (const match of css.matchAll(/@import\s+"([^"]+\.css)"/g)) {
      const target = match[1]
      if (!target) continue
      const path = resolve(dirname(entry), target)
      if (!existsSync(path)) dangling.push(target)
    }
    expect(dangling).toEqual([])
  })
})
