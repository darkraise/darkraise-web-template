import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { stripCssComments } from "../../test/strip-css-comments"

// jsdom never parses CSS, so the rules themselves are what this asserts.
//
// `.dr-card` declares its own border-color, a (0,1,0) declaration that
// outranks the global `* { @apply border-border }` rule (0,0,0), so the
// default card traces its shape with --card-border, whose kit default is
// the subtle rung rather than --border.
//
// Prettier wraps long values across lines on commit, so every assertion is
// made against whitespace-collapsed source.
function flatCss(): string {
  return stripCssComments(
    readFileSync("src/components/card/card.css", "utf8"),
  ).replace(/\s+/g, " ")
}

function bodyOf(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  // Anchor on the preceding brace so `.dr-card` cannot match the opening of
  // `.dr-card-header`, and so a compound selector is matched whole.
  const match = flatCss().match(
    new RegExp(`[{}]\\s*${escaped}\\s*\\{([^{}]*)\\}`),
  )
  if (!match?.[1]) throw new Error(`Rule not found in card.css: ${selector}`)
  return match[1].trim()
}

describe("Card border tiers", () => {
  it("paints the default tier with the style's card border token", () => {
    expect(bodyOf(".dr-card")).toMatch(/border-color: var\(--card-border\)/)
  })

  it("keeps the default tier visually distinct from `none`", () => {
    expect(bodyOf('.dr-card[data-border="none"]')).toMatch(
      /border-color: transparent/,
    )
    expect(bodyOf(".dr-card")).not.toMatch(/border-color: transparent/)
  })

  it("derives the strong tier from the surface-tinted border ladder", () => {
    const strong = bodyOf('.dr-card[data-border="strong"]')
    expect(strong).toMatch(/border-color: hsl\(var\(--border-strong\)\)/)
    // `--foreground` is the fixed slate neutral scale, never the selected
    // surface palette, so a foreground-alpha border reads as a cold grey
    // against every non-slate surface colour.
    expect(strong).not.toMatch(/--foreground/)
  })

  it("keeps the accent tier on the brand hue", () => {
    expect(bodyOf('.dr-card[data-border="accent"]')).toMatch(
      /border-color: hsl\(var\(--primary\) \/ 0\.35\)/,
    )
  })
})
