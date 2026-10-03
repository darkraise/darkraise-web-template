import { describe, it, expect } from "vitest"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { STYLE_NAMES } from "@theme/styles"

// A `[data-style="x"]` selector (in CSS, or in a TS selector string) naming a
// style that does not exist can never match. It still ships in the build.
// jsdom never parses CSS, so the source text is what this asserts.
function everySourceFile(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return everySourceFile(path)
    if (/\.(test|stories)\.tsx?$/.test(entry.name)) return []
    return /\.(css|ts|tsx)$/.test(entry.name) ? [path] : []
  })
}

describe("style-scoped selectors", () => {
  it("only reference styles that exist", () => {
    const live = new Set<string>(STYLE_NAMES)
    const offenders: string[] = []
    for (const path of everySourceFile("src")) {
      const source = readFileSync(path, "utf8")
      for (const match of source.matchAll(
        /\[data-style=(["'])([a-z][a-z0-9-]*)\1\]/g,
      )) {
        const name = match[2]
        if (name && !live.has(name)) offenders.push(`${path}: ${name}`)
      }
    }
    expect(offenders).toEqual([])
  })

  // Style stylesheets are imported by hand, because `theme/styles/` sits
  // outside the component auto-scanner. Deleting one therefore leaves a dangling
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
