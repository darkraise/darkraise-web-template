import { describe, expect, it } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join, sep } from "node:path"
import { KIT_FALLBACK, PAINT_TOKENS } from "../theme/config/tokens"
import {
  SIGNATURES,
  STAMPED_SIGNATURES,
  signatureAttribute,
} from "../theme/config/signatures"
import { generateTokens } from "../theme/engine/generateTokens"
import { BUILTIN_STYLES } from "../theme/styles/builtin"
import { cssRules } from "../test/css-rules"
import { stripCssComments } from "../test/strip-css-comments"

// The contracts of the style vocabulary, across every kit stylesheet: each
// paint token has a default and a reader, each signature value is drawn,
// no stylesheet rule outside the default and style layers sets a paint
// token (it would beat every style's value, or lose to it unseen), and the
// forced fallback covers every backdrop and translucency token. Layers are
// read from the source's own @layer blocks, which is where the cascade takes
// them from: no kit rule is layered by an import.

interface Declaration {
  path: string
  wrappers: string[]
  selector: string
  property: string
  value: string
}

function sheets(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sheets(path)
    return entry.name.endsWith(".css") ? [path] : []
  })
}

/** Splits a rule body at top-level semicolons. */
function split(body: string): string[] {
  const parts: string[] = []
  let depth = 0
  let quote = ""
  let start = 0
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (quote) {
      if (ch === "\\") i++
      else if (ch === quote) quote = ""
    } else if (ch === '"' || ch === "'") quote = ch
    else if (ch === "(") depth++
    else if (ch === ")") depth--
    else if (ch === ";" && depth === 0) {
      parts.push(body.slice(start, i))
      start = i + 1
    }
  }
  parts.push(body.slice(start))
  return parts.map((p) => p.trim()).filter(Boolean)
}

function declarationsOf(path: string): Declaration[] {
  const css = stripCssComments(readFileSync(path, "utf8"))
  return cssRules(css).flatMap((rule) =>
    split(rule.body).flatMap((text) => {
      const match = /^(--[\w-]+)\s*:([\s\S]*)$/.exec(text)
      if (!match) return []
      return [
        {
          path,
          wrappers: rule.wrappers,
          selector: rule.selector.replace(/\s+/g, " ").trim(),
          property: match[1] as string,
          value: (match[2] as string).replace(/\s+/g, " ").trim(),
        },
      ]
    }),
  )
}

const GENERATED = join("src", "theme", "styles", "generated") + sep
const ALL = sheets("src")
/** The kit's own stylesheets: everything but the compiled style definitions. */
const KIT = ALL.filter((path) => !path.startsWith(GENERATED))
const KIT_TEXT = KIT.map((path) => stripCssComments(readFileSync(path, "utf8")))
const DECLARATIONS = ALL.flatMap(declarationsOf)

const NAMES: readonly string[] = Object.values(PAINT_TOKENS)

const inBase = (d: Declaration) => d.wrappers[0] === "@layer base"
const inStyleLayer = (d: Declaration) =>
  /^@layer style\.[a-z]+$/.test(d.wrappers[0] ?? "")

describe("paint token defaults and readers", () => {
  it("reads every kit stylesheet", () => {
    expect(KIT.length).toBeGreaterThan(100)
    expect(KIT).toContain(join("src", "styles", "theme.css"))
  })

  it.each(NAMES)("declares %s on the layered :root", (name) => {
    const defaults = DECLARATIONS.filter(
      (d) => d.property === name && inBase(d) && d.selector === ":root",
    )
    expect(defaults.length, name).toBeGreaterThan(0)
    // A :root default applies in both modes; a dark one may override it,
    // but only on the dark :root.
    for (const d of DECLARATIONS.filter(
      (d) => d.property === name && inBase(d) && d.selector !== ":root",
    )) {
      expect(d.selector, `${name} in ${d.path}`).toMatch(
        /^(?::root\[data-mode="dark"\]|:root:not\(\[data-mode="dark"\]\)|\[data-[\w-]+="[\w-]+"\](?::not\([^)]*\))?)$/,
      )
    }
  })

  it.each(NAMES)("reads %s somewhere in the kit", (name) => {
    const reader = new RegExp(`var\\(\\s*${name}\\s*[,)]`)
    expect(
      KIT_TEXT.some((text) => reader.test(text)),
      name,
    ).toBe(true)
  })
})

describe("where a paint token is set", () => {
  // A rule outside @layer base and the style layers would beat every
  // style's value for the token, or a style's value would never reach the
  // element the rule paints.
  it("sets a paint token only in @layer base or a style layer", () => {
    const offenders = DECLARATIONS.filter(
      (d) => NAMES.includes(d.property) && !inBase(d) && !inStyleLayer(d),
    ).map(
      (d) =>
        `${d.property} in ${d.path}: ${[...d.wrappers, d.selector].join(" > ")}`,
    )
    expect(offenders).toEqual([])
  })

  /** Custom properties a rule outside the default and style layers sets. */
  const AXIS_OWNED = new Set(
    DECLARATIONS.filter((d) => !inBase(d) && !inStyleLayer(d)).map(
      (d) => d.property,
    ),
  )

  const ENGINE = new Set(
    (["light", "dark"] as const).flatMap((mode) =>
      [
        {},
        {
          railTone: "inverse" as const,
          barTone: "accent" as const,
          hairlines: "alpha" as const,
          signalColor: "green" as const,
        },
      ].flatMap((extra) =>
        Object.keys(
          generateTokens({
            accentColor: "blue",
            surfaceColor: "zinc",
            frosted: false,
            backgroundStyle: "solid",
            mode,
            contrast: "standard",
            darkAccentChroma: "standard",
            tintWithAccent: false,
            ...extra,
          }),
        ),
      ),
    ),
  )

  it("shares no name with an axis-owned or engine token", () => {
    expect(NAMES.filter((name) => AXIS_OWNED.has(name))).toEqual([])
    expect(NAMES.filter((name) => ENGINE.has(name))).toEqual([])
  })

  it("lets no built-in style write an axis-owned or engine token", () => {
    for (const [style, definition] of Object.entries(BUILTIN_STYLES)) {
      const written = [
        ...Object.values(definition.tokens ?? {}).flatMap((map) =>
          Object.keys(map ?? {}).map(
            (token) => PAINT_TOKENS[token as keyof typeof PAINT_TOKENS],
          ),
        ),
        ...Object.values(definition.vars ?? {}).flatMap((map) =>
          Object.keys(map ?? {}),
        ),
        ...(definition.when ?? []).flatMap((entry) => [
          ...Object.keys(entry.tokens ?? {}).map(
            (token) => PAINT_TOKENS[token as keyof typeof PAINT_TOKENS],
          ),
          ...Object.keys(entry.vars ?? {}),
        ]),
      ]
      expect(
        written.filter((name) => AXIS_OWNED.has(name) || ENGINE.has(name)),
        style,
      ).toEqual([])
    }
  })
})

describe("signatures in the kit stylesheets", () => {
  // The engine solves the raised chrome's fill and tiers from the tone, so
  // `raised` needs no rule of its own.
  const ENGINE_DRAWN = new Set(["railTone:raised", "barTone:raised"])

  // Control anatomy values whose kit rules are not written yet. The set is
  // deleted, with its guard, once every value has its rules.
  const PENDING_SIGNATURE_VALUES = new Set([
    "buttonStyle:key",
    "buttonStyle:soft",
    "buttonStyle:glass",
    "iconButton:round",
    "switchStyle:track",
    "switchStyle:slide",
    "switchStyle:marked",
    "checkStyle:outline",
    "checkStyle:round",
    "tabStyle:underline",
    "tabStyle:pill",
    "tabStyle:outline",
    "sliderStyle:bar",
    "sliderStyle:knob",
    "sliderStyle:ruled",
  ])

  const SELECTORS = KIT_TEXT.join("\n")

  const NON_DEFAULT = STAMPED_SIGNATURES.flatMap((key) =>
    (SIGNATURES[key].values as readonly string[])
      .filter((value) => value !== SIGNATURES[key].default)
      .map((value) => [key, value] as const),
  )

  it.each(NON_DEFAULT)("draws %s %s", (key, value) => {
    if (ENGINE_DRAWN.has(`${key}:${value}`)) return
    if (PENDING_SIGNATURE_VALUES.has(`${key}:${value}`)) return
    expect(SELECTORS).toContain(`[${signatureAttribute(key)}="${value}"]`)
  })

  it("holds back only non-default values of stamped signatures", () => {
    const known = new Set(NON_DEFAULT.map(([key, value]) => `${key}:${value}`))
    expect(
      [...PENDING_SIGNATURE_VALUES].filter((entry) => !known.has(entry)),
    ).toEqual([])
  })

  it.each(SIGNATURES.navSelection.values as readonly string[])(
    "draws the %s nav selection",
    (value) => {
      expect(
        readFileSync(
          join("src", "layout", "sidebar", "sidebar-selection.css"),
          "utf8",
        ),
      ).toContain(`[data-sidebar-selection="${value}"]`)
    },
  )
})

describe("the kit's forced fallback", () => {
  const BACKDROP_AND_TRANSLUCENCY = Object.keys(PAINT_TOKENS).filter(
    (token) =>
      token.endsWith("Backdrop") ||
      [
        "chromeCanvas",
        "surfaceFillAlpha",
        "overlayFillAlpha",
        "overlayFillLayers",
        "overlayFillBase",
        "overlayFillBlend",
      ].includes(token),
  )

  it("finds the backdrop and translucency tokens", () => {
    expect(BACKDROP_AND_TRANSLUCENCY).toEqual(
      expect.arrayContaining([
        "chromeBackdrop",
        "overlayBackdrop",
        "surfaceBackdrop",
        "scrimBackdrop",
      ]),
    )
  })

  it.each(BACKDROP_AND_TRANSLUCENCY)("resets %s", (token) => {
    expect(Object.keys(KIT_FALLBACK)).toContain(token)
  })
})
