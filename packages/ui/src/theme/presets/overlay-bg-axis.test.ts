import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

// Every preset must let the surface-intensity axis reach the overlay tier.
// Three presets used to define --surface-overlay-bg straight from
// --background, which the axis never washes, making Dialog/Popover/Tooltip/
// Select/Command and every menu silent no-ops there. This is the regression
// this test exists to prevent.
const PRESETS = [
  "playful/playful.css",
  "neon/neon.css",
  "scifi/scifi.css",
  "terminal/terminal.css",
  "glass/glass.css",
]

// Selector-then-brace matching, not a substring search: the mix block's own
// selector contains the literal `[data-surface-intensity="none"]` inside its
// :not(), so indexOf would return the wrong rule.
function themeRuleBody(selector: string): string {
  const flat = readFileSync("src/styles/theme.css", "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
  const found = [...flat.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
    (m) => m[1].trim() === selector,
  )
  if (!found) throw new Error(`no rule with selector ${selector}`)
  return found[2].trim()
}

describe("preset overlay backgrounds", () => {
  it.each(PRESETS)("%s composes the wash", (file) => {
    const css = readFileSync(`src/theme/presets/${file}`, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
    const decls = css.match(/--surface-overlay-bg:[^;]*?;/g) ?? []
    expect(decls.length).toBeGreaterThan(0)
    for (const decl of decls) {
      expect(decl).toContain("--surface-overlay-wash")
    }
  })

  it("defines the shared wash fragment in the base theme", () => {
    const css = readFileSync("src/styles/theme.css", "utf8")
    expect(css).toContain("--surface-overlay-wash:")
  })

  // balanced and none must break inheritance for the overlay tier too, or the
  // per-component prop silently fails on dialogs, menus, tooltips and popovers
  // nested inside a washed ancestor.
  it("resets the overlay wash for balanced", () => {
    const body = themeRuleBody('[data-surface-intensity="balanced"]')
    expect(body).toContain("--surface-overlay-wash: transparent")
    expect(body).toContain("--surface-overlay-wash-amount: 0%")
  })

  it("blanks the overlay background for none", () => {
    const body = themeRuleBody('[data-surface-intensity="none"]')
    expect(body).toContain("--surface-overlay-bg: transparent")
  })
})
