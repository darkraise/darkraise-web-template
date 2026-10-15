import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { SIGNATURES } from "../../theme/config/signatures"
import { cssRules } from "../../test/css-rules"
import { stripCssComments } from "../../test/strip-css-comments"

// The tabStyle signature restyles Tabs lists and SegmentGroups whose app
// variant is `default`, in both orientations and with or without
// color="accent"; the outline, underline and enclosed variants an app picks
// keep their own look. jsdom computes no cascade, so the source rules are
// what this asserts; the effective values are checked in Chromium by the
// template's e2e 64.

const SOURCES = {
  tabs: join("src", "components", "tabs", "tabs.css"),
  segment: join("src", "components", "segment-group", "segment-group.css"),
  theme: join("src", "styles", "theme.css"),
} as const

type Source = keyof typeof SOURCES

const COMPONENTS = "@layer components"
const FORCED = "@media (forced-colors: active)"

interface Rule {
  selectors: string[]
  wrappers: string[]
  body: string
  start: number
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
      start: rule.start,
    }),
  )
}

function bodyOf(file: Source, selector: string, wrapper: string): string {
  const bodies = rules(file)
    .filter(
      (rule) =>
        rule.selectors.includes(selector) &&
        rule.wrappers.join(" | ") === wrapper,
    )
    .map((rule) => rule.body)
  if (bodies.length === 0) {
    throw new Error(`no rule ${selector} in ${file} inside ${wrapper}`)
  }
  return bodies.join(" ")
}

/** Every component-layer selector, in either stylesheet, that reads the root attribute. */
function signatureSelectors(): { file: Source; selector: string }[] {
  return (["tabs", "segment"] as const).flatMap((file) =>
    rules(file).flatMap((rule) =>
      rule.selectors
        .filter((selector) => selector.includes("[data-tab-style="))
        .map((selector) => ({ file, selector })),
    ),
  )
}

const UNDERLINE = '[data-tab-style="underline"]'
const PILL = '[data-tab-style="pill"]'
const OUTLINE = '[data-tab-style="outline"]'
const DEFAULT = '[data-variant="default"]'

describe("tabStyle scope", () => {
  const found = signatureSelectors()

  it.each(["tabs", "segment"] as const)(
    "draws every non-default value in %s and never the default",
    (file) => {
      const { values, default: fallback } = SIGNATURES.tabStyle
      const named = new Set(
        found
          .filter((entry) => entry.file === file)
          .map(
            ({ selector }) =>
              /\[data-tab-style="([^"]+)"\]/.exec(selector)?.[1] as string,
          ),
      )
      expect([...named].sort()).toEqual(
        values.filter((value) => value !== fallback).sort(),
      )
      expect(named.has(fallback)).toBe(false)
    },
  )

  it("starts every selector at the root attribute", () => {
    for (const { selector } of found) {
      expect(selector).toMatch(/^\[data-tab-style="[a-z]+"\][[ ]/)
    }
  })

  it("restyles only the default variant", () => {
    for (const { selector } of found) {
      // A sibling combinator names a second kit element; it must be a
      // default-variant one too. A bare `input` is the radio's form input.
      const compounds = selector
        .split(/\s*\+\s*/)
        .filter((compound) => compound.includes(".dr-"))
      for (const compound of compounds) {
        expect(compound, selector).toContain(DEFAULT)
      }
      expect(selector).not.toMatch(/\[data-variant="(?!default)/)
    }
  })

  it("writes every rule after the color=accent rules it must outrank", () => {
    for (const file of ["tabs", "segment"] as const) {
      const all = rules(file)
      const accent = all
        .filter((rule) =>
          rule.selectors.some((s) => s.includes('[data-color="accent"]')),
        )
        .map((rule) => rule.start)
      const signature = all
        .filter((rule) =>
          rule.selectors.some((s) => s.includes("[data-tab-style=")),
        )
        .map((rule) => rule.start)
      expect(accent.length, `${file} accent rules`).toBeGreaterThan(0)
      expect(signature.length, `${file} signature rules`).toBeGreaterThan(0)
      expect(Math.min(...signature)).toBeGreaterThan(Math.max(...accent))
    }
  })

  // No tabStyle rule hovers today; this guards the next one that does.
  it("puts any hover rule inside @media (hover: hover)", () => {
    for (const file of ["tabs", "segment"] as const) {
      for (const rule of rules(file)) {
        if (!rule.selectors.some((s) => s.includes("[data-tab-style="))) {
          continue
        }
        if (rule.selectors.some((s) => s.includes(":hover"))) {
          expect(rule.wrappers).toContain("@media (hover: hover)")
        }
      }
    }
  })
})

// e2e 16 holds every tab trigger and segment item to the control height of
// its density, and e2e 67 holds every look's strips to the kit anatomy's
// sizes, so no tabStyle value may resize an item or the strip around it.
// The one exception is `gap: 0` on an outline list, so the cells meet; the
// strip loses those gaps along its main axis only. A pseudo-element drawn
// by a value is absolutely positioned, outside the flow.
const BOX_PROPERTY =
  /^(?:(?:min-|max-)?(?:width|height|block-size|inline-size)|padding(?:-.+)?|margin(?:-.+)?|border(?:-(?:top|right|bottom|left|block|inline)(?:-start|-end)?)?(?:-width)?|(?:row-|column-)?gap|flex(?:-.+)?|font-size|line-height|aspect-ratio|box-sizing)$/

function declarations(body: string): [string, string][] {
  return body
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const colon = part.indexOf(":")
      return [part.slice(0, colon).trim(), part.slice(colon + 1).trim()]
    })
}

describe("tabStyle keeps every item's box", () => {
  const signatureRules = (["tabs", "segment"] as const).flatMap((file) =>
    rules(file)
      .filter((rule) =>
        rule.selectors.some((s) => s.includes("[data-tab-style=")),
      )
      .map((rule) => ({ file, ...rule })),
  )

  it("finds the rules it checks", () => {
    expect(signatureRules.length).toBeGreaterThan(30)
  })

  it("writes no size, padding, margin, border width or gap", () => {
    const offending: string[] = []
    for (const rule of signatureRules) {
      if (rule.selectors.every((s) => /::(?:before|after)$/.test(s))) continue
      for (const [property, value] of declarations(rule.body)) {
        if (!BOX_PROPERTY.test(property)) continue
        const outlineGap =
          property === "gap" &&
          value === "0" &&
          rule.selectors.every((s) =>
            /^\[data-tab-style="outline"\] \.dr-(?:tabs-list|segment-group)\[data-variant="default"\]$/.test(
              s,
            ),
          )
        if (!outlineGap) {
          offending.push(
            `${rule.selectors.join(", ")} { ${property}: ${value} }`,
          )
        }
      }
    }
    expect(offending).toEqual([])
  })

  it("draws every pseudo-element out of the flow", () => {
    for (const rule of signatureRules) {
      if (!rule.selectors.every((s) => /::(?:before|after)$/.test(s))) continue
      if (
        declarations(rule.body).some(([property]) => property === "content")
      ) {
        expect(rule.body, rule.selectors.join(", ")).toContain(
          "position: absolute;",
        )
      }
    }
  })
})

const TRIGGER = `.dr-tabs-trigger${DEFAULT}`
const LIST = `.dr-tabs-list${DEFAULT}`
const INDICATOR = `.dr-tabs-indicator${DEFAULT}`
const GROUP = `.dr-segment-group${DEFAULT}`
const ITEM = `.dr-segment-group .dr-segment-group-item${DEFAULT}`
const PILL_INDICATOR = `.dr-segment-group .dr-segment-group-indicator${DEFAULT}`

describe("tabStyle underline", () => {
  // The bar crosses the list's 0.25rem padding (p-1) to the baseline.
  const BAR =
    'content: ""; position: absolute; inset-inline: 0; bottom: -0.25rem; height: 2px; background-image: linear-gradient(hsl(var(--primary)), hsl(var(--primary)));'
  const VERTICAL_BAR =
    "inset-block: 0; inset-inline: auto -0.25rem; width: 2px; height: auto;"
  it.each([
    [
      "tabs",
      `${UNDERLINE} ${LIST}`,
      "border-radius: 0; background-color: transparent; box-shadow: inset 0 -1px 0 hsl(var(--border));",
    ],
    [
      "tabs",
      `${UNDERLINE} ${LIST}[data-orientation="vertical"]`,
      "box-shadow: inset -1px 0 0 hsl(var(--border));",
    ],
    [
      "tabs",
      `${UNDERLINE} ${LIST}[data-orientation="vertical"]:dir(rtl)`,
      "box-shadow: inset 1px 0 0 hsl(var(--border));",
    ],
    [
      "tabs",
      `${UNDERLINE} ${LIST}[data-border]:not([data-border="none"])`,
      "box-shadow: none; border-radius: var(--radius);",
    ],
    [
      "tabs",
      `${UNDERLINE} ${TRIGGER}[data-state="active"]`,
      "color: var(--selected-mark-fg);",
    ],
    [
      "tabs",
      `${UNDERLINE} ${INDICATOR}`,
      "background: transparent; box-shadow: none;",
    ],
    ["tabs", `${UNDERLINE} ${INDICATOR}::after`, BAR],
    [
      "tabs",
      `${UNDERLINE} ${INDICATOR}[data-orientation="vertical"]::after`,
      VERTICAL_BAR,
    ],
    [
      "segment",
      `${UNDERLINE} ${GROUP}`,
      "border-radius: 0; background-color: transparent; box-shadow: inset 0 -1px 0 hsl(var(--border));",
    ],
    [
      "segment",
      `${UNDERLINE} ${GROUP}[data-orientation="vertical"]`,
      "box-shadow: inset -1px 0 0 hsl(var(--border));",
    ],
    [
      "segment",
      `${UNDERLINE} ${GROUP}[data-orientation="vertical"]:dir(rtl)`,
      "box-shadow: inset 1px 0 0 hsl(var(--border));",
    ],
    [
      "segment",
      `${UNDERLINE} ${ITEM}[data-state="checked"]`,
      "color: var(--selected-mark-fg);",
    ],
    [
      "segment",
      `${UNDERLINE} ${PILL_INDICATOR}`,
      "background: transparent; box-shadow: none;",
    ],
    ["segment", `${UNDERLINE} ${PILL_INDICATOR}::after`, BAR],
    [
      "segment",
      `${UNDERLINE} ${PILL_INDICATOR}[data-orientation="vertical"]::after`,
      VERTICAL_BAR,
    ],
  ] as const)("%s %s", (file, selector, body) => {
    expect(bodyOf(file, selector, COMPONENTS)).toBe(body)
  })

  it("writes the framed-strip rule after every baseline rule", () => {
    const all = rules("tabs")
    const startOf = (selector: string) =>
      all.find((rule) => rule.selectors.includes(selector))?.start ?? -1
    const frame = startOf(
      `${UNDERLINE} ${LIST}[data-border]:not([data-border="none"])`,
    )
    expect(frame).toBeGreaterThan(
      startOf(`${UNDERLINE} ${LIST}[data-orientation="vertical"]:dir(rtl)`),
    )
  })
})

describe("tabStyle pill", () => {
  it.each([
    [
      "tabs",
      `${PILL} ${LIST}`,
      "background-color: transparent; box-shadow: none;",
    ],
    ["tabs", `${PILL} ${TRIGGER}`, "border-radius: var(--radius-pill);"],
    [
      "tabs",
      `${PILL} ${TRIGGER}[data-state="active"]`,
      "color: hsl(var(--primary-foreground));",
    ],
    [
      "tabs",
      `${PILL} ${INDICATOR}`,
      "border-radius: var(--radius-pill); background: hsl(var(--primary-fill)); box-shadow: inset 0 0 0 1px hsl(var(--primary)), var(--affordance-glow);",
    ],
    [
      "segment",
      `${PILL} ${GROUP}`,
      "background-color: transparent; box-shadow: none;",
    ],
    ["segment", `${PILL} ${ITEM}`, "border-radius: var(--radius-pill);"],
    [
      "segment",
      `${PILL} ${ITEM}[data-state="checked"]`,
      "color: hsl(var(--primary-foreground));",
    ],
    [
      "segment",
      `${PILL} ${PILL_INDICATOR}`,
      "border-radius: var(--radius-pill); background: hsl(var(--primary-fill)); box-shadow: inset 0 0 0 1px hsl(var(--primary)), var(--affordance-glow);",
    ],
  ] as const)("%s %s", (file, selector, body) => {
    expect(bodyOf(file, selector, COMPONENTS)).toBe(body)
  })
})

describe("tabStyle outline", () => {
  const H = '[data-orientation="horizontal"]'
  const V = '[data-orientation="vertical"]'
  const SH = `.dr-segment-group${H} .dr-segment-group-item${DEFAULT}`
  const SV = `.dr-segment-group${V} .dr-segment-group-item${DEFAULT}`
  // The well's chip radii: rounded-sm on a trigger, and a segment item's.
  const T = "var(--radius-sm)"
  const R = "calc(var(--segment-radius) - 2px)"
  const DIVIDER = "hsl(var(--border-strong))"
  const RULE = `var(--tab-rule, ${DIVIDER})`

  it.each([
    [
      "tabs",
      `${OUTLINE} ${LIST}`,
      "gap: 0; background-color: transparent; box-shadow: none;",
    ],
    [
      "tabs",
      `${OUTLINE} ${LIST}::before`,
      `content: ""; position: absolute; inset: 0.25rem; border: 1px solid ${RULE}; border-radius: ${T}; pointer-events: none;`,
    ],
    [
      "tabs",
      `${OUTLINE} ${LIST}[data-border]`,
      "border-color: transparent; --tab-rule: hsl(var(--border));",
    ],
    [
      "tabs",
      `${OUTLINE} ${LIST}[data-border="strong"]`,
      "--tab-rule: hsl(var(--border-strong));",
    ],
    [
      "tabs",
      `${OUTLINE} ${LIST}[data-border="accent"]`,
      "--tab-rule: hsl(var(--primary) / 0.35);",
    ],
    [
      "tabs",
      `${OUTLINE} ${LIST}[data-border="none"]`,
      "--tab-rule: transparent;",
    ],
    [
      "tabs",
      `${OUTLINE} ${INDICATOR}`,
      "background: transparent; box-shadow: none;",
    ],
    ["tabs", `${OUTLINE} ${TRIGGER}`, "border-radius: 0;"],
    [
      "tabs",
      `${OUTLINE} ${TRIGGER}${H}:first-of-type`,
      `border-start-start-radius: ${T}; border-end-start-radius: ${T};`,
    ],
    [
      "tabs",
      `${OUTLINE} ${TRIGGER}${H}:last-of-type`,
      `border-start-end-radius: ${T}; border-end-end-radius: ${T};`,
    ],
    [
      "tabs",
      `${OUTLINE} ${TRIGGER}${V}:first-of-type`,
      `border-start-start-radius: ${T}; border-start-end-radius: ${T};`,
    ],
    [
      "tabs",
      `${OUTLINE} ${TRIGGER}${V}:last-of-type`,
      `border-end-start-radius: ${T}; border-end-end-radius: ${T};`,
    ],
    [
      "tabs",
      `${OUTLINE} ${TRIGGER}:where(${H}:not(:first-of-type))`,
      `border-inline-start-color: ${RULE};`,
    ],
    [
      "tabs",
      `${OUTLINE} ${TRIGGER}:where(${V}:not(:first-of-type))`,
      `border-top-color: ${RULE};`,
    ],
    [
      "tabs",
      `${OUTLINE} ${TRIGGER}[data-state="active"]`,
      "border-color: hsl(var(--primary)); background-color: hsl(var(--primary-3)); color: hsl(var(--primary-text));",
    ],
    [
      "tabs",
      `${OUTLINE}[data-mode="dark"] ${TRIGGER}[data-state="active"]`,
      "background-color: hsl(var(--primary-4));",
    ],
    [
      "tabs",
      `${OUTLINE} ${TRIGGER}[data-state="active"] + ${TRIGGER}`,
      "border-inline-start-color: transparent; border-top-color: transparent;",
    ],
    [
      "segment",
      `${OUTLINE} ${GROUP}`,
      "gap: 0; background-color: transparent; box-shadow: none;",
    ],
    [
      "segment",
      `${OUTLINE} ${GROUP}::before`,
      `content: ""; position: absolute; inset: 0.25rem; border: 1px solid ${DIVIDER}; border-radius: ${R}; pointer-events: none;`,
    ],
    [
      "segment",
      `${OUTLINE} ${PILL_INDICATOR}`,
      "background: transparent; box-shadow: none;",
    ],
    ["segment", `${OUTLINE} ${ITEM}`, "border-radius: 0; box-shadow: none;"],
    [
      "segment",
      `${OUTLINE} ${SH}:first-of-type`,
      `border-start-start-radius: ${R}; border-end-start-radius: ${R};`,
    ],
    [
      "segment",
      `${OUTLINE} ${SH}:last-of-type`,
      `border-start-end-radius: ${R}; border-end-end-radius: ${R};`,
    ],
    [
      "segment",
      `${OUTLINE} ${SV}:first-of-type`,
      `border-start-start-radius: ${R}; border-start-end-radius: ${R};`,
    ],
    [
      "segment",
      `${OUTLINE} ${SV}:last-of-type`,
      `border-end-start-radius: ${R}; border-end-end-radius: ${R};`,
    ],
    [
      "segment",
      `${OUTLINE} .dr-segment-group:where(${H}) .dr-segment-group-item${DEFAULT}:where(:not(:first-of-type))`,
      `box-shadow: inset 1px 0 0 ${DIVIDER};`,
    ],
    [
      "segment",
      `${OUTLINE} .dr-segment-group:where(${H}) .dr-segment-group-item${DEFAULT}:where(:not(:first-of-type):dir(rtl))`,
      `box-shadow: inset -1px 0 0 ${DIVIDER};`,
    ],
    [
      "segment",
      `${OUTLINE} .dr-segment-group:where(${V}) .dr-segment-group-item${DEFAULT}:where(:not(:first-of-type))`,
      `box-shadow: inset 0 1px 0 ${DIVIDER};`,
    ],
    [
      "segment",
      `${OUTLINE} ${ITEM}[data-state="checked"]`,
      "background-color: hsl(var(--primary-3)); color: hsl(var(--primary-text)); box-shadow: inset 0 0 0 1px hsl(var(--primary));",
    ],
    [
      "segment",
      `${OUTLINE}[data-mode="dark"] ${ITEM}[data-state="checked"]`,
      "background-color: hsl(var(--primary-4));",
    ],
    [
      "segment",
      `${OUTLINE} ${ITEM}[data-state="checked"] + .dr-segment-group-item${DEFAULT}`,
      "box-shadow: none;",
    ],
    [
      "segment",
      `${OUTLINE} ${ITEM}[data-state="checked"] + input + .dr-segment-group-item${DEFAULT}`,
      "box-shadow: none;",
    ],
  ] as const)("%s %s", (file, selector, body) => {
    expect(bodyOf(file, selector, COMPONENTS)).toBe(body)
  })
})

// Forced colours drop fills and shadows: today's rules paint the default
// indicator as a Highlight box under a HighlightText label. Under underline
// the box goes and the bar takes Highlight over a CanvasText label; under
// outline the current cell takes the box and the indicator under it drops
// its own, since emulated Highlight is translucent and two layers darken.
describe("tabStyle under forced colours", () => {
  it.each([
    [
      `${UNDERLINE} .dr-tabs-indicator${DEFAULT}`,
      "background-color: transparent;",
    ],
    [
      `${UNDERLINE} .dr-segment-group-indicator${DEFAULT}`,
      "background-color: transparent;",
    ],
    [
      `${OUTLINE} .dr-tabs-indicator${DEFAULT}`,
      "background-color: transparent;",
    ],
    [
      `${OUTLINE} .dr-segment-group-indicator${DEFAULT}`,
      "background-color: transparent;",
    ],
    [
      `${UNDERLINE} .dr-tabs-indicator${DEFAULT}::after`,
      "background-color: Highlight; background-image: none;",
    ],
    [
      `${UNDERLINE} .dr-segment-group-indicator${DEFAULT}::after`,
      "background-color: Highlight; background-image: none;",
    ],
    [`${UNDERLINE} ${TRIGGER}[data-state="active"]`, "color: CanvasText;"],
    [
      `${UNDERLINE} .dr-segment-group-item${DEFAULT}[data-state="checked"]`,
      "color: CanvasText;",
    ],
    [
      `${OUTLINE} ${TRIGGER}[data-state="active"]`,
      "background-color: Highlight;",
    ],
    [
      `${OUTLINE} .dr-segment-group-item${DEFAULT}[data-state="checked"]`,
      "background-color: Highlight;",
    ],
    [
      `${UNDERLINE} .dr-segment-group-item${DEFAULT}[data-state="checked"]:focus-visible`,
      "outline-color: Highlight;",
    ],
    [
      `${OUTLINE} .dr-tabs-list${DEFAULT}[data-border]:not([data-border="none"])`,
      "border-color: Canvas;",
    ],
    [
      `${OUTLINE} .dr-tabs-list${DEFAULT}[data-border="none"]::before`,
      "border-color: Canvas;",
    ],
  ])("%s", (selector, body) => {
    expect(bodyOf("theme", selector, FORCED)).toBe(body)
  })
})
