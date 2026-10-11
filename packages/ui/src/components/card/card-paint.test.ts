import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { cssRules } from "../../test/css-rules"
import { stripCssComments } from "../../test/strip-css-comments"

// A card reads its border, radius, rim and backdrop from style tokens, and
// the divider and footer signatures restyle its regions from the root
// attribute. jsdom computes no cascade, so the source rules are what this
// asserts; the effective values are checked in Chromium by the template's
// e2e suite.

const CARD = join("src", "components", "card", "card.css")

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
  return cssRules(stripCssComments(readFileSync(CARD, "utf8"))).map((rule) => ({
    selectors: rule.selector
      .split(/,(?![^(]*\))/)
      .map(normalise)
      .filter(Boolean),
    wrappers: rule.wrappers,
    body: normalise(rule.body),
  }))
}

/** Every body of a rule whose selector list holds `selector`, joined. */
function bodyOf(selector: string, wrappers?: string[]): string {
  const bodies = rules()
    .filter((rule) => rule.selectors.includes(selector))
    .filter(
      (rule) =>
        wrappers === undefined ||
        rule.wrappers.join(" > ") === wrappers.join(" > "),
    )
    .map((rule) => rule.body)
  if (bodies.length === 0) throw new Error(`no rule ${selector} in ${CARD}`)
  return bodies.join(" ")
}

describe("card token defaults", () => {
  it.each([
    ["--card-border", "hsl(var(--border-subtle))"],
    ["--card-radius", "var(--radius)"],
    ["--card-rim", "none"],
    ["--surface-backdrop", "none"],
    ["--seam", "hsl(var(--border))"],
    ["--seam-highlight", "transparent"],
  ])("declares %s as %s on the layered :root", (token, value) => {
    expect(bodyOf(":root", ["@layer base"])).toContain(`${token}: ${value};`)
  })
})

describe("card token readers", () => {
  it("rounds, edges and frosts the card from its tokens", () => {
    const body = bodyOf(".dr-card")
    expect(body).toContain("rounded-[var(--card-radius)]")
    expect(body).not.toContain("rounded-[var(--radius)]")
    expect(body).toContain("border-color: var(--card-border);")
    expect(body).toContain("-webkit-backdrop-filter: var(--surface-backdrop);")
    expect(body).toContain("backdrop-filter: var(--surface-backdrop);")
    expect(body).toContain("position: relative;")
  })

  it("paints the rim as a 1px ring masked out of a pseudo-element", () => {
    expect(bodyOf(".dr-card::before")).toBe(
      'content: ""; position: absolute; inset: -1px; padding: 1px; border-radius: inherit; background: var(--card-rim); pointer-events: none; -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);',
    )
  })
})

describe("card divider signature", () => {
  const HEADER = ".dr-card > .dr-card-header:not(:last-child)"
  const FOOTER = ".dr-card > .dr-card-content + .dr-card-footer"

  it("draws hairlines between regions", () => {
    expect(bodyOf(`[data-card-divider="hairline"] ${HEADER}`)).toBe(
      "border-bottom: 1px solid hsl(var(--border-subtle));",
    )
    expect(bodyOf(`[data-card-divider="hairline"] ${FOOTER}`)).toBe(
      "border-top: 1px solid hsl(var(--border-subtle));",
    )
  })

  it("draws seams: a line with a highlight under it", () => {
    expect(bodyOf(`[data-card-divider="seam"] ${HEADER}`)).toBe(
      "border-bottom: 1px solid var(--seam); box-shadow: 0 1px 0 var(--seam-highlight);",
    )
    expect(bodyOf(`[data-card-divider="seam"] ${FOOTER}`)).toBe(
      "border-top: 1px solid var(--seam); box-shadow: inset 0 1px 0 var(--seam-highlight);",
    )
  })

  it.each([
    ".dr-card > .dr-card-header + .dr-card-content",
    ".dr-card > .dr-card-header + .dr-card-footer",
    ".dr-card > .dr-card-content + .dr-card-footer",
  ])("restores the top padding of %s under a divider", (region) => {
    expect(
      bodyOf(
        `:is([data-card-divider="hairline"], [data-card-divider="seam"]) ${region}`,
      ),
    ).toBe("padding-top: var(--density-container-p);")
  })
})

describe("card footer signature", () => {
  it("sets the footer on the page tone, ruled off and flush with the corners", () => {
    expect(
      bodyOf('[data-card-footer="inset"] .dr-card > .dr-card-footer'),
    ).toBe(
      "padding-top: var(--density-container-p); background: hsl(var(--background)); border-top: 1px solid var(--card-border); border-end-start-radius: calc(var(--card-radius) - 1px); border-end-end-radius: calc(var(--card-radius) - 1px);",
    )
  })
})
