import { describe, it, expect } from "vitest"
import { globSync, readFileSync } from "node:fs"

// Lightning CSS treats `backdrop-filter` and `-webkit-backdrop-filter` as one
// prefixed group. When the UNPREFIXED declaration comes first it collapses the
// pair to the webkit-only form at every compilation target — even with
// minification off — so a consumer whose pipeline runs Lightning CSS loses the
// standard declaration entirely and every glass surface renders unblurred.
// Emitting the prefixed declaration first makes the pair survive.
//
// Files are resolved from the vitest project root (packages/ui), which is
// process.cwd() when the suite runs.

/**
 * Property names of every declaration in a stylesheet, in source order, with
 * a "}" token at each block boundary so two declarations in *different* rules
 * are never read as adjacent.
 */
function declaredProperties(css: string): string[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "")
  return [
    ...withoutComments.matchAll(/(?:(^|[;{}])\s*(-?[\w-]+)\s*:)|(\})/g),
  ].map((match) => match[3] ?? match[2])
}

function stylesheets(): { file: string; properties: string[] }[] {
  const files = globSync("src/**/*.css", { cwd: process.cwd() })
  return files.map((file) => ({
    file,
    properties: declaredProperties(readFileSync(file, "utf8")),
  }))
}

describe("backdrop-filter declaration order", () => {
  it("finds stylesheets to check", () => {
    const sheets = stylesheets()
    expect(sheets.length).toBeGreaterThan(0)
    expect(sheets.some((s) => s.properties.includes("backdrop-filter"))).toBe(
      true,
    )
  })

  it("never declares backdrop-filter before its -webkit- counterpart", () => {
    const offenders: string[] = []
    for (const { file, properties } of stylesheets()) {
      properties.forEach((property, i) => {
        if (property !== "backdrop-filter") return
        if (properties[i + 1] === "-webkit-backdrop-filter") {
          offenders.push(file)
        }
      })
    }
    expect(offenders).toEqual([])
  })

  it("pairs every backdrop-filter with a preceding -webkit- declaration", () => {
    const offenders: string[] = []
    for (const { file, properties } of stylesheets()) {
      properties.forEach((property, i) => {
        if (property !== "backdrop-filter") return
        if (properties[i - 1] !== "-webkit-backdrop-filter") {
          offenders.push(file)
        }
      })
    }
    expect(offenders).toEqual([])
  })
})
