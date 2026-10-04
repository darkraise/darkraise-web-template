import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

// Paths resolve from the vitest project root, packages/ui. Comments go and
// whitespace collapses, so prettier's line breaks never change a match.
const CSS = readFileSync("src/layout/sidebar/sidebar-selection.css", "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\s+/g, " ")
  .replace(/\(\s/g, "(")
  .replace(/\s\)/g, ")")
const THEME = readFileSync("src/styles/theme.css", "utf8")

/** The body of the first rule whose whole selector is `selector`. */
function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = new RegExp(`(?:^|[{}])\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(
    CSS,
  )
  if (!match) throw new Error(`no rule for ${selector}`)
  return (match[1] ?? "").trim()
}

/** The text inside the first `@media <query> { … }` block. */
function media(query: string): string {
  const start = CSS.indexOf(`@media ${query}`)
  if (start < 0) throw new Error(`no @media ${query}`)
  const open = CSS.indexOf("{", start)
  let depth = 0
  for (let i = open; i < CSS.length; i++) {
    if (CSS[i] === "{") depth++
    else if (CSS[i] === "}" && --depth === 0) return CSS.slice(open + 1, i)
  }
  throw new Error(`unclosed @media ${query}`)
}

const TOKENS = [
  "surface",
  "edge",
  "shadow",
  "glow",
  "backdrop",
  "marker",
  "tile",
  "icon",
].map((name) => `--sidebar-active-${name}:`)

const OPAQUE_CHIP = [
  "--sidebar-active-surface: var(--sidebar-chip-opaque);",
  "--sidebar-active-edge: var(--sidebar-chip-edge);",
  "--sidebar-active-shadow: var(--sidebar-chip-shadow);",
  "--sidebar-active-glow: 0 0 transparent;",
  "--sidebar-active-backdrop: none;",
]

const ICON_RAIL =
  ':is(.dr-sidebar-nav[data-collapsed="true"], .dr-stacked-layout-rail-nav)'

describe("sidebar selection looks", () => {
  it.each(["chip", "pill", "tile", "frosted"])(
    "the %s look sets all eight tokens",
    (look) => {
      const body = rule(`[data-sidebar-selection="${look}"]`)
      for (const token of TOKENS) expect(body, token).toContain(token)
    },
  )

  it("keeps an opaque chip colour in both modes", () => {
    expect(rule("[data-sidebar-selection]")).toContain(
      "--sidebar-chip-opaque: var(--surface-card-fill-opaque);",
    )
    expect(rule('[data-mode="dark"] [data-sidebar-selection]')).toContain(
      "--sidebar-chip-opaque: color-mix(in srgb, var(--surface-card-fill-opaque) 93%, hsl(0 0% 100%));",
    )
  })

  it("turns Frosted into the opaque chip, shadow included, without blur", () => {
    const blurless = rule(
      '[data-glass-blur="none"] [data-sidebar-selection="frosted"]',
    )
    const preference = media(
      "(prefers-reduced-transparency: reduce), (prefers-contrast: more)",
    )
    for (const declaration of OPAQUE_CHIP) {
      expect(blurless, declaration).toContain(declaration)
      expect(preference, declaration).toContain(declaration)
    }
    expect(preference).toContain('[data-sidebar-selection="frosted"] {')
  })

  it("drops every shadow layer under Flat, after the Frosted fallback", () => {
    const flat = '[data-sidebar-selection][data-sidebar-shadow="none"]'
    const body = rule(flat)
    expect(body).toContain("--sidebar-active-shadow: 0 0 transparent;")
    expect(body).toContain("--sidebar-active-glow: 0 0 transparent;")
    expect(CSS.indexOf(`${flat} {`)).toBeGreaterThan(
      CSS.indexOf("@media (prefers-reduced-transparency"),
    )
  })

  it("names no style, which only theme/styles may do", () => {
    expect(CSS).not.toMatch(/data-\[?(?:style|preset)\s*[\]=~|^$*]/)
  })

  it("draws Tile without its chip in an icon-only rail", () => {
    const body = rule(`${ICON_RAIL}[data-sidebar-selection="tile"]`)
    expect(body).toContain("--sidebar-active-surface: transparent;")
    expect(body).toContain("--sidebar-active-edge: transparent;")
    expect(body).toContain("--sidebar-active-shadow: 0 0 transparent;")
  })

  it("paints the indicator only from the tokens", () => {
    const body = rule(".dr-sidebar-nav-indicator")
    expect(body).toContain("background: var(--sidebar-active-surface);")
    expect(body).toContain(
      "box-shadow: 0 0 0 1px var(--sidebar-active-edge), var(--sidebar-active-shadow), var(--sidebar-active-glow);",
    )
    expect(body).toContain("backdrop-filter: var(--sidebar-active-backdrop);")
  })

  it("puts Pill's marker on the rail's edge in an icon-only rail", () => {
    expect(rule(`${ICON_RAIL} > .dr-sidebar-nav-indicator::before`)).toContain(
      "inset-inline-start: calc(-1 * var(--indicator-x, 0px));",
    )
  })

  it("lets the current row draw the marker until the indicator is ready", () => {
    expect(
      rule(
        '[data-sidebar-selection]:not([data-indicator="ready"]) .dr-sidebar-nav-current::before',
      ),
    ).toContain("background: var(--sidebar-active-marker);")
  })

  it("hands the row's surface to a ready indicator", () => {
    expect(rule('[data-indicator="ready"] .dr-sidebar-nav-current')).toContain(
      "background: transparent;",
    )
  })

  it("does not transition under reduced motion", () => {
    expect(media("(prefers-reduced-motion: reduce)")).toContain(
      '.dr-sidebar-nav-indicator[data-animate="true"] { transition: none; }',
    )
    expect(media("(prefers-reduced-motion: reduce)")).toContain(
      ".dr-sidebar-nav-indicator, .dr-sidebar-nav-indicator::before { transition: none; }",
    )
  })

  it("is imported after the sidebar nav stylesheet", () => {
    const nav = THEME.indexOf('@import "../layout/sidebar/sidebar-nav.css";')
    const selection = THEME.indexOf(
      '@import "../layout/sidebar/sidebar-selection.css";',
    )
    expect(nav).toBeGreaterThan(-1)
    expect(selection).toBeGreaterThan(nav)
  })
})
