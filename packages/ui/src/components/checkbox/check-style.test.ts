import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { SIGNATURES } from "../../theme/config/signatures"
import { cssRules } from "../../test/css-rules"
import { stripCssComments } from "../../test/strip-css-comments"

// The checkStyle signature restyles every Checkbox and every Radio item that
// is not a SegmentGroup item (SegmentGroup renders RadioGroupItem, so its
// items carry .dr-radio-group-item too). jsdom computes no cascade, so the
// source rules are what this asserts; the effective values are checked in
// Chromium by the template's e2e 63.

const SOURCES = {
  checkbox: join("src", "components", "checkbox", "checkbox.css"),
  radio: join("src", "components", "radio-group", "radio-group.css"),
} as const

type Source = keyof typeof SOURCES

interface Rule {
  selectors: string[]
  wrappers: string[]
  body: string
}

function normalise(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
}

function rules(file: Source): Rule[] {
  return cssRules(stripCssComments(readFileSync(SOURCES[file], "utf8"))).map(
    (rule) => ({
      selectors: rule.selector
        .split(/,(?![^(]*\))/)
        .map(normalise)
        .filter(Boolean),
      wrappers: rule.wrappers,
      body: normalise(rule.body),
    }),
  )
}

function bodyOf(file: Source, selector: string): string {
  const bodies = rules(file)
    .filter(
      (rule) =>
        rule.selectors.includes(selector) &&
        rule.wrappers.join(" | ") === "@layer components",
    )
    .map((rule) => rule.body)
  if (bodies.length === 0) {
    throw new Error(`no rule ${selector} in ${file} inside @layer components`)
  }
  return bodies.join(" ")
}

/** Every selector, in either stylesheet, that reads the root attribute. */
function signatureSelectors(): { file: Source; selector: string }[] {
  return (Object.keys(SOURCES) as Source[]).flatMap((file) =>
    rules(file).flatMap((rule) =>
      rule.selectors
        .filter((selector) => selector.includes("[data-check-style="))
        .map((selector) => ({ file, selector })),
    ),
  )
}

const OUTLINE = '[data-check-style="outline"]'
const ROUND = '[data-check-style="round"]'
const RADIO = ".dr-radio-group-item:not(.dr-segment-group-item)"

describe("checkStyle scope", () => {
  const found = signatureSelectors()

  it("draws every non-default value and never the default", () => {
    const { values, default: fallback } = SIGNATURES.checkStyle
    const named = new Set(
      found.map(
        ({ selector }) =>
          /\[data-check-style="([^"]+)"\]/.exec(selector)?.[1] as string,
      ),
    )
    expect([...named].sort()).toEqual(
      values.filter((value) => value !== fallback).sort(),
    )
    expect(named.has(fallback)).toBe(false)
  })

  it("starts every selector at the root attribute", () => {
    for (const { selector } of found) {
      expect(selector).toMatch(/^\[data-check-style="[a-z]+"\] /)
    }
  })

  it("leaves SegmentGroup items alone on every radio rule", () => {
    const radio = found.filter(({ file }) => file === "radio")
    expect(radio.length).toBeGreaterThan(0)
    for (const { selector } of radio) {
      expect(selector).toContain(RADIO)
    }
  })

  it("puts any hover rule inside @media (hover: hover)", () => {
    for (const file of Object.keys(SOURCES) as Source[]) {
      for (const rule of rules(file)) {
        if (!rule.selectors.some((s) => s.includes("[data-check-style="))) {
          continue
        }
        if (rule.selectors.some((s) => s.includes(":hover"))) {
          expect(rule.wrappers).toContain("@media (hover: hover)")
        }
      }
    }
  })
})

describe("checkStyle outline", () => {
  it("leaves a checked or mixed checkbox unfilled with a 1.5px primary edge and mark", () => {
    const body =
      "border-width: 1.5px; border-color: hsl(var(--primary)); background-color: transparent; color: hsl(var(--primary));"
    expect(
      bodyOf("checkbox", `${OUTLINE} .dr-checkbox[data-state="checked"]`),
    ).toBe(body)
    expect(
      bodyOf("checkbox", `${OUTLINE} .dr-checkbox[data-state="indeterminate"]`),
    ).toBe(body)
  })

  it("thins a chosen radio's ring to 1.5px of primary", () => {
    expect(bodyOf("radio", `${OUTLINE} ${RADIO}[data-state="checked"]`)).toBe(
      "border-width: 1.5px; border-color: hsl(var(--primary));",
    )
  })

  it.each([
    ["sm", "0.4375rem"],
    ["default", "0.5rem"],
    ["lg", "0.625rem"],
  ])("sizes the %s radio dot to half its box", (size, length) => {
    expect(
      bodyOf("radio", `${OUTLINE} ${RADIO} .dr-radio-group-indicator-${size}`),
    ).toBe(`width: ${length}; height: ${length};`)
  })
})

describe("checkStyle round", () => {
  it("rounds every checkbox with the pill radius, square under sharp", () => {
    expect(bodyOf("checkbox", `${ROUND} .dr-checkbox`)).toBe(
      "border-radius: var(--radius-pill);",
    )
  })

  it("adds no radio rule, since radios are already circles", () => {
    expect(
      signatureSelectors().filter(
        ({ file, selector }) => file === "radio" && selector.startsWith(ROUND),
      ),
    ).toEqual([])
  })
})
