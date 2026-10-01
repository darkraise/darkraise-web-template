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
  "0s",
  "0.01ms", // the reduced-motion guard
])

/**
 * Declarations kept off the ladder on purpose, as [file suffix, text in the
 * declaration, reason].
 */
const EXEMPT_DECLARATIONS: Array<[string, string, string]> = [
  [
    "image-editor/image-editor.css",
    "filter 80ms",
    "the live filter preview tracks a slider drag and must lag it by one frame at most",
  ],
]

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

  it("has no raw duration literal in a transition or animation", () => {
    const offenders: string[] = []
    for (const path of everyStylesheet()) {
      const css = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
      for (const decl of css.matchAll(
        /(?<![\w-])(?:transition|transition-duration|animation|animation-duration)\s*:\s*([^;]+);/g,
      )) {
        const exempt = EXEMPT_DECLARATIONS.some(
          ([file, text]) => path.endsWith(file) && decl[0].includes(text),
        )
        if (exempt) continue
        for (const literal of (decl[1] as string).matchAll(
          /(?<![\w.-])(\d*\.?\d+m?s)(?![\w-])/g,
        )) {
          if (ALLOWED_LITERALS.has(literal[1] as string)) continue
          offenders.push(`${literal[1]} in ${path}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it("uses no duration utilities, timed arbitrary animations or transition-all", () => {
    const offenders: string[] = []
    for (const path of everyStylesheet()) {
      const css = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
      for (const match of css.matchAll(
        /(?<![\w-])duration-\d+(?![\w-])|animate-\[[^\]]*\d+m?s[^\]]*\]|(?<![\w-])transition-all(?![\w-])|(?<![\w-])transition\s*:\s*all(?![\w-])/g,
      )) {
        offenders.push(`${match[0]} in ${path}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it("eases with the kit's curves, not CSS keywords", () => {
    // Keyword `ease-out` is cubic-bezier(0, 0, 0.58, 1), far softer than
    // --ease-out, and Tailwind's `ease-*` utilities already resolve to the
    // kit's curves, so one word meant two curves depending on where it was
    // written. `linear` stays allowed: progress, spinner and shimmer motion
    // is constant-rate on purpose.
    const offenders: string[] = []
    for (const path of everyStylesheet()) {
      const css = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
      for (const decl of css.matchAll(
        /(?<![\w-])(?:transition|transition-timing-function|animation|animation-timing-function)\s*:\s*([^;]+);/g,
      )) {
        for (const keyword of (decl[1] as string).matchAll(
          /(?<![\w-])ease(?:-in-out|-in|-out)?(?![\w-])/g,
        )) {
          offenders.push(`${keyword[0]} in ${path}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it("uses no duration utilities, transition-all or bare transition in TSX class strings", () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name)
        if (entry.isDirectory()) {
          return EXEMPT_DIRS.has(entry.name) ? [] : walk(path)
        }
        return /\.tsx?$/.test(entry.name) &&
          !/\.(test|stories)\.tsx?$/.test(entry.name)
          ? [path]
          : []
      })
    const offenders: string[] = []
    for (const path of walk("src")) {
      const source = readFileSync(path, "utf8")
      for (const literal of source.matchAll(/"[^"\n]*"|'[^'\n]*'|`[^`]*`/g)) {
        for (const match of literal[0].matchAll(
          /(?<![\w-])(?:duration-\d+|transition-all|transition)(?![\w-])/g,
        )) {
          offenders.push(`${match[0]} in ${path}`)
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
