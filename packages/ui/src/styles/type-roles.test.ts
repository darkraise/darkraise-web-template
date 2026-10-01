import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { parseRules, splitToken } from "./interactive-classes"

const THEME = "src/styles/theme.css"

const ROLES = [
  "page-title",
  "dialog-title",
  "section-title",
  "label",
  "caption",
  "ui",
] as const
type Role = (typeof ROLES)[number]

const SIZE_STEP: Record<Role, string> = {
  "page-title": "var(--text-2xl)",
  "dialog-title": "var(--text-lg)",
  "section-title": "var(--text-base)",
  label: "var(--text-sm)",
  caption: "var(--text-xs)",
  ui: "var(--text-sm)",
}

/** Wrapper rules checked only for typography they must not set. */
const NO_TYPE_OF_THEIR_OWN = new Set([
  ".dr-command-group",
  ".dr-command-dialog",
])

/** Every class that takes a role, as [stylesheet, exact selector, role]. */
const ROLE_CLASSES: Array<[string, string, Role]> = [
  [
    "src/layout/page-header/page-header.css",
    ".dr-page-header-title",
    "page-title",
  ],
  ["src/components/dialog/dialog.css", ".dr-dialog-title", "dialog-title"],
  ["src/components/drawer/drawer.css", ".dr-drawer-title", "dialog-title"],
  ["src/components/card/card.css", ".dr-card-title", "section-title"],
  [
    "src/components/empty-state/empty-state.css",
    ".dr-empty-state-title",
    "section-title",
  ],
  ["src/components/label/label.css", ".dr-label", "label"],
  ["src/components/alert/alert.css", ".dr-alert-title", "label"],
  ["src/components/sonner/sonner.css", ".dr-toast-title", "label"],
  ["src/components/combobox/combobox.css", ".dr-combobox-label", "label"],
  [
    "src/components/file-upload/file-upload.css",
    ".dr-file-upload-label",
    "label",
  ],
  ["src/components/tags-input/tags-input.css", ".dr-tags-input-label", "label"],
  [
    "src/components/date-picker/date-picker.css",
    ".dr-date-picker-label",
    "label",
  ],
  [
    "src/components/color-picker/color-picker.css",
    ".dr-color-picker-label",
    "label",
  ],
  [
    "src/components/rating-group/rating-group.css",
    ".dr-rating-group-label",
    "label",
  ],
  [
    "src/components/menu-primitives/menu-primitives.css",
    ".dr-menu-label",
    "caption",
  ],
  ["src/components/menubar/menubar.css", ".dr-menubar-label", "caption"],
  ["src/components/select/select.css", ".dr-select-label", "caption"],
  [
    "src/components/command/command.css",
    ".dr-command-group [cmdk-group-heading]",
    "caption",
  ],
  ["src/components/command/command.css", ".dr-command-group", "caption"],
  ["src/components/command/command.css", ".dr-command-dialog", "caption"],
  [
    "src/components/badge/badge.css",
    '.dr-badge[data-size="default"]',
    "caption",
  ],
  ["src/components/badge/badge.css", '.dr-badge[data-size="lg"]', "label"],
  ["src/components/table/table.css", ".dr-table-head", "caption"],
  [
    "src/data-table/data-table.css",
    ".dr-btn.dr-data-table-column-header-btn[data-size]",
    "caption",
  ],
]

/**
 * A utility that sets a size, weight, tracking or line height, including the
 * arbitrary-value and line-height-shorthand forms (`text-[13px]`,
 * `text-sm/6`, `tracking-[-0.02em]`, `font-[600]`).
 */
const TYPOGRAPHY = new RegExp(
  "^(?:" +
    [
      "text-(?:xs|sm|base|lg|xl|[2-9]xl)(?:/[\\w.\\[\\]-]+)?",
      "text-\\[(?:length:)?[\\d.]+(?:px|rem|em)\\]",
      "text-\\[length:[^\\]]+\\]",
      "font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)",
      "font-\\[\\d+\\]",
      "tracking-[\\w-]+",
      "tracking-\\[[^\\]]+\\]",
      "leading-[\\w-[\\]().]+",
    ].join("|") +
    ")$",
)

const DECLARATION =
  /(?:^|;)\s*(font-size|font-weight|letter-spacing|line-height|font)\s*:/

/** The typography a rule sets for itself instead of through a role. */
function typographyOffenders(css: string, selector: string): string[] {
  const bodies = parseRules(css)
    .filter((rule) => rule.selectors.includes(selector))
    .map((rule) => rule.body)
  if (bodies.length === 0) throw new Error(`no rule ${selector}`)
  const found: string[] = []
  for (const body of bodies) {
    for (const apply of body.matchAll(/@apply([^;]*);/g)) {
      for (const token of (apply[1] as string).trim().split(/\s+/)) {
        if (TYPOGRAPHY.test(splitToken(token).utility)) found.push(token)
      }
    }
    const declaration = DECLARATION.exec(body.replace(/@apply[^;]*;/g, ""))
    if (declaration) found.push(declaration[1] as string)
  }
  return found
}

function appliesRole(css: string, selector: string, role: Role): boolean {
  return parseRules(css)
    .filter((rule) => rule.selectors.includes(selector))
    .some((rule) =>
      [...rule.body.matchAll(/@apply([^;]*);/g)].some((apply) =>
        (apply[1] as string).trim().split(/\s+/).includes(`type-${role}`),
      ),
    )
}

describe("type role tokens", () => {
  const root = parseRules(readFileSync(THEME, "utf8")).find(
    (rule) =>
      rule.selectors.includes(":root") &&
      rule.body.includes("--type-page-title-size"),
  )

  it.each(ROLES)("declares the %s role on :root", (role) => {
    expect(root, "no :root block declares the roles").toBeDefined()
    const body = root?.body ?? ""
    expect(body).toContain(`--type-${role}-size: ${SIZE_STEP[role]};`)
    for (const part of ["weight", "tracking", "leading"]) {
      expect(body).toContain(`--type-${role}-${part}:`)
    }
  })

  it.each(ROLES)("has a type-%s utility that reads the four tokens", (role) => {
    const utility = parseRules(readFileSync(THEME, "utf8")).find((rule) =>
      rule.selectors.includes(`@utility type-${role}`),
    )
    expect(utility, `no @utility type-${role}`).toBeDefined()
    const body = utility?.body ?? ""
    expect(body).toContain(`font-size: var(--type-${role}-size);`)
    expect(body).toContain(`font-weight: var(--type-${role}-weight);`)
    expect(body).toContain(`letter-spacing: var(--type-${role}-tracking);`)
    expect(body).toContain(`line-height: var(--type-${role}-leading);`)
  })
})

describe("classes on a type role", () => {
  it.each(
    ROLE_CLASSES.filter(([, selector]) => !NO_TYPE_OF_THEIR_OWN.has(selector)),
  )("%s %s applies type-%s", (path, selector, role) => {
    expect(appliesRole(readFileSync(path, "utf8"), selector, role)).toBe(true)
  })

  it.each(ROLE_CLASSES)(
    "%s %s sets no typography of its own",
    (path, selector) => {
      expect(typographyOffenders(readFileSync(path, "utf8"), selector)).toEqual(
        [],
      )
    },
  )

  it("catches a rule that sets its own size and weight", () => {
    expect(
      typographyOffenders(
        ".dr-x { @apply type-label text-sm font-medium px-2; }",
        ".dr-x",
      ),
    ).toEqual(["text-sm", "font-medium"])
    expect(typographyOffenders(".dr-x { line-height: 1; }", ".dr-x")).toEqual([
      "line-height",
    ])
    expect(
      typographyOffenders(
        ".dr-x { @apply [&_[cmdk-group-heading]]:text-xs; }",
        ".dr-x",
      ),
    ).toEqual(["[&_[cmdk-group-heading]]:text-xs"])
  })

  it("catches arbitrary values, the line-height shorthand and font", () => {
    expect(
      typographyOffenders(
        ".dr-x { @apply text-[13px] text-sm/6 tracking-[-0.02em] font-[600] leading-[1.2]; }",
        ".dr-x",
      ),
    ).toEqual([
      "text-[13px]",
      "text-sm/6",
      "tracking-[-0.02em]",
      "font-[600]",
      "leading-[1.2]",
    ])
    expect(
      typographyOffenders(".dr-x { font: 600 14px Inter; }", ".dr-x"),
    ).toEqual(["font"])
  })

  it("leaves colours and arbitrary sizes that are not type alone", () => {
    expect(
      typographyOffenders(
        ".dr-x { @apply text-muted-foreground text-foreground; }",
        ".dr-x",
      ),
    ).toEqual([])
  })
})

describe("SheetTitle", () => {
  it("adds no size or weight to the dialog title it renders", () => {
    const source = readFileSync("src/components/sheet/Sheet.tsx", "utf8")
    const start = source.indexOf("function SheetTitle")
    const body = source.slice(start, source.indexOf("\nfunction ", start + 1))
    expect(body).not.toMatch(/\btext-(?:xs|sm|base|lg|xl|\dxl)\b/)
    expect(body).not.toMatch(/\bfont-(?:medium|semibold|bold)\b/)
  })
})

/** Classes that set their own type on purpose, with the reason. */
const ROLE_EXEMPT: Array<[string, string, string]> = [
  [
    "src/components/badge/badge.css",
    '.dr-badge[data-size="sm"]',
    "keeps --text-2xs, a micro step no role covers",
  ],
]

describe("role exemptions", () => {
  it.each(ROLE_EXEMPT)("%s %s applies no role: %s", (path, selector) => {
    const css = readFileSync(path, "utf8")
    for (const role of ROLES)
      expect(appliesRole(css, selector, role)).toBe(false)
  })
})

describe("badge geometry", () => {
  const css = readFileSync("src/components/badge/badge.css", "utf8")
  const body = (selector: string) =>
    parseRules(css)
      .filter((rule) => rule.selectors.includes(selector))
      .map((rule) => rule.body)
      .join(" ")

  it.each([
    ['.dr-badge[data-size="sm"]', "1rem"],
    ['.dr-badge[data-size="default"]', "1.25rem"],
    ['.dr-badge[data-size="lg"]', "1.5rem"],
  ])("%s is at least %s tall", (selector, height) => {
    expect(body(selector)).toContain(`min-height: ${height};`)
    expect(body(selector)).not.toMatch(/\bpy-/)
  })

  it("weighs 500 and is never a pill", () => {
    expect(body(".dr-badge")).not.toContain("font-semibold")
    expect(body(".dr-badge")).not.toContain("rounded-full")
    // sm is not a role: it keeps the micro step, at the caption weight.
    expect(body('.dr-badge[data-size="sm"]')).toContain("font-medium")
  })
})
