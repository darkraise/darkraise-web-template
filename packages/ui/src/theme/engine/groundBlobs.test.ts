import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { cssRules } from "../../test/css-rules"
import { stripCssComments } from "../../test/strip-css-comments"
import {
  GROUND_BLOB,
  GROUND_BLOB_HUES,
  GROUND_CHROMA_OFFSET,
  GROUND_TINT,
  groundColours,
} from "./groundBlobs"
import { hslStringToOklch } from "./oklch"

// Indigo's light primary, as the engine paints it.
const INDIGO = "239 84% 67%"
// The neutral accent's primary over the cool neutral: chroma 0.021.
const NEUTRAL = "210 30% 11%"

const degrees = (hsl: string) => (hslStringToOklch(hsl).h * 180) / Math.PI
/** Signed distance from one hue to another, in (-180, 180]. */
const turn = (from: number, to: number) => ((to - from + 540) % 360) - 180

describe("ground colours", () => {
  it.each(["light", "dark"] as const)(
    "turns the %s blobs from the accent hue in constant order",
    (mode) => {
      const { blobs } = groundColours(INDIGO, mode)
      const accent = degrees(INDIGO)
      expect(blobs).toHaveLength(GROUND_BLOB_HUES.length)
      blobs.forEach((blob, i) => {
        const wanted = accent + (GROUND_BLOB_HUES[i] as number)
        expect(Math.abs(turn(wanted, degrees(blob))), blob).toBeLessThan(6)
        const { L, C } = hslStringToOklch(blob)
        expect(L, blob).toBeCloseTo(GROUND_BLOB[mode].l, 1)
        expect(C, blob).toBeLessThanOrEqual(GROUND_BLOB[mode].c + 0.005)
        expect(C, blob).toBeGreaterThan(0.02)
      })
    },
  )

  it.each(["light", "dark"] as const)(
    "tints the %s ground towards the accent hue's turn",
    (mode) => {
      const { tint } = groundColours(INDIGO, mode)
      const wanted = degrees(INDIGO) + GROUND_TINT.hue
      expect(Math.abs(turn(wanted, degrees(tint)))).toBeLessThan(10)
      expect(hslStringToOklch(tint).L).toBeCloseTo(GROUND_TINT[mode].l, 1)
    },
  )

  it.each(["light", "dark"] as const)(
    "paints grey %s blobs and tint under the neutral accent",
    (mode) => {
      const { blobs, tint } = groundColours(NEUTRAL, mode)
      expect(hslStringToOklch(NEUTRAL).C).toBeGreaterThan(0.02)
      for (const colour of [...blobs, tint]) {
        expect(colour).toMatch(/^\d+ 0% \d+%$/)
      }
    },
  )
})

const SUPPORTS = "@supports (color: oklch(from red l c h))"
const RULES = cssRules(
  stripCssComments(readFileSync("src/styles/theme.css", "utf8")),
)

/** `name` as the guarded rule `selector` declares it, prettier's wrapping undone. */
function declared(selector: string, name: string): string | undefined {
  const rule = RULES.find(
    (r) =>
      r.selector.trim() === selector &&
      r.wrappers.join(" > ") === `@layer base > ${SUPPORTS}`,
  )
  if (!rule) throw new Error(`no ${selector} rule under ${SUPPORTS}`)
  return new RegExp(`(?:^|;)\\s*${name}:([^;]*);`)
    .exec(rule.body)?.[1]
    ?.replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
}

const hue = (by: number) =>
  by === 0 ? "h" : by > 0 ? `calc(h + ${by})` : `calc(h - ${-by})`

const relative = (l: number, c: number, by: number) =>
  `oklch(from hsl(var(--primary)) ${l} clamp(0, c - ${GROUND_CHROMA_OFFSET}, ${c}) ${hue(by)})`

describe("ground colours in theme.css", () => {
  it.each([
    [":root", "light"],
    [':root[data-mode="dark"]', "dark"],
  ] as const)(
    "declares %s's blobs and tint from the constants",
    (selector, mode) => {
      GROUND_BLOB_HUES.forEach((by, i) => {
        expect(declared(selector, `--ground-blob-${i + 1}`)).toBe(
          relative(GROUND_BLOB[mode].l, GROUND_BLOB[mode].c, by),
        )
      })
      expect(declared(selector, "--ground-tint")).toBe(
        relative(GROUND_TINT[mode].l, GROUND_TINT[mode].c, GROUND_TINT.hue),
      )
    },
  )

  // Unguarded, a browser without relative colour syntax would hold an
  // invalid value and paint no background at all where a reader uses one.
  it("declares them nowhere outside the relative-colour guard", () => {
    expect(
      RULES.filter(
        (r) =>
          !r.wrappers.includes(SUPPORTS) &&
          /--ground-(?:blob-\d|tint)\s*:/.test(r.body),
      ).map((r) => r.selector.trim()),
    ).toEqual([])
  })
})
