import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { splitToken } from "./interactive-classes"
import { cssRules } from "../test/css-rules"
import { stripCssComments } from "../test/strip-css-comments"

// Selection reads from four families instead of six visual languages: a
// neutral raised pill for view switches, an accent fill for checked and
// selected items, an accent underline with foreground text, and an accent
// tint for the active navigation row. A family token defaults at :root only
// to variables bound on <html>.

const THEME = stripCssComments(readFileSync("src/styles/theme.css", "utf8"))

/** The contents of the first block `opener` opens, braces balanced. */
function block(css: string, opener: RegExp): string {
  const match = opener.exec(css)
  if (!match) throw new Error(`no block for ${String(opener)}`)
  const start = match.index + match[0].length
  let depth = 1
  let end = start
  while (depth > 0 && end < css.length) {
    if (css[end] === "{") depth++
    else if (css[end] === "}") depth--
    end++
  }
  return css.slice(start, end - 1).replace(/\s+/g, " ")
}

interface Rule {
  selectors: string[]
  body: string
}

/** Prettier wraps long selectors inside :is( … ); undo that. */
function normalise(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
}

/** Innermost rules; wrappers such as @layer and @media are transparent. */
function rulesOf(path: string): Rule[] {
  const css = stripCssComments(readFileSync(path, "utf8"))
  return cssRules(css).map((rule) => ({
    selectors: rule.selector
      .split(/,(?![^(]*\))/)
      .map(normalise)
      .filter(Boolean),
    body: normalise(rule.body),
  }))
}

/** The body of the rule whose selector list holds `selector`. */
function bodyOf(path: string, selector: string): string {
  const rule = rulesOf(path).find((r) => r.selectors.includes(selector))
  if (!rule) throw new Error(`no rule ${selector} in ${path}`)
  return rule.body
}

const ROOT = block(THEME, /@layer base \{\s*:root \{/)
const DARK_ROOT = block(THEME, /:root\[data-mode="dark"\] \{/)

const FAMILIES: Array<[string, string]> = [
  ["--selected-view-bg", "hsl(var(--card))"],
  ["--selected-view-fg", "hsl(var(--foreground))"],
  ["--selected-view-shadow", "0 0 transparent"],
  ["--selected-check-bg", "hsl(var(--primary-fill))"],
  ["--selected-check-fg", "hsl(var(--primary-foreground))"],
  ["--selected-mark", "hsl(var(--primary-fill))"],
  ["--selected-mark-fg", "hsl(var(--foreground))"],
  ["--selected-nav-bg", "hsl(var(--sidebar-active-bg))"],
  ["--selected-nav-fg", "hsl(var(--foreground))"],
]

describe("selection family tokens", () => {
  it.each(FAMILIES)("declares %s as %s on :root", (name, value) => {
    expect(ROOT).toContain(`${name}: ${value};`)
  })

  it("raises the view-switch pill on --border in dark mode", () => {
    expect(DARK_ROOT).toContain("--selected-view-bg: hsl(var(--border));")
  })
})

const TABS = "src/components/tabs/tabs.css"
const SEGMENT = "src/components/segment-group/segment-group.css"

describe("view switch family", () => {
  it.each([
    [
      TABS,
      '.dr-tabs-indicator[data-variant="default"]',
      "background: var(--selected-view-bg);",
    ],
    [
      TABS,
      '.dr-tabs-indicator[data-variant="default"]',
      "box-shadow: var(--selected-view-shadow),",
    ],
    [
      TABS,
      '.dr-tabs-indicator[data-variant="outline"]',
      "background: var(--selected-view-bg);",
    ],
    [
      TABS,
      '.dr-tabs-trigger:is([data-variant="default"], [data-variant="outline"])[data-state="active"]',
      "color: var(--selected-view-fg);",
    ],
    [
      SEGMENT,
      ".dr-segment-group-indicator",
      "background: var(--selected-view-bg);",
    ],
    [
      SEGMENT,
      '.dr-segment-group .dr-segment-group-item[data-state="checked"]',
      "color: var(--selected-view-fg);",
    ],
    // color="accent" is an opt-in that reads the checked family.
    [
      SEGMENT,
      '.dr-segment-group[data-color="accent"] .dr-segment-group-indicator[data-variant="default"]',
      "background-color: var(--selected-check-bg);",
    ],
    [
      SEGMENT,
      '.dr-segment-group[data-color="accent"] .dr-segment-group-item[data-variant="default"][data-state="checked"]',
      "color: var(--selected-check-fg);",
    ],
  ])("%s %s reads %s", (path, selector, declaration) => {
    expect(bodyOf(path, selector)).toContain(declaration)
  })

  // The outline variants have no outline at rest, so the ring on the pill
  // is what still tells them apart from default.
  it.each([
    [TABS, '.dr-tabs-indicator[data-variant="outline"]'],
    [SEGMENT, '.dr-segment-group-indicator[data-variant="outline"]'],
  ])("%s %s rings the pill with a 1px neutral line", (path, selector) => {
    expect(bodyOf(path, selector)).toContain(
      "inset 0 0 0 1px hsl(var(--border-strong))",
    )
  })
})

const TOGGLE = "src/components/toggle/toggle.css"
const LISTBOX = "src/components/listbox/listbox.css"
const TREE = "src/components/tree-view/tree-view.css"

const CHECKED = [
  "background-color: var(--selected-check-bg);",
  "color: var(--selected-check-fg);",
]

describe("checked family: toggle, listbox and tree view", () => {
  it.each([
    [TOGGLE, '.dr-toggle[data-variant="default"][data-state="on"]'],
    [TOGGLE, '.dr-toggle[data-variant="outline"][data-state="on"]'],
    [LISTBOX, '.dr-listbox-item[data-selected="true"]'],
    [LISTBOX, '.dr-listbox-item[data-selected="true"]:hover'],
    [TREE, '.dr-tree-view-item[data-selected="true"]'],
    [
      TREE,
      '.dr-tree-view-item[data-selected="true"]:not([data-disabled]):hover',
    ],
  ])("%s %s reads the checked fill and label", (path, selector) => {
    const body = bodyOf(path, selector)
    for (const declaration of CHECKED) expect(body).toContain(declaration)
  })

  // Hover on a selected item comes from the state layer, washed toward the
  // fill's wash as the filled button does.
  it("washes the outline toggle's on state toward the fill's wash", () => {
    expect(
      bodyOf(TOGGLE, '.dr-toggle[data-variant="outline"][data-state="on"]'),
    ).toContain("--state-layer-color: hsl(var(--primary-fill-wash));")
  })

  // Outline rows select with a ring instead of the fill: a ring over the
  // selected fill would vanish (--primary on --primary-fill is near 1:1).
  it.each([
    [
      LISTBOX,
      '.dr-listbox[data-variant="outline"] .dr-listbox-item[data-selected="true"]',
    ],
    [
      TREE,
      '.dr-tree-view[data-variant="outline"] .dr-tree-view-item[data-selected="true"]',
    ],
    [
      TREE,
      '.dr-tree-view[data-variant="outline"] .dr-tree-view-branch-control[data-selected="true"]',
    ],
  ])("%s %s rings the selected row over no fill", (path, selector) => {
    const body = bodyOf(path, selector)
    expect(body).toContain("background-color: transparent;")
    expect(body).toContain("color: hsl(var(--primary-text));")
    expect(body).toContain("inset 0 0 0 1px hsl(var(--primary-text))")
  })
})

const CALENDAR = "src/components/calendar/calendar.css"
const TIME_PICKER = "src/components/time-picker/time-picker.css"
const TAGS_INPUT = "src/components/tags-input/tags-input.css"
const STEPS = "src/components/steps/steps.css"
const TIMELINE = "src/components/timeline/timeline.css"

describe("checked family: calendar, time picker, tags, steps and timeline", () => {
  it.each([
    [
      CALENDAR,
      '.dr-calendar-day-btn:is([data-selected-single="true"], [data-range-start="true"], [data-range-end="true"], [data-range-single="true"])',
    ],
    [CALENDAR, '.dr-calendar-day-btn[data-selected-single="true"]:hover'],
    [TIME_PICKER, '.dr-time-column-item[data-selected="true"]'],
    [TAGS_INPUT, '.dr-tags-input-item-preview[data-highlighted="true"]'],
    [STEPS, '.dr-steps-indicator[data-status="complete"]'],
    [TIMELINE, '.dr-timeline-indicator[data-status="complete"]'],
  ])("%s %s reads the checked fill and label", (path, selector) => {
    const body = bodyOf(path, selector)
    for (const declaration of CHECKED) expect(body).toContain(declaration)
  })

  it.each([
    [STEPS, '.dr-steps-separator[data-status="complete"]'],
    [TIMELINE, '.dr-timeline-connector[data-status="complete"]'],
  ])("%s %s draws the connector in the checked fill", (path, selector) => {
    expect(bodyOf(path, selector)).toContain(
      "background-color: var(--selected-check-bg);",
    )
  })

  it("puts no checked fill in the calendar day's @apply", () => {
    expect(bodyOf(CALENDAR, ".dr-calendar-day-btn")).not.toMatch(
      /(?<![\w-])(?:bg-primary-fill|text-primary-foreground)(?![\w-])/,
    )
  })
})

const PAGINATION = "src/components/pagination/pagination.css"

describe("checked family: pagination", () => {
  it("fills the current page in both variants", () => {
    const body = bodyOf(
      PAGINATION,
      '.dr-pagination-link[data-active="true"][data-variant="ghost"]',
    )
    for (const declaration of CHECKED) expect(body).toContain(declaration)
  })
})

const PAGE_HEADER = "src/layout/page-header/page-header.css"

describe("underline family", () => {
  it.each([
    [
      TABS,
      '.dr-tabs-indicator[data-variant="underline"]',
      "background-color: var(--selected-mark);",
    ],
    [
      TABS,
      '.dr-tabs-trigger[data-variant="underline"][data-state="active"]',
      "color: var(--selected-mark-fg);",
    ],
    [
      PAGE_HEADER,
      '.dr-page-header-tab[data-active="true"]',
      "border-color: var(--selected-mark);",
    ],
    [
      PAGE_HEADER,
      '.dr-page-header-tab[data-active="true"]',
      "color: var(--selected-mark-fg);",
    ],
  ])("%s %s reads %s", (path, selector, declaration) => {
    expect(bodyOf(path, selector)).toContain(declaration)
  })

  it("keeps the underline trigger's @apply free of an active text colour", () => {
    expect(
      bodyOf(TABS, '.dr-tabs-trigger[data-variant="underline"]'),
    ).not.toMatch(/data-\[state=active\]:text-/)
  })
})

const SIDEBAR = "src/layout/sidebar/sidebar-nav.css"

const SELECTION = "src/layout/sidebar/sidebar-selection.css"

describe("nav row family: sidebar", () => {
  const current = "[data-sidebar-selection] .dr-sidebar-nav-current"

  it("paints the current row from the look's tokens and keeps its own text", () => {
    const body = bodyOf(SELECTION, current)
    expect(body).toContain("background: var(--sidebar-active-surface);")
    expect(body).toContain("color: hsl(var(--sidebar-foreground-hover));")
    expect(body).toContain("font-weight: 600;")
  })

  it("keeps the hover fill apart from the current row", () => {
    expect(bodyOf(SIDEBAR, ".dr-sidebar-nav-item:hover")).toContain(
      "hsl(var(--sidebar-hover-bg))",
    )
    expect(bodyOf(SELECTION, current)).not.toContain("--sidebar-hover-bg")
  })

  it("leaves no tint, rail or ring of the old indicator", () => {
    const css = readFileSync(SIDEBAR, "utf8")
    expect(css).not.toContain("data-active-bar")
    expect(css).not.toContain(".dr-sidebar-nav-current")
  })
})

describe("nav row family: top nav and layout switcher", () => {
  it.each([
    [
      "src/layout/top-nav-layout/top-nav-layout.css",
      '.dr-top-nav-layout-nav-item[data-active="true"]',
    ],
    [
      "src/layout/layout-switcher/layout-switcher.css",
      '.dr-layout-switcher-item[data-active="true"]',
    ],
  ])("%s %s reads the nav-row fill and text", (path, selector) => {
    const body = bodyOf(path, selector)
    expect(body).toContain("background-color: var(--selected-nav-bg);")
    expect(body).toContain("color: var(--selected-nav-fg);")
  })
})

/** A selected, checked, current or active state in a selector. */
const SELECTED =
  /\[data-state="?(?:on|active|checked|open)"?\]|\[data-selected(?:-single)?="?true"?\]|\[aria-selected="true"\]|\[data-active(?:="?true"?)?\]|\[data-status="(?:active|complete|current)"\]|\.active(?![\w-])|\[data-range-(?:start|end|single|middle|preview)="?true"?\]|\[data-highlighted="?true"?\]|\[data-current="?true"?\]|\[data-focused="?true"?\]|-indicator(?![\w-])/

/** The accent, read directly rather than through a family token. */
const PRIMARY =
  /(?<![\w-])(?:bg|border|text|ring|outline|fill|stroke)-primary(?:-fill|-text)?(?![\w-])|(?<![\w-])(?:bg|border|text)-primary(?:-fill)?\/\d+|var\(--primary(?:-fill|-text)?\)/

/**
 * A checked, on, active or selected state written as a Tailwind variant,
 * directly or through a peer- or group- (optionally named) form.
 */
const STATE_VARIANT =
  /^(?:(?:peer|group)-)?(?:has-)?(?:data-\[(?:state=(?:checked|on|active)|selected=true)\]|aria-(?:checked|selected))(?:\/[\w-]+)?$/

/**
 * @apply utilities that paint a checked or selected state with the accent,
 * as [file, "<selector> <token>"].
 */
function accentStateUtilities(
  path: string,
  css: string,
): Array<[string, string]> {
  const found: Array<[string, string]> = []
  const text = stripCssComments(css)
  for (const rule of cssRules(text)) {
    const selector = normalise(rule.selector)
    for (const apply of rule.body.matchAll(/@apply([^;]*);/g)) {
      for (const token of (apply[1] as string).trim().split(/\s+/)) {
        const { variants, utility } = splitToken(token)
        if (
          variants.some((v) => STATE_VARIANT.test(v)) &&
          PRIMARY.test(utility)
        ) {
          found.push([path.replace(/^src\//, ""), `${selector} ${token}`])
        }
      }
    }
  }
  return found
}

/**
 * Selected rules that keep the accent, as [file, text in the selector,
 * reason]. Everything else matched here reads a family token. The scan reads
 * selectors, and checked or selected states written as Tailwind variants
 * inside @apply (`data-[state=checked]:`, `has-data-[state=checked]:`,
 * `aria-checked:`, `aria-selected:`), which it reports as
 * `<selector> <token>`.
 */
const ALLOWED: Array<[string, string, string]> = [
  [
    "components/calendar/calendar.css",
    '[data-range-preview="true"]',
    "a range preview is provisional, not a selection",
  ],
  [
    "components/carousel/carousel.css",
    '.dr-carousel-indicator[data-current="true"]',
    "a carousel position dot is media chrome",
  ],
  [
    "components/cascade-select/cascade-select.css",
    "[data-menu-highlight=",
    "the menu highlight signature marks the row under the pointer or the keyboard, not a selection",
  ],
  [
    "components/color-picker/color-picker.css",
    '.dr-color-picker-swatch-item[data-active="true"]',
    "a colour swatch ring is tool chrome around a colour",
  ],
  [
    "components/combobox/combobox.css",
    "[data-menu-highlight=",
    "the menu highlight signature marks the row under the pointer or the keyboard, not a selection",
  ],
  [
    "components/command/command.css",
    "[data-menu-highlight=",
    "the menu highlight signature marks the row under the pointer or the keyboard, not a selection",
  ],
  [
    "components/field/field.css",
    ".dr-field-label has-data-[state=checked]:bg-primary/5",
    "the choice card tints its container around a checked control; the tint is not the checked fill",
  ],
  [
    "components/field/field.css",
    ".dr-field-label has-data-[state=checked]:border-primary",
    "the choice card's edge marks the container around a checked control, not the checked fill",
  ],
  [
    "components/field/field.css",
    ".dr-field-label dark:has-data-[state=checked]:bg-primary/10",
    "the choice card's dark-mode container tint around a checked control, not the checked fill",
  ],
  [
    "components/floating-panel/floating-panel.css",
    '.dr-floating-panel-trigger[data-active="true"]',
    "a pressed panel trigger is window chrome, not a selection",
  ],
  [
    "components/image-common/image-common.css",
    '.dr-image-dropzone[data-state="active"]',
    "a drag-over dropzone is a hover-only accent",
  ],
  [
    "components/image-editor/image-editor.css",
    '.dr-image-editor-tool[data-state="active"]',
    "the active editor tool is tool chrome",
  ],
  [
    "components/image-editor/image-editor.css",
    '.dr-image-editor-annotation-kind[data-state="active"]',
    "the active annotation kind is tool chrome",
  ],
  [
    "components/json-tree-view/json-tree-view.css",
    '.dr-json-row[data-focused="true"]',
    "the focused JSON row is a keyboard position, not a selection",
  ],
  [
    "components/listbox/listbox.css",
    '.dr-listbox[data-variant="outline"]',
    "the outline variant rings the selected row in the accent text colour over no fill; the checked fill would hide a ring",
  ],
  [
    "components/listbox/listbox.css",
    "[data-menu-highlight=",
    "the menu highlight signature marks the row under the pointer or the keyboard, not a selection",
  ],
  [
    "components/menu-primitives/menu-primitives.css",
    "[data-menu-highlight=",
    "the menu highlight signature marks the row under the pointer or the keyboard, not a selection",
  ],
  [
    "components/progress/progress.css",
    ".dr-progress-indicator",
    "a progress bar shows a value, not a selection",
  ],
  [
    "components/steps/steps.css",
    '.dr-steps-indicator[data-status="current"]',
    "the current step is in progress, not selected",
  ],
  [
    "components/tabs/tabs.css",
    '[data-variant="enclosed"]',
    'enclosed tabs with color="accent" are an opt-in accent',
  ],
  [
    "components/time-picker/time-picker.css",
    '.dr-time-column-item[data-selected="true"]:hover',
    "the hover mixes the checked fill toward its wash (hover-fills.test)",
  ],
  [
    "components/timeline/timeline.css",
    '.dr-timeline-indicator[data-status="current"]',
    "the current event is in progress, not selected",
  ],
  [
    "components/tree-view/tree-view.css",
    '.dr-tree-view[data-variant="outline"]',
    "the outline variant rings the selected row in the accent text colour over no fill; the checked fill would hide a ring",
  ],
  [
    "components/virtualized-timeline/virtualized-timeline.css",
    '[data-selected="true"]',
    "a selected timeline tile or row is timeline chrome",
  ],
]

function stylesheets(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return stylesheets(path)
    return entry.name.endsWith(".css") ? [path] : []
  })
}

/** Selected rules that read the accent, as [file, selector]. */
function accentSelections(): Array<[string, string]> {
  const paths = ["src/components", "src/layout"].flatMap(stylesheets)
  return [
    ...paths.flatMap((path) =>
      rulesOf(path).flatMap((rule) =>
        rule.selectors
          .filter((s) => SELECTED.test(s) && PRIMARY.test(rule.body))
          .map((s): [string, string] => [path.replace(/^src\//, ""), s]),
      ),
    ),
    ...paths.flatMap((path) =>
      accentStateUtilities(path, readFileSync(path, "utf8")),
    ),
  ]
}

describe("selected states read a family token", () => {
  const found = accentSelections()

  it("reads the accent in a selected rule only where it is allowed", () => {
    const offenders = found
      .filter(
        ([file, selector]) =>
          !ALLOWED.some(
            ([allowedFile, text]) =>
              allowedFile === file && selector.includes(text),
          ),
      )
      .map(([file, selector]) => `${selector} (${file})`)
    expect(offenders).toEqual([])
  })

  it("keeps every allowance justified and still needed", () => {
    for (const [file, text, reason] of ALLOWED) {
      expect(
        found.some(
          ([foundFile, selector]) =>
            foundFile === file && selector.includes(text),
        ),
        `${text} in ${file} no longer reads the accent`,
      ).toBe(true)
      expect(reason.length, `${text} needs a reason`).toBeGreaterThan(20)
    }
  })

  // An outline variant keeps its neutral outline at rest and takes its
  // family's selected style; none of them falls back to an accent edge.
  it("gives no outline variant an accent edge or label when selected", () => {
    const offenders = ["src/components", "src/layout"]
      .flatMap(stylesheets)
      .flatMap((path) =>
        rulesOf(path)
          .filter((rule) =>
            rule.selectors.some(
              (s) => /\[data-variant="?outline"?\]/.test(s) && SELECTED.test(s),
            ),
          )
          .filter((rule) =>
            /(?<![\w-])(?:border-primary|text-primary-text)(?![\w-])|inset 0 0 0 1px hsl\(var\(--primary\)\)/.test(
              rule.body,
            ),
          )
          .map((rule) => `${rule.selectors.join(", ")} (${path})`),
      )
    expect(offenders).toEqual([])
  })
})

describe("checked family on Checkbox and Switch", () => {
  it.each([
    [
      "src/components/checkbox/checkbox.css",
      '.dr-checkbox[data-state="checked"]',
      [
        "background-color: var(--selected-check-bg);",
        "border-color: var(--check-checked-border);",
        "color: var(--selected-check-fg);",
      ],
    ],
    [
      "src/components/switch/switch.css",
      '.dr-switch[data-state="checked"]',
      ["background-color: var(--selected-check-bg);"],
    ],
  ])("%s paints %s from the checked family", (path, selector, declarations) => {
    const body = bodyOf(path, selector)
    for (const declaration of declarations) {
      expect(body).toContain(declaration)
    }
  })

  it.each([
    "data-[state=checked]",
    "has-data-[state=checked]",
    "data-[state=on]",
    "data-[state=active]",
    "data-[selected=true]",
    "aria-selected",
    "peer-data-[state=checked]",
    "group-data-[state=on]",
    "group-has-data-[state=checked]",
    "peer-aria-checked",
    "group-data-[selected=true]/item",
  ])("catches a %s utility that paints the accent inside @apply", (variant) => {
    expect(
      accentStateUtilities(
        "src/components/x/x.css",
        `.dr-x { @apply ${variant}:bg-primary flex; }`,
      ),
    ).toEqual([["components/x/x.css", `.dr-x ${variant}:bg-primary`]])
  })
})
