import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

// jsdom never parses CSS, so the rules themselves are what this asserts.
//
// `.dr-card` composes `@apply glass`, and the `glass` utility writes the
// shorthand `border: 1px solid var(--fog-15)`. The fog scale resolves to
// `transparent` everywhere except inside a `.dr-surface` subtree, and a
// declaration on `.dr-card` (0,1,0) outranks the global
// `* { @apply border-border }` rule (0,0,0). Without a border-color of its
// own the default card therefore paints the same invisible 1px box as
// `border="none"`.
//
// Prettier wraps long values across lines on commit, so every assertion is
// made against whitespace-collapsed source.
function flatCss(): string {
  return readFileSync("src/components/card/card.css", "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
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
  it("paints the default tier with the theme border token", () => {
    expect(bodyOf(".dr-card")).toMatch(/border-color: hsl\(var\(--border\)\)/)
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

  it("hands the fog rim back to the glass preset", () => {
    // Glass is the only preset that populates the fog scale, and its card rim
    // is a translucent surface tint by design. The base rule's
    // `hsl(var(--border))` would replace it with a solid line.
    expect(bodyOf('[data-preset="glass"] .dr-card:not([data-border])')).toMatch(
      /border-color: var\(--fog-15\)/,
    )
  })

  it("keeps the accent tier on the brand hue", () => {
    expect(bodyOf('.dr-card[data-border="accent"]')).toMatch(
      /border-color: hsl\(var\(--primary\) \/ 0\.35\)/,
    )
  })
})
