import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

// The kit had token axes for colour, density, radius, elevation, font size,
// glow and surface intensity — and none for motion. Durations were written as
// literals and drifted accordingly.
//
// Two families sit outside the ladder on purpose:
//
//   Ambient motion (background blobs, marquee) is measured in seconds and has
//   nothing to do with interaction timing.
//
//   Toast choreography tunes its enter and exit against each other — exit
//   deliberately shorter than enter — rather than against this scale.

const EXEMPT_DIRS = new Set(["background-page", "marquee", "sonner"])

/** Literals that are not durations on the ladder and never should be. */
const ALLOWED_LITERALS = new Set([
  "0ms", // an instant transition is the absence of one, not a tier
  "0.01ms", // the reduced-motion guard
])

function everyStylesheet(): string[] {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) {
        return EXEMPT_DIRS.has(entry.name) ? [] : walk(path)
      }
      return entry.name.endsWith(".css") ? [path] : []
    })
  return [
    ...walk("src/components"),
    ...walk("src/layout"),
    "src/styles/theme.css",
  ]
}

describe("motion ladder", () => {
  const theme = readFileSync("src/styles/theme.css", "utf8")

  it("defines the duration tiers", () => {
    expect(theme).toMatch(/--duration-fast:\s*150ms/)
    expect(theme).toMatch(/--duration-normal:\s*200ms/)
    expect(theme).toMatch(/--duration-slow:\s*300ms/)
    expect(theme).toMatch(/--duration-slower:\s*500ms/)
  })

  it("defines easing for arrival and departure", () => {
    expect(theme).toMatch(/--ease-out:\s*cubic-bezier/)
    expect(theme).toMatch(/--ease-in:\s*cubic-bezier/)
    expect(theme).toMatch(/--ease-in-out:\s*cubic-bezier/)
  })

  it("has no raw 150ms or 200ms left in a transition or animation", () => {
    // These two carry most of the kit's motion; leaving any behind means the
    // ladder describes the code rather than governing it.
    const offenders: string[] = []
    for (const path of everyStylesheet()) {
      const css = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
      for (const decl of css.matchAll(
        /(?:transition|animation)(?:-duration)?\s*:\s*([^;]+);/g,
      )) {
        for (const literal of decl[1].matchAll(
          /(?<![\w.-])(150ms|200ms)(?![\w-])/g,
        )) {
          offenders.push(`${literal[1]} in ${path}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it("keeps the reduced-motion guard on literals, not tokens", () => {
    // The guard has to win against whatever the ladder resolves to, so it
    // cannot be expressed in terms of it.
    const guard =
      /@media \(prefers-reduced-motion: reduce\) \{[\s\S]{0,400}?animation-duration:\s*([^;]+);/.exec(
        theme,
      )
    expect(guard?.[1]).toContain("0.01ms")
    expect(ALLOWED_LITERALS.has("0.01ms")).toBe(true)
  })
})
