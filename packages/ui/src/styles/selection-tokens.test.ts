import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

// Selection reads from four families instead of six visual languages: a
// neutral raised pill for view switches, an accent fill for checked and
// selected items, an accent underline with foreground text, and an accent
// tint for the active navigation row. A family token defaults at :root only
// to variables bound on <html>.

const THEME = readFileSync("src/styles/theme.css", "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
)

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
  const css = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selectors: (match[1] as string)
      .split(/,(?![^(]*\))/)
      .map(normalise)
      .filter(Boolean),
    body: normalise(match[2] as string),
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
  ["--selected-view-shadow", "var(--shadow-button)"],
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
    expect(DARK_ROOT.trim()).toBe("--selected-view-bg: hsl(var(--border));")
  })
})

const TABS = "src/components/tabs/tabs.css"
const SEGMENT = "src/components/segment-group/segment-group.css"

describe("view switch family", () => {
  it.each([
    [
      TABS,
      '.dr-tabs-indicator[data-variant="default"]',
      "background-color: var(--selected-view-bg);",
    ],
    [
      TABS,
      '.dr-tabs-indicator[data-variant="default"]',
      "box-shadow: var(--selected-view-shadow),",
    ],
    [
      TABS,
      '.dr-tabs-indicator[data-variant="outline"]',
      "background-color: var(--selected-view-bg);",
    ],
    [
      TABS,
      '.dr-tabs-trigger:is([data-variant="default"], [data-variant="outline"])[data-state="active"]',
      "color: var(--selected-view-fg);",
    ],
    [
      SEGMENT,
      ".dr-segment-group-indicator",
      "background-color: var(--selected-view-bg);",
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
    [TREE, '.dr-tree-view-item[data-selected="true"]:hover'],
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

  it.each([
    [LISTBOX, '.dr-listbox[data-variant="outline"]'],
    [TREE, '.dr-tree-view[data-variant="outline"]'],
  ])("%s has no selected rule of its own under %s", (path, scope) => {
    const own = rulesOf(path).filter((rule) =>
      rule.selectors.some(
        (s) => !s.startsWith("[data-preset=") && s.includes(scope),
      ),
    )
    expect(own).toEqual([])
  })

  it("keeps the checked fill under the glass outline listbox", () => {
    const body = bodyOf(
      LISTBOX,
      '[data-preset="glass"] .dr-listbox[data-variant="outline"] .dr-listbox-item[data-selected="true"]',
    )
    expect(body).not.toMatch(/background-color:\s*transparent/)
    expect(body).not.toMatch(/background-image:\s*none/)
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

  it("keeps the checked fill under the glass current page", () => {
    const body = bodyOf(
      PAGINATION,
      '[data-preset="glass"] .dr-pagination-link[data-active="true"][data-variant="ghost"]',
    )
    expect(body).not.toMatch(/background-color:\s*transparent/)
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

describe("nav row family: sidebar", () => {
  const active = '.dr-sidebar-nav-item[data-status="active"]'

  it("tints the active link with the nav-row fill and keeps its own text", () => {
    const body = bodyOf(SIDEBAR, active)
    expect(body).toContain("background-color: var(--selected-nav-bg);")
    expect(body).toContain("color: hsl(var(--sidebar-foreground-hover));")
    expect(body).toContain("font-weight: 600;")
  })

  it("keeps the hover fill apart from the active fill", () => {
    expect(bodyOf(SIDEBAR, ".dr-sidebar-nav-item:hover")).toContain(
      "hsl(var(--sidebar-hover-bg))",
    )
    expect(bodyOf(SIDEBAR, active)).not.toContain("--sidebar-hover-bg")
  })

  it("draws the 3px bar only under bar and both", () => {
    const offenders = rulesOf(SIDEBAR)
      .filter((rule) => rule.body.includes("inset 3px"))
      .flatMap((rule) => rule.selectors)
      .filter(
        (s) =>
          !s.startsWith("[data-preset=") &&
          !/\[data-active-bar="(?:bar|both)"\]/.test(s),
      )
    expect(offenders).toEqual([])
  })
})
