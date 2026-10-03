import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

// Every preset must let the `surface` prop reach the overlay tier. Several
// presets used to define --surface-overlay-bg straight from --background,
// which the prop never reached, making Dialog/Popover/Tooltip/Select/Command
// and every menu silent no-ops there. This is the regression this test exists
// to prevent.
const PRESETS = ["glass/glass.css"]

function themeRuleBody(selector: string): string {
  const flat = readFileSync("src/styles/theme.css", "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
  const found = [...flat.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
    (m) => m[1]?.trim() === selector,
  )
  if (!found) throw new Error(`no rule with selector ${selector}`)
  const body = found[2]
  if (body === undefined) throw new Error(`rule ${selector} has no body`)
  return body.trim()
}

describe("preset overlay backgrounds", () => {
  it.each(PRESETS)("%s declares a static overlay base", (file) => {
    const css = readFileSync(`src/theme/presets/${file}`, "utf8").replace(
      /\s+/g,
      " ",
    )
    expect(css).toContain("--surface-overlay-base:")
    expect(css).not.toContain("--surface-overlay-bg:")
  })

  it("composes the overlay background only in the base theme", () => {
    const css = readFileSync("src/styles/theme.css", "utf8")
    expect(css).toContain("--surface-overlay-bg:")
    expect(css).not.toContain("--surface-overlay-wash")
  })

  // card and none must break inheritance for the overlay tier too, or the
  // per-component prop silently fails on dialogs, menus, tooltips and popovers
  // nested inside an ancestor that sets it.
  it("restores the card overlay background for card", () => {
    const body = themeRuleBody('[data-surface-fill="card"]')
    expect(body).toContain("--surface-overlay-bg:")
    expect(body).not.toContain("color-mix")
  })

  it("blanks the overlay background for none", () => {
    const body = themeRuleBody('[data-surface-fill="none"]')
    expect(body).toContain("--surface-overlay-bg: transparent")
  })
})
