import { describe, it, expect } from "vitest"
import { globSync, readFileSync } from "node:fs"

// `data-elevation` is the theme axis on <html>. A component that reuses the
// name matches theme.css's unscoped [data-elevation="…"] ramps and redefines
// --elevation-* for everything inside it, so in dark mode an elevated card's
// content got the light ramp. Components use data-card-elevation instead.
const OWNERS = new Set([
  "src/styles/theme.css",
  "src/theme/theme-provider/ThemeProvider.tsx",
  "src/theme/axes/registry.ts",
])

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
}

describe("data-elevation attribute", () => {
  it("is used only by the theme axis owners", () => {
    const files = globSync("src/**/*.{css,ts,tsx}", { cwd: process.cwd() })
      .map((file) => file.replace(/\\/g, "/"))
      .filter((file) => !/\.(test|stories)\.tsx?$/.test(file))
    expect(files.length).toBeGreaterThan(0)
    const offenders = files.filter(
      (file) =>
        !OWNERS.has(file) &&
        /data-elevation\b/.test(withoutComments(readFileSync(file, "utf8"))),
    )
    expect(offenders).toEqual([])
  })
})
