import { describe, it, expect } from "vitest"
import { globSync, readFileSync } from "node:fs"

// jsdom never lays anything out, so the height contract is asserted on the
// stylesheet text. Controls take a fixed border-box height from their family
// token instead of padding around a line box: padding-derived heights were
// why an outline button stood 2px taller than a filled one and an input 6px
// taller than the button beside it.

const THEME = "src/styles/theme.css"
const BUTTON = "src/components/button/button.css"
const TOGGLE = "src/components/toggle/toggle.css"

/** Comments stripped, whitespace collapsed, and no padding inside parens, so
 *  a prettier-wrapped `max(\n  a,\n  b\n)` reads as `max(a, b)`. */
function flat(path: string): string {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
}

/** Every declaration block whose selector list is exactly `selector`. */
function body(path: string, selector: string): string {
  const bodies: string[] = []
  for (const [, sel, decls] of flat(path).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (sel?.trim() === selector) bodies.push((decls ?? "").trim())
  }
  if (bodies.length === 0) throw new Error(`no ${selector} rule in ${path}`)
  return bodies.join(" ")
}

function densityBlock(step: string): string {
  const match = flat(THEME).match(
    new RegExp(`\\[data-density="${step}"\\] \\{([^}]*)\\}`),
  )
  if (!match?.[1]) throw new Error(`no [data-density="${step}"] block`)
  return match[1]
}

/** Source files, tests excluded, whose text matches `pattern`. */
function readersOf(pattern: RegExp): string[] {
  const files = globSync("src/**/*.{css,ts,tsx}")
    .map((file) => file.replaceAll("\\", "/"))
    .filter((file) => !/\.test\.tsx?$/.test(file))
  // Run from anywhere but packages/ui, the glob finds nothing and every
  // "no reader" case would pass on an empty list.
  expect(files.length).toBeGreaterThan(0)
  return files.filter((file) => pattern.test(readFileSync(file, "utf8")))
}

/** A padding- or utility-derived height left beside the fixed one. */
const LEGACY_HEIGHT = /(?<![\w-])(?:min-h|h|py|size)-[[\d]|min-height/

const SM_HEIGHT =
  "max(calc(var(--btn-height) - 0.25rem), var(--control-height-xs), var(--control-height-min))"
const LG_HEIGHT = "calc(var(--btn-height) + 0.5rem)"

describe("button family tokens", () => {
  it("defaults on :root to the control height and the button radius", () => {
    const css = flat(THEME)
    expect(css).toContain("--btn-height: var(--control-height);")
    expect(css).toMatch(/--btn-radius: var\(--radius-[a-z]+\);/)
  })

  it.each([
    [":root", "0.75rem", "0.375rem"],
    ["compact", "0.5rem", "0.25rem"],
    ["comfortable", "1rem", "0.5rem"],
    ["spacious", "1.25rem", "0.625rem"],
  ])("%s sets --btn-px %s and --btn-px-tight %s", (step, px, tight) => {
    const block = step === ":root" ? flat(THEME) : densityBlock(step)
    expect(block).toContain(`--btn-px: ${px};`)
    expect(block).toContain(`--btn-px-tight: ${tight};`)
  })

  it("leaves no reader of --density-button-px or --density-button-py", () => {
    expect(readersOf(/--density-button-p[xy](?![\w-])/)).toEqual([])
  })

  it("leaves no reader of the size-step or --density-cell tokens", () => {
    expect(readersOf(/--density-(?:button-|cell)/)).toEqual([])
  })
})

describe("button heights", () => {
  it("gives every variant a 1px border so bordered and borderless match", () => {
    expect(body(BUTTON, ".dr-btn")).toContain("border: 1px solid transparent;")
  })

  it.each([
    ['.dr-btn[data-size="default"]', "var(--btn-height)"],
    ['.dr-btn[data-size="sm"]', SM_HEIGHT],
    ['.dr-btn[data-size="lg"]', LG_HEIGHT],
    ['.dr-btn[data-size="icon"]', "var(--btn-height)"],
  ])("%s has a fixed border-box height", (selector, height) => {
    const rule = body(BUTTON, selector)
    expect(rule).toContain(`height: ${height};`)
    expect(rule).not.toMatch(LEGACY_HEIGHT)
  })

  it("pads each step from --btn-px", () => {
    expect(body(BUTTON, '.dr-btn[data-size="default"]')).toContain(
      "px-[var(--btn-px)]",
    )
    expect(body(BUTTON, '.dr-btn[data-size="sm"]')).toContain(
      "padding-inline: max(calc(var(--btn-px) - 0.25rem), 0.25rem);",
    )
    expect(body(BUTTON, '.dr-btn[data-size="lg"]')).toContain(
      "padding-inline: calc(var(--btn-px) + 0.5rem);",
    )
  })

  it("makes the icon size a square of --btn-height", () => {
    expect(body(BUTTON, '.dr-btn[data-size="icon"]')).toContain(
      "width: var(--btn-height);",
    )
  })

  it("leaves the jump-to-date button's height to its size", () => {
    // `h-auto` here outranks `.dr-btn[data-size="sm"]` on source order and
    // would collapse the button to its icon.
    expect(
      body(
        "src/components/virtualized-timeline/virtualized-timeline.css",
        ".dr-virtualized-timeline-toolbar .dr-date-picker-trigger",
      ),
    ).not.toMatch(/\bh-auto\b/)
  })
})

describe("chrome buttons stay off the coarse-pointer floor", () => {
  // These are .dr-btn elements whose own sizing reads
  // --control-height-default (Task 1). The (0,2,0) size rules above read
  // --btn-height, which floors at 40px on a coarse pointer, and would
  // otherwise outrank them: calendar days would overflow their 32px cells.
  it.each([
    ["src/components/calendar/calendar.css", ".dr-calendar-day-btn"],
    ["src/components/calendar/calendar.css", ".dr-calendar-nav-btn"],
    ["src/layout/sidebar/sidebar-layout.css", ".dr-sidebar-layout-toggle"],
    [
      "src/layout/search-command/search-command.css",
      '.dr-search-command-trigger[data-collapsed="true"]',
    ],
  ])("%s %s re-binds --btn-height to the density default", (path, selector) => {
    expect(body(path, selector)).toContain(
      "--btn-height: var(--control-height-default);",
    )
  })
})

describe("toggle heights", () => {
  it("gives every variant a 1px border so default and outline match", () => {
    expect(body(TOGGLE, ".dr-toggle")).toContain(
      "border: 1px solid transparent;",
    )
  })

  it.each([
    [
      '.dr-toggle[data-size="default"]',
      "var(--btn-height)",
      "var(--btn-px-tight)",
    ],
    [
      '.dr-toggle[data-size="sm"]',
      SM_HEIGHT,
      "max(calc(var(--btn-px-tight) - 0.25rem), 0.125rem)",
    ],
    [
      '.dr-toggle[data-size="lg"]',
      LG_HEIGHT,
      "calc(var(--btn-px-tight) + 0.25rem)",
    ],
  ])(
    "%s has a fixed height, a square floor and tight padding",
    (selector, height, pad) => {
      const rule = body(TOGGLE, selector)
      expect(rule).toContain(`height: ${height};`)
      expect(rule).toContain(`min-width: ${height};`)
      expect(rule).toContain(`padding-inline: ${pad};`)
      expect(rule.replace(/min-width: [^;]*;/, "")).not.toMatch(LEGACY_HEIGHT)
    },
  )
})

describe("field family tokens", () => {
  it("defaults on :root to the control height and radius", () => {
    const css = flat(THEME)
    expect(css).toContain("--field-height: var(--control-height);")
    expect(css).toMatch(/--field-radius: var\(--radius-[a-z]+\);/)
    expect(css).not.toContain("--field-border")
  })

  it.each([
    [":root", "0.625rem", "0.5rem"],
    ["compact", "0.5rem", "0.375rem"],
    ["comfortable", "0.875rem", "0.625rem"],
    ["spacious", "1.125rem", "0.75rem"],
  ])("%s sets --field-px %s and --field-py %s", (step, px, py) => {
    const block = step === ":root" ? flat(THEME) : densityBlock(step)
    expect(block).toContain(`--field-px: ${px};`)
    expect(block).toContain(`--field-py: ${py};`)
  })

  it("leaves no reader of the removed input tokens", () => {
    expect(readersOf(/--density-input-/)).toEqual([])
  })
})

const CHIP_ROW_PADDING =
  "padding-block: min(var(--field-py), calc((var(--field-height) - 1.75rem) / 2));"

describe("field heights", () => {
  it.each([
    ["src/components/input/input.css", ".dr-input"],
    ["src/components/input/input.css", ".dr-input-group"],
    ["src/components/select/select.css", ".dr-select-trigger"],
    ["src/components/combobox/combobox.css", ".dr-combobox-control"],
    ["src/components/date-input/date-input.css", ".dr-date-input"],
    [
      "src/components/number-input/number-input.css",
      ".dr-number-input-control",
    ],
    ["src/components/input-otp/input-otp.css", ".dr-input-otp-slot"],
  ])("%s → %s has a fixed --field-height", (path, selector) => {
    const rule = body(path, selector)
    expect(rule).toContain("height: var(--field-height);")
    expect(rule).not.toMatch(LEGACY_HEIGHT)
  })

  // The picker's chrome sits beside its .dr-input, so it follows the same
  // density and coarse-pointer heights.
  it.each([
    [".dr-color-picker-trigger", "--btn-height"],
    [".dr-color-picker-swatch", "--field-height"],
  ])("sizes the colour-picker %s as a square of %s", (selector, token) => {
    const rule = body("src/components/color-picker/color-picker.css", selector)
    expect(rule).toContain(`height: var(${token});`)
    expect(rule).toContain(`width: var(${token});`)
    expect(rule).not.toMatch(LEGACY_HEIGHT)
  })

  it("keeps the user-menu avatar inside its icon trigger", () => {
    const rule = body(
      "src/layout/user-menu/user-menu.css",
      ".dr-user-menu-avatar",
    )
    expect(rule).toContain("height: min(2rem, var(--btn-height));")
    expect(rule).toContain("width: min(2rem, var(--btn-height));")
  })

  it.each([
    ["src/components/input/input.css", ".dr-input-grouped", "auto"],
    [
      "src/components/number-input/number-input.css",
      ".dr-number-input-field",
      "auto",
    ],
    [
      "src/components/combobox/combobox.css",
      ".dr-combobox-control > .dr-combobox-input",
      "100%",
    ],
  ])("%s → %s fills its wrapper (height: %s)", (path, selector, height) => {
    expect(body(path, selector)).toContain(`height: ${height};`)
  })

  it("leaves the password field on the .dr-input height", () => {
    const rule = body(
      "src/components/password-input/password-input.css",
      ".dr-password-input-field",
    )
    expect(rule).not.toMatch(/height/)
    expect(rule).not.toMatch(LEGACY_HEIGHT)
  })

  it.each([
    [
      "src/components/multi-select/multi-select.css",
      ".dr-multi-select-control",
    ],
    ["src/components/tags-input/tags-input.css", ".dr-tags-input-control"],
  ])("%s → %s floors at --field-height and grows", (path, selector) => {
    const rule = body(path, selector)
    expect(rule).toContain("min-height: var(--field-height);")
    expect(rule).toContain(CHIP_ROW_PADDING)
    expect(rule).not.toMatch(/(?<![\w-])(?:min-h|h|py)-[[\d]/)
  })

  it("lets the multi-select control outgrow the combobox height", () => {
    expect(
      body(
        "src/components/multi-select/multi-select.css",
        ".dr-multi-select .dr-multi-select-control",
      ),
    ).toContain("height: auto;")
  })

  it("keeps a drop shadow off the multi-select control", () => {
    expect(
      body(
        "src/components/multi-select/multi-select.css",
        ".dr-multi-select-control",
      ),
    ).not.toContain("--shadow-button")
  })

  it("pads the textarea from the field tokens", () => {
    const rule = body("src/components/textarea/textarea.css", ".dr-textarea")
    expect(rule).toContain("px-[var(--field-px)]")
    expect(rule).toContain("py-[var(--field-py)]")
  })

  it("keeps the editable input at the density height", () => {
    expect(
      body("src/components/editable/editable.css", ".dr-editable-input"),
    ).toContain("--field-height: var(--control-height-default);")
  })

  it("keeps the calendar caption dropdowns at h-7", () => {
    expect(
      body(
        "src/components/calendar/calendar.css",
        ".dr-calendar-dropdown-root .dr-calendar-dropdown-trigger",
      ),
    ).toMatch(/(?<![\w-])h-7(?![\w-])/)
  })
})

const TABS = "src/components/tabs/tabs.css"
const DATA_TABLE = "src/data-table/data-table.css"

describe("tabs, segment and pagination heights", () => {
  it.each([
    '.dr-tabs-trigger[data-variant="default"]',
    '.dr-tabs-trigger[data-variant="outline"]',
    '.dr-tabs-trigger[data-variant="underline"]',
    '.dr-tabs-trigger[data-variant="enclosed"][data-orientation="horizontal"]',
    '.dr-tabs-trigger[data-variant="enclosed"][data-orientation="vertical"]',
  ])("%s has a fixed --btn-height", (selector) => {
    const rule = body(TABS, selector)
    expect(rule).toContain("height: var(--btn-height);")
    expect(rule).not.toMatch(LEGACY_HEIGHT)
    expect(rule).not.toMatch(/(?<![\w-])h-(?:full|auto)(?![\w-])/)
  })

  it("keeps the seam overlap on underline and folder tabs", () => {
    expect(body(TABS, '.dr-tabs-trigger[data-variant="underline"]')).toMatch(
      /(?<![\w-])-mb-px(?![\w-])/,
    )
    expect(
      body(
        TABS,
        '.dr-tabs-trigger[data-variant="enclosed"][data-orientation="horizontal"]',
      ),
    ).toContain("margin-bottom: -1px;")
  })

  it("lets vertical underline tabs keep the fixed height", () => {
    expect(
      body(
        TABS,
        '.dr-tabs-trigger[data-variant="underline"][data-orientation="vertical"]',
      ),
    ).not.toMatch(/(?<![\w-])h-auto(?![\w-])/)
  })

  it("sizes every tab strip from its triggers", () => {
    const offenders = [...flat(TABS).matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(([, sel]) => /^\.dr-tabs-list[^\s:]*$/.test(sel?.trim() ?? ""))
      .filter(([, , decls]) =>
        /(?<![\w-])(?:height:|(?:min-h|h)-[[\d]|h-full)/.test(decls ?? ""),
      )
      .map(([, sel]) => sel?.trim())
    expect(offenders).toEqual([])
  })

  it("gives the segment item a fixed --btn-height", () => {
    const rule = body(
      "src/components/segment-group/segment-group.css",
      ".dr-segment-group .dr-segment-group-item",
    )
    expect(rule).toContain("height: var(--btn-height);")
    expect(rule).not.toMatch(LEGACY_HEIGHT)
  })

  it("leaves the pagination link on the .dr-btn height", () => {
    expect(
      readFileSync("src/components/pagination/Pagination.tsx", "utf8"),
    ).toContain('cn("dr-btn", "dr-pagination-link", className)')
    const css = flat("src/components/pagination/pagination.css")
    const linkRules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(
      ([sel]) => sel?.includes(".dr-pagination-link"),
    )
    expect(linkRules.length).toBeGreaterThan(0)
    for (const [, , decls] of linkRules) {
      expect(decls).not.toMatch(/(?<![\w-])height:/)
      expect(decls).not.toMatch(LEGACY_HEIGHT)
    }
  })
})

describe("data-table control heights", () => {
  it("forces no literal control height", () => {
    expect(flat(DATA_TABLE)).not.toMatch(/(?<![\w-])[hw]-(?:8|9)(?![\w-])/)
  })

  it.each([
    [".dr-data-table-skeleton-toolbar-search", "h-[var(--field-height)]"],
    [".dr-data-table-skeleton-toolbar-action", "h-[var(--btn-height)]"],
  ])("%s mirrors the control it stands in for", (selector, height) => {
    expect(body(DATA_TABLE, selector)).toContain(height)
  })

  it.each([
    ".dr-btn.dr-data-table-column-header-btn[data-size]",
    ".dr-btn.dr-data-table-column-visibility-trigger[data-size]",
    ".dr-btn.dr-data-table-facet-trigger[data-size]",
  ])("%s outranks the sm step with --btn-height", (selector) => {
    expect(body(DATA_TABLE, selector)).toContain("height: var(--btn-height);")
  })
})
