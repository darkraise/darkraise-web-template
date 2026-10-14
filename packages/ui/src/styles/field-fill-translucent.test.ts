import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { composite } from "../theme/engine/oklch"
import { cssRules } from "../test/css-rules"
import { stripCssComments } from "../test/strip-css-comments"

// fieldFill: translucent derives the field from --surface-alpha, so a field
// thins with the Transparency step and paints what fieldFill: surface paints
// (the opaque card) once the kit's more-contrast fallback sets the alpha to
// 1. At base Glass's Medium alphas (0.55 light, 0.60 dark) it paints what
// the rule painted when it was a fixed value: the card at 0.6 in light
// mode, a 6% foreground wash in dark mode. jsdom
// computes no calc() or colour, so the declarations are evaluated here and
// composited with the engine's sRGB maths.

const THEME = join("src", "styles", "theme.css")
const RELATIVE = "@supports (color: hsl(from red h s l / 0.5))"
const LIGHT = '[data-field-fill="translucent"]'
const DARK = '[data-mode="dark"][data-field-fill="translucent"]'
const CONTAINERS = [
  ".dr-card",
  ".dr-dialog-content",
  ".dr-sheet-content",
  ".dr-drawer-content",
  ".dr-popover-content",
  ".dr-floating-panel",
]
const MEDIUM = { light: 0.55, dark: 0.6 }

// A light and a dark card, their text, and grounds a card can sit over: the
// page, a saturated gradient peak, black and white.
const CARD = { light: "0 0% 100%", dark: "240 6% 10%" }
const FOREGROUND = { light: "240 10% 4%", dark: "0 0% 98%" }
const GROUNDS = ["240 5% 96%", "262 83% 58%", "0 0% 0%", "0 0% 100%"]

function normalise(text: string): string {
  return text.replace(/\s+/g, " ").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")")
}

/** The declarations of the one rule whose selector list is exactly `head`'s. */
function declarationsOf(head: string, wrappers: string[]) {
  const selectors = [head, `${head} :is(${CONTAINERS.join(", ")})`]
  const matches = cssRules(
    stripCssComments(readFileSync(THEME, "utf8")),
  ).filter(
    (rule) =>
      rule.wrappers.join(" | ") === wrappers.join(" | ") &&
      normalise(rule.selector)
        .split(/,(?![^(]*\))/)
        .map((part) => part.trim())
        .join(" | ") === selectors.join(" | "),
  )
  expect(
    matches,
    `${head} in ${wrappers.join(" | ") || "(top level)"}`,
  ).toHaveLength(1)
  const declarations: Record<string, string> = {}
  for (const text of (matches[0]?.body ?? "").split(/;(?![^(]*\))/)) {
    const match = /^\s*(--[\w-]+)\s*:([\s\S]*)$/.exec(text)
    if (match)
      declarations[match[1] as string] = normalise(match[2] as string).trim()
  }
  return declarations
}

/** Evaluates a CSS math expression over the named custom properties. */
function evaluate(expression: string, values: Record<string, number>): number {
  let js = expression
  for (const [name, value] of Object.entries(values)) {
    js = js.split(`var(${name})`).join(`(${value})`)
  }
  js = js
    .replace(/\bcalc\(/g, "(")
    .replace(/\b(max|min)\(/g, "Math.$1(")
    .replace(/(\d)%/g, "$1")
  expect(js, `unresolved part in ${expression}`).toMatch(
    /^[\d\s.+\-*/(),]*(?:(?:Math\.(?:max|min)|clamp)[\d\s.+\-*/(),]*)*$/,
  )
  const clamp = (low: number, value: number, high: number) =>
    Math.min(Math.max(value, low), high)
  return new Function("clamp", `return ${js}`)(clamp) as number
}

/** What the light field paints at `alpha`: the card at the evaluated alpha. */
function lightField(alpha: number) {
  const value = declarationsOf(LIGHT, [])["--control-surface"] ?? ""
  const match = /^var\(--card\) \/ (.+)$/.exec(value)
  expect(match, value).not.toBe(null)
  return {
    colour: CARD.light,
    alpha: evaluate(match?.[1] ?? "", { "--surface-alpha": alpha }),
  }
}

/**
 * What the dark field paints at `alpha`: the foreground mixed into the card
 * by the evaluated share, at the evaluated alpha.
 */
function darkField(alpha: number) {
  const rule = declarationsOf(DARK, [RELATIVE])
  const clear = evaluate(rule["--field-clear"] ?? "", {
    "--surface-alpha": alpha,
  })
  const fieldAlpha = evaluate(rule["--field-alpha"] ?? "", {
    "--field-clear": clear,
  })
  const match =
    /^from color-mix\(in srgb, hsl\(var\(--foreground\)\) (.+), hsl\(var\(--card\)\)\) h s l \/ var\(--field-alpha\)$/.exec(
      rule["--control-surface"] ?? "",
    )
  expect(match, rule["--control-surface"]).not.toBe(null)
  const share =
    evaluate(match?.[1] ?? "", {
      "--field-clear": clear,
      "--field-alpha": fieldAlpha,
    }) / 100
  return {
    colour: composite(CARD.dark, FOREGROUND.dark, share),
    alpha: fieldAlpha,
  }
}

/** A field composited over its card, which sits at `alpha` over `ground`. */
function painted(
  field: { colour: string; alpha: number },
  card: string,
  alpha: number,
  ground: string,
) {
  return composite(composite(ground, card, alpha), field.colour, field.alpha)
}

describe("fieldFill translucent", () => {
  it("keeps today's fixed dark wash where relative colour is missing", () => {
    expect(declarationsOf(DARK, [])["--control-surface"]).toBe(
      "var(--foreground) / 0.06",
    )
  })

  it("paints the opaque card in light mode when the card is opaque", () => {
    expect(lightField(1)).toEqual({ colour: CARD.light, alpha: 1 })
  })

  it("paints the opaque card in dark mode when the card is opaque", () => {
    const field = darkField(1)
    expect(field.alpha).toBe(1)
    expect(field.colour).toBe(composite(CARD.dark, FOREGROUND.dark, 0))
  })

  it.each(GROUNDS)(
    "paints the card at 0.6 at base Glass's Medium light alpha, over %s",
    (ground) => {
      const field = lightField(MEDIUM.light)
      expect(field.alpha).toBeCloseTo(0.6, 10)
      expect(painted(field, CARD.light, MEDIUM.light, ground)).toBe(
        painted(
          { colour: CARD.light, alpha: 0.6 },
          CARD.light,
          MEDIUM.light,
          ground,
        ),
      )
    },
  )

  it.each(GROUNDS)(
    "paints a 6% foreground wash at base Glass's Medium dark alpha, over %s",
    (ground) => {
      const field = darkField(MEDIUM.dark)
      expect(field.alpha).toBeCloseTo(0.06, 10)
      expect(painted(field, CARD.dark, MEDIUM.dark, ground)).toBe(
        painted(
          { colour: FOREGROUND.dark, alpha: 0.06 },
          CARD.dark,
          MEDIUM.dark,
          ground,
        ),
      )
    },
  )

  it("thins as the card thins, in both modes", () => {
    const steps = [1, 0.9, 0.8, 0.72, 0.6, 0.55, 0.4, 0.2]
    const light = steps.map((alpha) => lightField(alpha).alpha)
    const dark = steps.map((alpha) => darkField(alpha).alpha)
    for (const alphas of [light, dark]) {
      for (let i = 1; i < alphas.length; i++) {
        expect(alphas[i]).toBeLessThanOrEqual(alphas[i - 1] as number)
        expect(alphas[i]).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it("leaves no markdown fence in theme.css", () => {
    const lines = readFileSync(THEME, "utf8").split("\n")
    expect(lines.filter((line) => line.startsWith("```"))).toEqual([])
  })
})
