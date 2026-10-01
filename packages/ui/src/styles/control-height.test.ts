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
  return globSync("src/**/*.{css,ts,tsx}")
    .map((file) => file.replaceAll("\\", "/"))
    .filter((file) => !/\.test\.tsx?$/.test(file))
    .filter((file) => pattern.test(readFileSync(file, "utf8")))
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
