import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

// Every overlay in the kit animates through tw-animate-css, which ships no
// reduced-motion guard, so the preference has to be honoured centrally. The
// guard is the single sanctioned use of `!important` in the package: a
// universal selector sits at specificity 0,0,0 and cannot otherwise outrank
// the component rules it exists to neutralise.
//
// Both halves of that deal are pinned here — the guard must exist, and it must
// stay the only place `!important` appears in a declaration.

function everyStylesheet(): string[] {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) return walk(path)
      return entry.name.endsWith(".css") ? [path] : []
    })
  return walk("src")
}

function withoutComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "")
}

describe("reduced motion", () => {
  const theme = readFileSync("src/styles/theme.css", "utf8")

  it("neutralises animation, transition and scroll globally", () => {
    const guard =
      /@media \(prefers-reduced-motion: reduce\) \{\s*\*,\s*\*::before,\s*\*::after \{([^}]*)\}/.exec(
        theme,
      )
    expect(
      guard,
      "no universal prefers-reduced-motion guard in theme.css",
    ).not.toBeNull()
    const body = guard?.[1] ?? ""
    expect(body).toMatch(/animation-duration:\s*0\.01ms\s*!important/)
    expect(body).toMatch(/animation-iteration-count:\s*1\s*!important/)
    expect(body).toMatch(/transition-duration:\s*0\.01ms\s*!important/)
    expect(body).toMatch(/scroll-behavior:\s*auto\s*!important/)
  })

  it("keeps the guard unlayered so it outranks @layer overrides", () => {
    // A guard written inside a cascade layer would be beaten by any unlayered
    // preset rule, which is exactly what the presets use.
    const guardAt = theme.search(
      /@media \(prefers-reduced-motion: reduce\) \{\s*\*,/,
    )
    expect(guardAt).toBeGreaterThan(-1)
    const overridesAt = theme.indexOf("@layer overrides {")
    expect(
      guardAt,
      "the guard must come after @layer overrides in source order",
    ).toBeGreaterThan(overridesAt)
  })

  it("is the only !important in the package", () => {
    const offenders: string[] = []
    for (const path of everyStylesheet()) {
      const css = withoutComments(readFileSync(path, "utf8"))
      if (!css.includes("!important")) continue
      if (path.replace(/\\/g, "/") === "src/styles/theme.css") continue
      offenders.push(path)
    }
    expect(offenders).toEqual([])
  })

  it("uses !important in theme.css only inside the guard", () => {
    const css = withoutComments(theme)
    const total = css.match(/!important/g)?.length ?? 0
    expect(total).toBe(4)
  })
})
