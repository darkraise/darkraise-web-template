import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { cssRules } from "../test/css-rules"
import { stripCssComments } from "../test/strip-css-comments"
import {
  OVERLAY_ALPHA_FLOOR,
  SURFACE_ALPHA_FLOOR,
} from "../theme/config/transparency"

/** Prettier pads long values inside ( … ); undo that. */
const tight = (values: string[]) =>
  values.map((value) => value.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")"))

// A style makes the card plane translucent through one alpha. It has to sit
// inside the composed fill itself: the `surface` prop recomposes the fill on
// the element that carries it, so an alpha applied anywhere else would bake
// in <html>'s plane. Written as hsl(<triplet> / alpha), the fill at alpha 1
// still computes to the same opaque rgb() as before.

const THEME = join("src", "styles", "theme.css")

function declaration(selector: string, wrappers: string[], property: string) {
  const rules = cssRules(stripCssComments(readFileSync(THEME, "utf8"))).filter(
    (rule) =>
      rule.selector.trim() === selector &&
      rule.wrappers.join(" > ") === wrappers.join(" > "),
  )
  const values = rules.flatMap((rule) =>
    [
      ...rule.body.matchAll(new RegExp(`(?:^|;)\\s*${property}:([^;]*);`, "g")),
    ].map((match) => (match[1] as string).replace(/\s+/g, " ").trim()),
  )
  return values
}

describe("surface fill alpha", () => {
  it("defaults to opaque on the layered :root", () => {
    expect(
      declaration(":root", ["@layer base"], "--surface-fill-alpha"),
    ).toEqual(["1"])
  })

  it.each([
    [":root", ["@layer base"], "hsl(var(--card) / var(--surface-alpha))"],
    [
      '[data-surface-fill="card"]',
      [],
      "hsl(var(--card) / var(--surface-alpha))",
    ],
    [
      '[data-surface-fill="page"]',
      [],
      "hsl(var(--background) / var(--surface-alpha))",
    ],
    [
      '[data-surface-fill="muted"]',
      [],
      "hsl(var(--muted) / var(--surface-alpha))",
    ],
  ])(
    "%s composes the card fill with the effective alpha",
    (selector, wrappers, value) => {
      expect(declaration(selector, wrappers, "--surface-card-fill")).toEqual([
        value,
      ])
    },
  )

  it("keeps the opaque twin free of it", () => {
    expect(
      declaration(":root", ["@layer base"], "--surface-card-fill-opaque"),
    ).toEqual(["hsl(var(--card))"])
  })

  it("declares the overlay alpha opaque on the layered :root", () => {
    expect(
      declaration(":root", ["@layer base"], "--overlay-fill-alpha"),
    ).toEqual(["1"])
  })

  it.each([
    ["--surface-alpha", "--surface-fill-alpha", SURFACE_ALPHA_FLOOR],
    ["--overlay-alpha", "--overlay-fill-alpha", OVERLAY_ALPHA_FLOOR],
  ] as const)(
    "derives %s from %s, the Transparency scale and its floor",
    (name, declared, floor) => {
      expect(tight(declaration(":root", ["@layer base"], name))).toEqual([
        `max(${floor}, 1 - (1 - var(${declared})) * var(--glass-transparency-scale, 1))`,
      ])
    },
  )
})
