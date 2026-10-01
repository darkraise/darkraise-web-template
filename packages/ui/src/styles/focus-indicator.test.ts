import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

// Menu-style rows mark their active item with `bg-accent`, which the engine
// resolves to surface[100] on a white popover in light mode and surface[800]
// on a surface[900] popover in dark. Both land near 1.1:1 against the surface
// behind them — far under the 3:1 a focus indicator has to clear. Paired with
// the `outline-none` these rows also carry, that left keyboard focus invisible
// in every menu, select, combobox and command palette in the kit.
//
// The indicator is keyed differently depending on how a component tracks its
// active row:
//
//   roving tabindex  → the row really is focused, so `:focus-visible` matches
//                      and paints only for keyboard use.
//   activedescendant → DOM focus never leaves the input, so `:focus-visible`
//                      can never match; the ring keys off the state attribute
//                      instead and is dropped under the pointer.
//
// Both are written as standalone rules rather than `@apply focus-ring-inset`
// inside the base rule. Prettier's Tailwind class sorter rewrites `@apply`
// lists on every commit, and where a base rule carries `focus:outline-none`
// the resulting order is what breaks the tie between two equal-specificity
// pseudo-class rules — so the ring cannot live there safely.

const RING =
  /outline:\s*2px solid hsl\(var\(--focus-ring\)\);\s*outline-offset:\s*-2px/

const SELECTORS: Array<[string, string]> = [
  // roving tabindex
  [
    "src/components/menu-primitives/menu-primitives.css",
    ".dr-menu-sub-trigger:focus-visible",
  ],
  [
    "src/components/menu-primitives/menu-primitives.css",
    ".dr-menu-item:focus-visible",
  ],
  [
    "src/components/menu-primitives/menu-primitives.css",
    ".dr-menu-checkbox-item:focus-visible",
  ],
  [
    "src/components/menu-primitives/menu-primitives.css",
    ".dr-menu-radio-item:focus-visible",
  ],
  ["src/components/menubar/menubar.css", ".dr-menubar-trigger:focus-visible"],
  [
    "src/components/menubar/menubar.css",
    ".dr-menubar-sub-trigger:focus-visible",
  ],
  ["src/components/menubar/menubar.css", ".dr-menubar-item:focus-visible"],
  [
    "src/components/menubar/menubar.css",
    ".dr-menubar-checkbox-item:focus-visible",
  ],
  [
    "src/components/menubar/menubar.css",
    ".dr-menubar-radio-item:focus-visible",
  ],
  ["src/components/select/select.css", ".dr-select-item:focus-visible"],
  [
    "src/components/navigation-menu/navigation-menu.css",
    ".dr-navigation-menu-trigger:focus-visible",
  ],
  [
    "src/components/time-picker/time-picker.css",
    ".dr-time-column-input:focus-visible",
  ],
  [
    "src/components/time-picker/time-picker.css",
    ".dr-time-column-item:focus-visible",
  ],
  [
    "src/components/tree-view/tree-view.css",
    ".dr-tree-view-branch-control:focus-visible",
  ],
  [
    "src/components/tree-view/tree-view.css",
    ".dr-tree-view-item:focus-visible",
  ],
  // aria-activedescendant
  [
    "src/components/command/command.css",
    '.dr-command-item[data-selected="true"]:not(:hover)',
  ],
  [
    "src/components/combobox/combobox.css",
    '.dr-combobox-item[data-highlighted="true"]:not(:hover)',
  ],
  [
    "src/components/listbox/listbox.css",
    '.dr-listbox-item[data-focused="true"]:not(:hover)',
  ],
  [
    "src/components/virtualized-dropdown-menu/virtualized-dropdown-menu.css",
    ".dr-vdm-item[data-active]:not(:hover)",
  ],
]

/**
 * The declaration block a selector participates in, or null when the selector
 * appears nowhere. Handles grouped selectors, where the rule body follows the
 * last selector in the list rather than this one.
 */
function ruleBodyFor(css: string, selector: string): string | null {
  const at = css.indexOf(selector)
  if (at === -1) return null
  const open = css.indexOf("{", at)
  if (open === -1) return null
  // Everything between the selector and its `{` must be more selectors,
  // otherwise the match landed inside an unrelated rule or a comment.
  const between = css.slice(at + selector.length, open)
  if (!/^[\s,.\-:[\]="\w()]*$/.test(between)) return null
  const close = css.indexOf("}", open)
  return close === -1 ? null : css.slice(open + 1, close)
}

describe("menu-style rows carry a visible focus indicator", () => {
  it.each(SELECTORS)("%s → %s draws the focus ring", (path, selector) => {
    const body = ruleBodyFor(readFileSync(path, "utf8"), selector)
    expect(body, `no rule found for ${selector}`).not.toBeNull()
    expect(body?.replace(/\s+/g, " ")).toMatch(RING)
  })

  it("keeps focus-ring utilities out of the rows' @apply, where the class sorter would move them", () => {
    // Each row above draws its ring in a standalone rule placed after its
    // base rule, which wins on source order for good. An `@apply
    // focus-ring-*` in a rule that styles the row itself is the fragile form
    // this replaced. Other controls in the same files (Combobox's clear and
    // toggle affordances, for instance) apply the utility safely: they are
    // not rows.
    const offenders: string[] = []
    for (const [path, selector] of SELECTORS) {
      const row = /\.(dr-[\w-]+)/.exec(selector)?.[1] ?? ""
      const onRow = new RegExp(`\\.${row}(?![\\w-])`)
      const css = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
      for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const stylesRow = (match[1] as string)
          .split(",")
          .some((s) => onRow.test(s.trim().split(/\s+/).pop() ?? ""))
        if (
          stylesRow &&
          /@apply[^;]*(?<![\w-])focus-ring/.test(match[2] as string)
        ) {
          offenders.push(`${row} (${path})`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})

/** Every declaration block whose selector list contains `selector`. */
function allRuleBodiesFor(css: string, selector: string): string {
  const bodies: string[] = []
  let from = 0
  for (;;) {
    const at = css.indexOf(selector, from)
    if (at === -1) break
    from = at + selector.length
    const after = css[at + selector.length] ?? ""
    if (/[\w-]/.test(after)) continue
    const open = css.indexOf("{", at)
    const close = css.indexOf("}", open)
    if (open === -1 || close === -1) break
    const between = css.slice(at + selector.length, open)
    if (!/^[\s,.\-:[\]="\w()]*$/.test(between)) continue
    bodies.push(css.slice(open + 1, close))
  }
  return bodies.join("\n")
}

const APPLIED: Array<[string, string, string]> = [
  [
    "src/layout/sidebar/sidebar-nav.css",
    ".dr-sidebar-nav-link",
    "focus-ring-inset",
  ],
  [
    "src/layout/sidebar/sidebar-nav.css",
    ".dr-sidebar-nav-popover-trigger",
    "focus-ring-inset",
  ],
  [
    "src/layout/sidebar/sidebar-nav.css",
    ".dr-sidebar-nav-chevron-button",
    "focus-ring-inset",
  ],
  [
    "src/components/accordion/accordion.css",
    ".dr-accordion-trigger",
    "focus-ring-inset",
  ],
  [
    "src/layout/page-header/page-header.css",
    ".dr-page-header-tab",
    "focus-ring-inset",
  ],
  ["src/components/banner/banner.css", ".dr-banner-close", "focus-ring"],
  ["src/components/sonner/sonner.css", ".dr-toast-action", "focus-ring"],
  ["src/components/sonner/sonner.css", ".dr-toast-cancel", "focus-ring"],
  ["src/components/sonner/sonner.css", ".dr-toast-close", "focus-ring"],
  [
    "src/components/multi-select/multi-select.css",
    ".dr-multi-select-control",
    "focus-ring-input-wrapper",
  ],
  [
    "src/components/multi-select/multi-select.css",
    ".dr-multi-select-clear",
    "focus-ring-inset",
  ],
  [
    "src/components/multi-select/multi-select.css",
    ".dr-multi-select-toggle",
    "focus-ring-inset",
  ],
]

describe("controls that had no focus indicator", () => {
  it.each(APPLIED)("%s → %s applies %s", (path, selector, utility) => {
    const css = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
    const bodies = allRuleBodiesFor(css, selector)
    expect(bodies).toMatch(
      new RegExp(`@apply[^;]*(?<![\\w-])${utility}(?![\\w-])`),
    )
  })

  it("the slider thumb draws its ring as an outline, which presets cannot remove", () => {
    const css = readFileSync("src/components/slider/slider.css", "utf8")
    const body = ruleBodyFor(css, ".dr-slider-thumb:focus-visible")
    expect(body?.replace(/\s+/g, " ")).toMatch(
      /outline:\s*2px solid hsl\(var\(--focus-ring\)\);\s*outline-offset:\s*2px/,
    )
  })
})

function withoutComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "")
}

/** The body of the first rule whose selector list contains exactly `selector`. */
function exactRuleBody(css: string, selector: string): string | null {
  for (const match of withoutComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = (match[1] as string)
      .split(",")
      .map((s) => s.trim().replace(/\s+/g, " "))
    if (selectors.includes(selector)) return match[2] as string
  }
  return null
}

function sourcesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourcesUnder(path)
    if (/\.(test|stories)\.tsx?$/.test(entry.name)) return []
    return /\.(css|tsx?)$/.test(entry.name) ? [path] : []
  })
}

function flat(path: string): string {
  return withoutComments(readFileSync(path, "utf8")).replace(/\s+/g, " ")
}

// Standalone controls draw the ring outside. Packed or clipped ones pull it
// inside, where a neighbour or the wrapper's overflow would otherwise cover it.
const OUTSET: Array<[string, string]> = [
  ["src/components/button/button.css", ".dr-btn"],
  ["src/components/toggle/toggle.css", ".dr-toggle"],
]

const INSET: Array<[string, string]> = [
  ["src/components/button-group/button-group.css", ".dr-button-group .dr-btn"],
  ["src/components/input/input.css", ".dr-input-action .dr-btn"],
  [
    "src/components/number-input/number-input.css",
    ".dr-number-input-action .dr-btn",
  ],
  ["src/components/number-input/number-input.css", ".dr-number-input-stepper"],
  [
    "src/components/password-input/password-input.css",
    ".dr-password-input-trigger",
  ],
  [
    "src/components/toggle-group/toggle-group.css",
    ".dr-toggle-group .dr-toggle",
  ],
  [
    "src/components/segment-group/segment-group.css",
    ".dr-segment-group .dr-segment-group-item",
  ],
  ["src/components/calendar/calendar.css", ".dr-btn.dr-calendar-day-btn"],
]

describe("one focus outline pair", () => {
  it("draws focus-ring at +2px and focus-ring-inset at -2px, both 2px wide", () => {
    const theme = flat("src/styles/theme.css")
    expect(theme).toMatch(
      /@utility focus-ring \{ &:focus-visible \{ outline: 2px solid hsl\(var\(--focus-ring\)\); outline-offset: 2px; \} \}/,
    )
    expect(theme).toMatch(
      /@utility focus-ring-inset \{ &:focus-visible \{ outline: 2px solid hsl\(var\(--focus-ring\)\); outline-offset: -2px; \} \}/,
    )
  })

  it("has no third ring utility", () => {
    const offenders = sourcesUnder("src").filter((path) =>
      readFileSync(path, "utf8").includes("focus-ring-tight"),
    )
    expect(offenders).toEqual([])
  })

  it.each(OUTSET)("%s → %s applies focus-ring", (path, selector) => {
    const body = exactRuleBody(readFileSync(path, "utf8"), selector)
    expect(body, `no rule found for ${selector}`).not.toBeNull()
    expect(body).toMatch(/@apply[^;]*(?<![\w-])focus-ring(?![\w-])/)
  })

  it.each(INSET)("%s → %s applies focus-ring-inset", (path, selector) => {
    const body = exactRuleBody(readFileSync(path, "utf8"), selector)
    expect(body, `no rule found for ${selector}`).not.toBeNull()
    expect(body).toMatch(/@apply[^;]*(?<![\w-])focus-ring-inset(?![\w-])/)
  })

  it("keeps the calendar's keyboard-focused day on the inset geometry", () => {
    expect(flat("src/components/calendar/calendar.css")).toMatch(
      /\.dr-calendar-day-btn:where\([^{]*\) \{ position: relative; z-index: 10; outline: 2px solid hsl\(var\(--focus-ring\)\); outline-offset: -2px; \}/,
    )
  })

  it("rings the colour picker's area and hue strip at the standalone offset", () => {
    expect(flat("src/components/color-picker/color-picker.css")).toMatch(
      /\.dr-color-picker-sv:focus-visible, \.dr-color-picker-hue:focus-visible \{ outline: 2px solid hsl\(var\(--focus-ring\)\); outline-offset: 2px; \}/,
    )
  })
})
