import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { cssRules } from "../../test/css-rules"
import { stripCssComments } from "../../test/strip-css-comments"

// The switchStyle signature restyles every switch from the root attribute.
// pill, the kit default, is the unscoped rules, so no rule names it. jsdom
// computes no cascade, so the source rules are what this asserts; the
// effective geometry and contrast are checked in Chromium by e2e 62.

const SOURCE = join("src", "components", "switch", "switch.css")
const VALUES = ["track", "slide", "marked"] as const

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

function rules(): Rule[] {
  return cssRules(stripCssComments(readFileSync(SOURCE, "utf8"))).map(
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

function bodyOf(selector: string): string {
  const bodies = rules()
    .filter(
      (rule) =>
        rule.selectors.includes(selector) &&
        rule.wrappers.join(" | ") === "@layer components",
    )
    .map((rule) => rule.body)
  if (bodies.length === 0) {
    throw new Error(
      `no rule ${selector} in switch.css inside @layer components`,
    )
  }
  return bodies.join(" ")
}

const signatureRules = () =>
  rules().filter((rule) =>
    rule.selectors.some((s) => s.includes("data-switch-style")),
  )

const TRACK = '[data-switch-style="track"]'
const SLIDE = '[data-switch-style="slide"]'
const MARKED = '[data-switch-style="marked"]'

describe("switch style signature scope", () => {
  it.each(VALUES)("draws %s from the root attribute", (value) => {
    expect(
      signatureRules().some((rule) =>
        rule.selectors.some((s) =>
          s.startsWith(`[data-switch-style="${value}"] .dr-switch`),
        ),
      ),
    ).toBe(true)
  })

  it("names no rule after the kit default", () => {
    expect(
      rules().filter((rule) =>
        rule.selectors.some((s) => s.includes('data-switch-style="pill"')),
      ),
    ).toEqual([])
  })

  it("scopes every rule to a switch part under the root attribute", () => {
    const stray = signatureRules()
      .flatMap((rule) => rule.selectors.map((selector) => ({ selector, rule })))
      .filter(
        ({ selector, rule }) =>
          !/^\[data-switch-style="(track|slide|marked)"\] \.dr-switch(-thumb|-marks)?[[.:\s]/.test(
            `${selector} `,
          ) || rule.wrappers.join(" | ") !== "@layer components",
      )
      .map(({ selector }) => selector)
    expect(stray).toEqual([])
  })

  it("leaves the 24px hit area of the switch's ::before alone", () => {
    const touching = signatureRules()
      .flatMap((rule) => rule.selectors)
      .filter((selector) => /\.dr-switch(\[[^\]]*\])*::before/.test(selector))
    expect(touching).toEqual([])
    expect(bodyOf(".dr-switch")).toMatch(/(?<![\w-])hit-area-24(?![\w-])/)
  })

  it("draws no hover state", () => {
    expect(
      signatureRules().flatMap((rule) =>
        rule.selectors.filter((s) => s.includes(":hover")),
      ),
    ).toEqual([])
  })
})

describe("switch style track", () => {
  it("narrows the track to 14px inside the unchanged box", () => {
    expect(bodyOf(`${TRACK} .dr-switch`)).toBe(
      "border-color: transparent; border-block-width: calc(var(--spacing) * 0.75); background-clip: padding-box;",
    )
  })

  it("tints the checked track with the accent's fourth step", () => {
    expect(bodyOf(`${TRACK} .dr-switch[data-state="checked"]`)).toBe(
      "background-color: hsl(var(--primary-4));",
    )
  })

  it("grows the thumb to 20px and pulls it over the track's ends", () => {
    expect(bodyOf(`${TRACK} .dr-switch .dr-switch-thumb`)).toBe(
      "width: calc(var(--spacing) * 5); height: calc(var(--spacing) * 5); margin-inline-start: calc(var(--spacing) * -0.5); border-radius: var(--switch-radius);",
    )
  })

  it("paints the checked thumb in the accent's text tier, as an image", () => {
    expect(
      bodyOf(`${TRACK} .dr-switch[data-state="checked"] .dr-switch-thumb`),
    ).toBe(
      "background-image: linear-gradient(hsl(var(--primary-text)), hsl(var(--primary-text)));",
    )
  })

  it("rings the unchecked card-tone thumb in the strong border", () => {
    expect(
      bodyOf(`${TRACK} .dr-switch[data-state="unchecked"] .dr-switch-thumb`),
    ).toBe(
      "background-color: var(--thumb-fill, var(--surface-card-fill-opaque)); box-shadow: 0 0 0 1px hsl(var(--border-strong)), var(--thumb-shadow);",
    )
  })
})

describe("switch style slide", () => {
  it("draws a recessed slot in both states", () => {
    expect(bodyOf(`${SLIDE} .dr-switch`)).toBe(
      "--switch-slot-radius: min(var(--switch-radius), calc(var(--radius) * 0.25)); border-radius: var(--switch-slot-radius); border-color: var(--field-edge); background-color: var(--well-fill, hsl(var(--input))); box-shadow: var(--check-well-shadow);",
    )
  })

  it("draws a rectangular thumb concentric with the slot, ringed in the strong border", () => {
    expect(bodyOf(`${SLIDE} .dr-switch .dr-switch-thumb`)).toBe(
      "display: grid; place-items: center; width: calc(var(--spacing) * 4.5); border-radius: max(0px, calc(var(--switch-slot-radius) - 2px)); background-color: var(--thumb-fill, var(--surface-card-fill-opaque)); box-shadow: 0 0 0 1px hsl(var(--border-strong)), var(--thumb-shadow);",
    )
  })

  it("shortens the thumb's travel to the wider thumb, mirrored right to left", () => {
    expect(bodyOf(`${SLIDE} .dr-switch-thumb[data-state="checked"]`)).toBe(
      "--switch-thumb-x: calc(var(--spacing) * 3.5);",
    )
    expect(
      bodyOf(`${SLIDE} .dr-switch-thumb[data-state="checked"]:dir(rtl)`),
    ).toBe("--switch-thumb-x: calc(var(--spacing) * -3.5);")
  })

  it("ridges the thumb with three 1px grip lines in its ::after", () => {
    expect(bodyOf(`${SLIDE} .dr-switch-thumb::after`)).toBe(
      'content: ""; width: 5px; height: 8px; background-image: repeating-linear-gradient(to right, var(--field-edge) 0 1px, transparent 1px 2px);',
    )
  })

  it("draws a 6px lamp at the inline end of an unchecked slot", () => {
    expect(bodyOf(`${SLIDE} .dr-switch-marks`)).toBe(
      "position: absolute; top: calc(50% - var(--spacing) * 0.75); inset-inline-end: var(--spacing); width: calc(var(--spacing) * 1.5); height: calc(var(--spacing) * 1.5); border-radius: var(--radius-pill); background-color: var(--field-edge);",
    )
  })

  it("lights the lamp in the accent's text tier at the inline start of a checked slot", () => {
    expect(bodyOf(`${SLIDE} .dr-switch-marks[data-state="checked"]`)).toBe(
      "inset-inline-start: var(--spacing); inset-inline-end: auto; background-image: linear-gradient(hsl(var(--primary-text)), hsl(var(--primary-text))); box-shadow: 0 0 4px hsl(var(--primary-text));",
    )
  })
})

describe("switch style marked", () => {
  it("lays the marks over the track in two halves", () => {
    expect(bodyOf(`${MARKED} .dr-switch-marks`)).toBe(
      "position: absolute; inset: 0; display: grid; grid-template-columns: 1fr 1fr; place-items: center; font-size: calc(var(--text-2xs) * 0.9); font-weight: 600; line-height: 1; color: hsl(var(--muted-foreground));",
    )
  })

  it("writes the I in the checked track's own foreground", () => {
    expect(bodyOf(`${MARKED} .dr-switch-marks[data-state="checked"]`)).toBe(
      "color: var(--selected-check-fg);",
    )
  })

  it("draws an O in the inline-end half of an unchecked switch", () => {
    expect(
      bodyOf(`${MARKED} .dr-switch-marks[data-state="unchecked"]::before`),
    ).toBe('content: "O"; grid-column: 2;')
  })

  it("draws an I in the inline-start half of a checked switch", () => {
    expect(
      bodyOf(`${MARKED} .dr-switch-marks[data-state="checked"]::after`),
    ).toBe('content: "I"; grid-column: 1;')
  })
})
