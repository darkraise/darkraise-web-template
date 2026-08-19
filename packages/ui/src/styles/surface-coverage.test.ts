import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

// The surfaceIntensity axis moves four fill tokens. A component that paints a
// surface from the raw `--card` / `--popover` token instead of the fill bypasses
// the axis silently: it looks right at the default step and stops responding at
// every other one.
//
// The audit that produced this test found no genuine bypasses. `bg-card` and
// `bg-popover` are safe because `@theme inline` aliases `--color-card` and
// `--color-popover` to the fills, so the utilities already route through the
// axis. This test exists to keep that true — it is cheap, and the failure mode
// is invisible without it.
function everyComponentStylesheet(): string[] {
  const roots = ["src/components", "src/layout"]
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) return walk(path)
      return entry.name.endsWith(".css") ? [path] : []
    })
  return roots.flatMap(walk)
}

function withoutComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "")
}

describe("surfaceIntensity coverage", () => {
  it("routes the card and popover utilities through the axis-aware fills", () => {
    const theme = readFileSync("src/styles/theme.css", "utf8")
    expect(theme).toMatch(/--color-card:\s*var\(--surface-card-fill\)/)
    expect(theme).toMatch(/--color-popover:\s*var\(--surface-popover-fill\)/)
  })

  it("has no component painting a surface from the raw token", () => {
    const offenders: string[] = []
    for (const path of everyComponentStylesheet()) {
      const css = withoutComments(readFileSync(path, "utf8"))
      for (const token of ["--card", "--popover"]) {
        // `hsl(var(--card))` paints the unwashed colour. The opaque twin
        // `--surface-card-fill-opaque` is the sanctioned escape hatch for
        // surfaces that must stay opaque, and it still tracks the axis.
        const raw = new RegExp(`hsl\\(var\\(\\${token}\\)\\)`)
        if (raw.test(css)) offenders.push(`${path}: hsl(var(${token}))`)
      }
    }
    expect(offenders).toEqual([])
  })
})
