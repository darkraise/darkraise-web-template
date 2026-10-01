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
]

/** A utility that sets a size, weight, tracking or line height. */
const TYPOGRAPHY =
  /^(?:text-(?:xs|sm|base|lg|xl|[2-9]xl|\[length:[^\]]+\])|font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)|tracking-[\w-]+|leading-[\w-[\]().]+)$/

const DECLARATION =
  /(?:^|;)\s*(font-size|font-weight|letter-spacing|line-height)\s*:/

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
  it.each(ROLE_CLASSES)("%s %s applies type-%s", (path, selector, role) => {
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
