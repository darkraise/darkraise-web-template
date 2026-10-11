import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { cssRules } from "../../test/css-rules"
import { stripCssComments } from "../../test/strip-css-comments"

// Under an inverse or accent tone the engine solves a region's tiers on its
// own fill: the sidebar tiers for the rail, the bar tiers for the top bar.
// Everything inside a toned region and the phone drawer that reads the page's
// generic tokens must read those tiers instead, or dark text lands on a dark
// rail.

const RAIL =
  /:root:is\(\[data-rail-tone="inverse"\], ?\[data-rail-tone="accent"\]\)/
const BAR =
  /:root:is\(\[data-bar-tone="inverse"\], ?\[data-bar-tone="accent"\]\)/

function rulesIn(path: string) {
  return cssRules(stripCssComments(readFileSync(path, "utf8"))).map((rule) => ({
    selector: rule.selector.replace(/\s+/g, " ").trim(),
    body: rule.body.replace(/\s+/g, " ").trim(),
  }))
}

const SIDEBAR = rulesIn("src/layout/sidebar/sidebar-nav.css")

/** The body of the one rule toned by `tone` whose selector matches `target`. */
function tonedRule(
  rules: ReturnType<typeof rulesIn>,
  target: RegExp,
  tone: RegExp = RAIL,
): string {
  const found = rules.filter(
    (rule) => tone.test(rule.selector) && target.test(rule.selector),
  )
  expect(found, String(target)).toHaveLength(1)
  return found[0]?.body ?? ""
}

const REMAP = [
  "--foreground: var(--sidebar-foreground-hover);",
  "--muted-foreground: var(--sidebar-foreground-muted);",
  "--primary-text: var(--sidebar-foreground-hover);",
  "--border: var(--sidebar-border);",
  "--muted: var(--sidebar-active-bg);",
  "--accent: var(--sidebar-hover-bg);",
  "--accent-foreground: var(--sidebar-foreground-hover);",
  "--field-edge: hsl(var(--sidebar-foreground-muted));",
  "color: hsl(var(--foreground));",
]

/** The rail remap with each `--sidebar-` tier renamed to the region's. */
function remap(prefix: "sidebar" | "bar"): string[] {
  return REMAP.map((line) => line.split("--sidebar-").join(`--${prefix}-`))
}

describe("chrome tone", () => {
  it.each([
    ["the rails", /\[data-region="nav"\]/, RAIL, "sidebar"],
    ["the phone drawer", /\.dr-mobile-drawer-content/, RAIL, "sidebar"],
    ["the bar", /\[data-region="bar"\]/, BAR, "bar"],
    ["a standalone header", /\.dr-layout-header/, BAR, "bar"],
  ] as const)(
    "remaps the generic tokens in %s",
    (_name, target, tone, prefix) => {
      const body = tonedRule(SIDEBAR, target, tone)
      for (const declaration of remap(prefix))
        expect(body).toContain(declaration)
    },
  )

  it("tones the bar only through the bar tone", () => {
    const railRules = SIDEBAR.filter((rule) => RAIL.test(rule.selector))
    for (const rule of railRules) {
      expect(rule.selector).not.toMatch(/data-region="bar"|\.dr-layout-header/)
    }
  })

  it("paints the phone drawer on the rail's fill", () => {
    expect(tonedRule(SIDEBAR, /\.dr-mobile-drawer-content/)).toContain(
      "background: var(--chrome-rail-bg);",
    )
  })

  it("lifts the selection looks with the rail's ink", () => {
    const body = tonedRule(SIDEBAR, /\[data-sidebar-selection\]$/)
    for (const name of ["chip", "chip-opaque", "tint", "frost"]) {
      expect(body).toMatch(
        new RegExp(
          `--sidebar-${name}: [^;]*var\\(--sidebar-foreground-hover\\)`,
        ),
      )
    }
    expect(body).toMatch(
      /--sidebar-chip-edge: hsl\(var\(--sidebar-foreground-hover\) \/ [\d.]+\);/,
    )
  })
})
