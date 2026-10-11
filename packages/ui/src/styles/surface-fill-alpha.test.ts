import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { cssRules } from "../test/css-rules"
import { stripCssComments } from "../test/strip-css-comments"

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
    [":root", ["@layer base"], "hsl(var(--card) / var(--surface-fill-alpha))"],
    [
      '[data-surface-fill="card"]',
      [],
      "hsl(var(--card) / var(--surface-fill-alpha))",
    ],
    [
      '[data-surface-fill="page"]',
      [],
      "hsl(var(--background) / var(--surface-fill-alpha))",
    ],
    [
      '[data-surface-fill="muted"]',
      [],
      "hsl(var(--muted) / var(--surface-fill-alpha))",
    ],
  ])(
    "%s composes the card fill with the alpha",
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
})
