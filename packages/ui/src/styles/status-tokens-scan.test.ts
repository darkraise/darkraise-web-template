import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

// import.meta.dirname is how primary-fill-migration.test.ts reaches the repo too.
const ROOT = join(import.meta.dirname, "..", "..", "..", "..")
const DIRS = [
  "packages/ui/src",
  "packages/ui/.storybook",
  "packages/ui/scripts",
  "scripts",
  "apps/template/src",
  "create-app/bin",
]
// The lookbehind skips BEM modifiers such as `.dr-toast--success`.
const TOKEN =
  /(?<![\w-])--(destructive|success|warning|info)(-foreground)?(?![\w-])|--status-tint\b/
const UTILITY =
  /\b(bg|text|border|ring|outline|from|to|fill|stroke)-(destructive|success|warning|info)(?!-(subtle|edge|text|solid)\b)(-foreground)?(\/\d+)?\b/
const REMOVED_AXES =
  /\b(surfaceIntensity|controlDepth|borderIntensity|accentIntensity)\b|data-(surface-intensity|control-depth|border-intensity|accent-intensity)/

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (name === "node_modules" || name === "dist") return []
    if (statSync(path).isDirectory()) return files(path)
    // Tests are skipped: several assert on purpose that a removed name is absent.
    return /\.(css|ts|tsx|mjs|json)$/.test(name) && !/\.test\.tsx?$/.test(name)
      ? [path]
      : []
  })
}

describe("removed status tokens and axes", () => {
  it("are not referenced anywhere", () => {
    const hits: string[] = []
    for (const dir of DIRS)
      for (const file of files(join(ROOT, dir)))
        readFileSync(file, "utf8")
          .split("\n")
          .forEach((line, i) => {
            if (
              TOKEN.test(line) ||
              UTILITY.test(line) ||
              REMOVED_AXES.test(line)
            )
              hits.push(
                `${file.slice(ROOT.length + 1)}:${i + 1}: ${line.trim()}`,
              )
          })
    expect(hits).toEqual([])
  })
})
