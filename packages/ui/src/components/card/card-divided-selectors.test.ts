import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

// The divided-Card rules must stay in lockstep: padding-top is restored only
// where a rule is actually drawn above. Guarding the borders but not the
// padding leaves an unexplained gap on a card with no header, and scoping the
// footer rule with `:not(:first-child)` instead of an adjacent sibling stacks
// two 1px lines into one 2px line on a header+footer card. jsdom never parses
// CSS, so the selectors themselves are what this asserts.

function dividedSelectors(): string[] {
  const css = readFileSync("src/components/card/card.css", "utf8")
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "")
  return [...withoutComments.matchAll(/([^{}]*\[data-divided[^{}]*)\{/g)]
    .map((match) => match[1].replace(/\s+/g, " ").trim())
    .flatMap((selector) => selector.split(",").map((part) => part.trim()))
    .filter(Boolean)
}

describe("Card divided selectors", () => {
  it("guards every divided rule with a sibling combinator", () => {
    expect(dividedSelectors().sort()).toEqual(
      [
        '.dr-card[data-divided="true"] > .dr-card-content + .dr-card-footer',
        '.dr-card[data-divided="true"] > .dr-card-content + .dr-card-footer',
        '.dr-card[data-divided="true"] > .dr-card-header + .dr-card-content',
        '.dr-card[data-divided="true"] > .dr-card-header + .dr-card-footer',
        '.dr-card[data-divided="true"] > .dr-card-header:not(:last-child)',
      ].sort(),
    )
  })

  it("never restores padding on an unguarded region", () => {
    for (const selector of dividedSelectors()) {
      expect(selector).toMatch(/\+|:not\(/)
    }
  })
})
