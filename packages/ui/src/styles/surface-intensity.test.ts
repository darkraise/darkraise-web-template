import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

// jsdom never parses CSS, so the rules themselves are what this asserts.
// The three declaration lists must stay in step: a surface added to one and
// forgotten in another silently stops responding to the axis, or keeps a
// stale fill under `none`.
const FILLS = [
  "--surface-card-fill",
  "--surface-popover-fill",
  "--surface-raised-fill",
  "--surface-overlay-fill",
  "--surface-card-fill-opaque",
]

function css(): string {
  return readFileSync("src/styles/theme.css", "utf8").replace(
    /\/\*[\s\S]*?\*\//g,
    "",
  )
}

// Prettier runs on commit and wraps long selectors and color-mix() calls
// across lines, so every assertion about source text is made against
// whitespace-collapsed input or it breaks the moment the hook reformats.
//
// Rules are parsed rather than substring-searched on purpose. The mix
// block's own selector CONTAINS the literal `[data-surface-intensity="none"]`
// inside its :not(), so a naive indexOf for the `none` block finds the mix
// block instead and every assertion about `none` silently tests the wrong
// rule. Matching selector-then-brace avoids that.
interface Rule {
  selector: string
  body: string
}

function rules(): Rule[] {
  const flat = css().replace(/\s+/g, " ")
  return [...flat.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selector: m[1].trim(),
    body: m[2].trim(),
  }))
}

function bodyOf(selector: string): string {
  const found = rules().find((r) => r.selector === selector)
  if (!found) throw new Error(`no rule with selector ${selector}`)
  return found.body
}

const MIX_SELECTOR =
  '[data-surface-intensity]:not( [data-surface-intensity="balanced"] ):not( [data-surface-intensity="none"] )'

function mixBody(): string {
  const found = rules().find(
    (r) =>
      r.selector.startsWith("[data-surface-intensity]:not(") &&
      r.selector.includes('"balanced"') &&
      r.selector.includes('"none"'),
  )
  if (!found) throw new Error("no mix block")
  return found.body
}

describe("surface intensity rules", () => {
  it.each(FILLS)("declares %s on :root without a mix", (fill) => {
    const root = bodyOf(":root")
    expect(root).toContain(`${fill}: hsl(`)
    const decl = root.split(`${fill}:`)[1].split(";")[0]
    expect(decl).not.toContain("color-mix")
  })

  it("excludes balanced and none from the mix block", () => {
    const mix = rules().find((r) =>
      r.selector.startsWith("[data-surface-intensity]:not("),
    )
    const normalised = mix?.selector
      .replace(/:not\(\s*/g, ":not( ")
      .replace(/\s*\)/g, " )")
    expect(normalised).toBe(MIX_SELECTOR)
  })

  it.each(FILLS)("mixes %s for the washed steps", (fill) => {
    expect(mixBody()).toContain(`${fill}: color-mix(`)
  })

  it.each(FILLS)("blanks %s for none", (fill) => {
    expect(bodyOf('[data-surface-intensity="none"]')).toContain(
      `${fill}: transparent`,
    )
  })

  it.each(["flat", "subtle", "bold"])("sets both wash vars for %s", (step) => {
    const body = bodyOf(`[data-surface-intensity="${step}"]`)
    expect(body).toContain("--surface-wash:")
    expect(body).toContain("--surface-wash-color:")
  })

  // `balanced` gets a real rule so the prop is an absolute override: a
  // component set to balanced inside a washed theme must render unwashed, not
  // inherit the ancestor's wash. The rule must stay mix-free or the default
  // theme stops being byte-identical to the pre-axis build.
  it.each(FILLS)("redeclares %s for balanced without a mix", (fill) => {
    const body = bodyOf('[data-surface-intensity="balanced"]')
    expect(body).toContain(`${fill}: hsl(`)
    expect(body).not.toContain("color-mix")
  })

  // Guards every repointed token, not just two: reverting any one of them to
  // an inline hsl() silently drops that surface out of the axis.
  it("routes the Tailwind colors through the fill variables", () => {
    const theme = css().replace(/\s+/g, " ")
    expect(theme).toContain("--color-card: var(--surface-card-fill)")
    expect(theme).toContain("--color-popover: var(--surface-popover-fill)")
    expect(theme).toContain(
      "--color-surface-raised: var(--surface-raised-fill)",
    )
    expect(theme).toContain(
      "--color-surface-overlay: var(--surface-overlay-fill)",
    )
  })

  // Without this, a mix block with hardcoded percentages passes every other
  // assertion while making flat, subtle and bold render identically.
  it.each(FILLS)("drives %s from the wash variables", (fill) => {
    const decl = mixBody().split(`${fill}:`)[1].split(";")[0]
    expect(decl).toContain("var(--surface-wash-color)")
    expect(decl).toContain("var(--surface-wash)")
  })
})
