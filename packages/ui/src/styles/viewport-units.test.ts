import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import { describe, it, expect } from "vitest"

const SRC = resolve(process.cwd(), "src")

function cssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return cssFiles(full)
    return full.endsWith(".css") ? [full] : []
  })
}

// Blanks out block comments while preserving the line count, so prose that
// names the unit it is warning about does not trip the rule.
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, (match) =>
    "\n".repeat((match.match(/\n/g) ?? []).length),
  )
}

describe("viewport height units", () => {
  it("uses dvh rather than vh for full-height boxes", () => {
    // 100vh excludes the iOS Safari URL bar, so a full-height box sits partly
    // behind it. dvh tracks the visible viewport instead.
    const offenders = cssFiles(SRC)
      .map((file) => ({
        file: relative(SRC, file),
        lines: stripComments(readFileSync(file, "utf8"))
          .split("\n")
          .map((line, i) => ({ line, n: i + 1 }))
          .filter(({ line }) => /\b(?:min-)?h-screen\b|\b100vh\b/.test(line))
          .map(({ n }) => n),
      }))
      .filter(({ lines }) => lines.length > 0)
      .map(({ file, lines }) => `${file}: ${lines.join(", ")}`)

    expect(offenders).toEqual([])
  })
})
