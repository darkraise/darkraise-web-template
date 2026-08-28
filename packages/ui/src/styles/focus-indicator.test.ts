import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

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
// Both are written as standalone rules rather than `@apply focus-ring-tight`
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

  it("keeps the ring out of @apply, where the class sorter would move it", () => {
    // Scoped to the rows whose base rule carries `outline-none` — for those,
    // an `@apply focus-ring-tight` is the fragile form this replaced. Plain
    // focusable buttons elsewhere (Combobox's clear and toggle affordances,
    // for instance) apply the utility safely and are not in scope.
    const AT_RISK = [
      "src/components/menu-primitives/menu-primitives.css",
      "src/components/menubar/menubar.css",
      "src/components/select/select.css",
      "src/components/navigation-menu/navigation-menu.css",
      "src/components/time-picker/time-picker.css",
    ]
    for (const path of AT_RISK) {
      const css = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
      expect(
        css,
        `${path} reintroduced focus-ring-tight in @apply`,
      ).not.toContain("focus-ring-tight")
    }
  })
})
