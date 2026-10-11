import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { cssRules } from "../../test/css-rules"
import { stripCssComments } from "../../test/strip-css-comments"

// Menu rows round with --menu-item-radius, and the menu highlight, menu
// tone, tooltip tone and label case signatures restyle menus and tooltips
// from the root attribute. jsdom computes no cascade, so the source rules
// are what this asserts; the effective values are checked in Chromium by
// the template's e2e suite.

const DIR = join("src", "components")
const MENU = join(DIR, "menu-primitives", "menu-primitives.css")
const LISTBOX = join(DIR, "listbox", "listbox.css")
const SELECT = join(DIR, "select", "select.css")
const COMMAND = join(DIR, "command", "command.css")
const COMBOBOX = join(DIR, "combobox", "combobox.css")
const CASCADE = join(DIR, "cascade-select", "cascade-select.css")
const TOOLTIP = join(DIR, "tooltip", "tooltip.css")

interface Rule {
  selectors: string[]
  wrappers: string[]
  body: string
}

function normalise(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
}

function rulesOf(path: string): Rule[] {
  return cssRules(stripCssComments(readFileSync(path, "utf8"))).map((rule) => ({
    selectors: rule.selector
      .split(/,(?![^(]*\))/)
      .map(normalise)
      .filter(Boolean),
    wrappers: rule.wrappers,
    body: normalise(rule.body),
  }))
}

/** Every body of a rule whose selector list holds `selector`, joined. */
function bodyOf(path: string, selector: string, wrappers?: string[]): string {
  const bodies = rulesOf(path)
    .filter((rule) => rule.selectors.includes(selector))
    .filter(
      (rule) =>
        wrappers === undefined ||
        rule.wrappers.join(" > ") === wrappers.join(" > "),
    )
    .map((rule) => rule.body)
  if (bodies.length === 0) throw new Error(`no rule ${selector} in ${path}`)
  return bodies.join(" ")
}

const TINT =
  "background-color: hsl(var(--primary) / 0.12); color: hsl(var(--primary-text));"
const SOLID =
  "background-color: hsl(var(--primary-fill)); color: hsl(var(--primary-foreground));"

/** The highlighted state of every row family: [stylesheet, selector]. */
const ROWS: Array<[string, string]> = [
  [MENU, ".dr-menu-item:focus"],
  [MENU, ".dr-menu-checkbox-item:focus"],
  [MENU, ".dr-menu-radio-item:focus"],
  [MENU, ".dr-menu-sub-trigger:focus"],
  [MENU, '.dr-menu-sub-trigger[data-state="open"]'],
  [
    LISTBOX,
    '.dr-listbox-item[data-focused="true"]:not([data-selected="true"])',
  ],
  [SELECT, ".dr-select-item:focus"],
  [COMMAND, '.dr-command-item[data-selected="true"]'],
  [COMBOBOX, '.dr-combobox-item[data-highlighted="true"]'],
  [CASCADE, '.dr-cascade-item[data-active="true"]'],
  [CASCADE, '.dr-cascade-item:not([aria-disabled="true"]):hover'],
]

describe("menu item radius", () => {
  it("declares --menu-item-radius on the layered :root", () => {
    expect(bodyOf(MENU, ":root", ["@layer base"])).toBe(
      "--menu-item-radius: calc(var(--radius) - 4px);",
    )
  })

  it.each([
    [MENU, ".dr-menu-sub-trigger"],
    [MENU, ".dr-menu-item"],
    [MENU, ".dr-menu-checkbox-item"],
    [MENU, ".dr-menu-radio-item"],
    [LISTBOX, ".dr-listbox-item"],
    [SELECT, ".dr-select-item"],
    [COMMAND, ".dr-command-item"],
    [COMBOBOX, ".dr-combobox-item"],
    [CASCADE, ".dr-cascade-item"],
  ])("%s rounds %s with it", (path, selector) => {
    const body = bodyOf(path, selector)
    expect(body).toContain("rounded-[var(--menu-item-radius)]")
    expect(body).not.toMatch(/(?<![\w-])rounded-sm(?![\w-])/)
  })
})

describe("menu highlight signature", () => {
  it.each(ROWS)("%s tints %s", (path, row) => {
    expect(bodyOf(path, `[data-menu-highlight="tint"] ${row}`)).toBe(TINT)
  })

  it.each(ROWS)("%s fills %s solid", (path, row) => {
    expect(bodyOf(path, `[data-menu-highlight="solid"] ${row}`)).toBe(SOLID)
  })

  it("lets a shortcut follow a solid row's text", () => {
    expect(
      bodyOf(
        MENU,
        '[data-menu-highlight="solid"] :is(.dr-menu-item, .dr-menu-checkbox-item, .dr-menu-radio-item, .dr-menu-sub-trigger):focus .dr-menu-shortcut',
      ),
    ).toBe("color: inherit;")
  })
})

describe("menu tone signature", () => {
  const CONTENT = ":is(.dr-menu-content, .dr-menu-sub-content)"

  it("inverts the menu surface", () => {
    expect(bodyOf(MENU, `[data-menu-tone="inverse"] ${CONTENT}`)).toBe(
      "background: hsl(var(--foreground)); background-blend-mode: normal; border-color: transparent; color: hsl(var(--background));",
    )
  })

  it("keeps labels, shortcuts and separators legible on it", () => {
    expect(
      bodyOf(
        MENU,
        `[data-menu-tone="inverse"] ${CONTENT} :is(.dr-menu-label, .dr-menu-shortcut)`,
      ),
    ).toBe("color: hsl(var(--background) / 0.7);")
    expect(
      bodyOf(MENU, `[data-menu-tone="inverse"] ${CONTENT} .dr-menu-separator`),
    ).toBe("background-color: hsl(var(--background) / 0.16);")
  })

  it("washes the highlighted row with the inverse text colour", () => {
    expect(
      bodyOf(
        MENU,
        '[data-menu-tone="inverse"] :is(.dr-menu-item, .dr-menu-checkbox-item, .dr-menu-radio-item, .dr-menu-sub-trigger):focus',
      ),
    ).toBe(
      "background-color: hsl(var(--background) / 0.14); color: hsl(var(--background));",
    )
  })
})

describe("tooltip tone signature", () => {
  it.each([
    [
      "inverse",
      "background: hsl(var(--foreground)); background-blend-mode: normal; border-color: transparent; color: hsl(var(--background));",
      "fill: hsl(var(--foreground)); stroke: transparent;",
    ],
    [
      "accent",
      "background: hsl(var(--primary-fill)); background-blend-mode: normal; border-color: transparent; color: hsl(var(--primary-foreground));",
      "fill: hsl(var(--primary-fill)); stroke: transparent;",
    ],
  ])("paints the %s tooltip and its arrow", (tone, content, arrow) => {
    expect(
      bodyOf(TOOLTIP, `[data-tooltip-tone="${tone}"] .dr-tooltip-content`),
    ).toBe(content)
    expect(
      bodyOf(
        TOOLTIP,
        `[data-tooltip-tone="${tone}"] .dr-tooltip-arrow:not([fill])`,
      ),
    ).toBe(arrow)
    expect(
      bodyOf(
        TOOLTIP,
        `[data-tooltip-tone="${tone}"] .dr-tooltip-arrow:not([fill]) > path:nth-child(2)`,
        ["@layer components", "@media (forced-colors: none)"],
      ),
    ).toBe("fill: transparent;")
  })
})

describe("label case signature on menu labels", () => {
  it.each([
    [MENU, ".dr-menu-label", "upper", "uppercase"],
    [SELECT, ".dr-select-label", "upper", "uppercase"],
    [COMMAND, ".dr-command-group [cmdk-group-heading]", "upper", "uppercase"],
    [MENU, ".dr-menu-label", "lower", "lowercase"],
    [SELECT, ".dr-select-label", "lower", "lowercase"],
    [COMMAND, ".dr-command-group [cmdk-group-heading]", "lower", "lowercase"],
  ])("%s sets %s in %s case", (path, label, value, transform) => {
    expect(bodyOf(path, `[data-label-case="${value}"] ${label}`)).toBe(
      `text-transform: ${transform};`,
    )
  })
})
