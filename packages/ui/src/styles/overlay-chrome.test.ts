import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

// One rule for every floating surface and severity message: Alert, Banner
// and Toast paint the opaque status pairs, toasts read the
// overlay tokens, the menu family agrees on its details, header chrome is
// transparent at rest, and sheets square their viewport edge.

interface Rule {
  selectors: string[]
  body: string
}

/** Prettier wraps long selectors and values inside ( … ); undo that. */
function normalise(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
}

function source(path: string): string {
  return readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
}

/** Innermost rules; wrappers such as @layer and @media are transparent. */
function rulesOf(path: string): Rule[] {
  return [...source(path).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selectors: (match[1] as string)
      .split(/,(?![^(]*\))/)
      .map(normalise)
      .filter(Boolean),
    body: normalise(match[2] as string),
  }))
}

/** Every rule body naming `selector`, joined in source order. */
function bodyOf(path: string, selector: string): string {
  const bodies = rulesOf(path)
    .filter((rule) => rule.selectors.includes(selector))
    .map((rule) => rule.body)
  if (bodies.length === 0) throw new Error(`no rule ${selector} in ${path}`)
  return bodies.join(" ")
}

const THEME = "src/styles/theme.css"
const ALERT = "src/components/alert/alert.css"
const BANNER = "src/components/banner/banner.css"
const SONNER = "src/components/sonner/sonner.css"

const STATUSES = ["destructive", "success", "warning", "info"] as const

describe("severity pairs", () => {
  it("declares no shared tint", () => {
    expect(normalise(source(THEME))).not.toContain("--status-tint")
  })

  it.each(STATUSES)("alert %s paints its pair", (status) => {
    const variant = `.dr-alert[data-variant="${status}"]`
    const body = bodyOf(ALERT, variant)
    expect(body).toContain(`--alert-subtle: var(--${status}-subtle);`)
    expect(body).toContain(`--alert-edge: var(--${status}-edge);`)
    expect(body).toContain(`--alert-text: var(--${status}-text);`)
    expect(body).toContain("background-color: hsl(var(--alert-subtle));")
    expect(body).toContain("border-left-color: hsl(var(--alert-edge));")
    expect(body).not.toContain("background-image")
    expect(bodyOf(ALERT, `${variant} > svg`)).toContain(
      "color: hsl(var(--alert-edge));",
    )
    expect(bodyOf(ALERT, `${variant} .dr-alert-title`)).toContain(
      "color: hsl(var(--alert-text));",
    )
  })

  it.each(STATUSES)("banner %s paints its pair", (status) => {
    const variant = `.dr-banner[data-variant="${status}"]`
    const body = bodyOf(BANNER, variant)
    expect(body).toContain(`--banner-subtle: var(--${status}-subtle);`)
    expect(body).toContain(`--banner-edge: var(--${status}-edge);`)
    expect(body).toContain(`--banner-text: var(--${status}-text);`)
    expect(body).toContain("background-color: hsl(var(--banner-subtle));")
    expect(body).toContain("border-left-color: hsl(var(--banner-edge));")
    expect(body).not.toContain("background-image")
    expect(body).not.toMatch(/(?<![\w:-])bg-muted(?![\w-])/)
    expect(body).toMatch(/(?<![\w:-])border-border(?![\w-])/)
    expect(bodyOf(BANNER, `${variant} .dr-banner-icon`)).toContain(
      "color: hsl(var(--banner-edge));",
    )
  })

  it.each([
    ["success", "success"],
    ["error", "destructive"],
    ["warning", "warning"],
    ["info", "info"],
  ])("toast %s paints the %s pair", (kind, status) => {
    const toast = `.dr-toast--${kind}`
    const body = bodyOf(SONNER, toast)
    expect(body).toContain(`--toast-subtle: var(--${status}-subtle);`)
    expect(body).toContain(`--toast-accent: var(--${status}-edge);`)
    expect(body).toContain(`--toast-text: var(--${status}-text);`)
    expect(body).toContain("background: hsl(var(--toast-subtle));")
    expect(bodyOf(SONNER, ".dr-toast-icon")).toContain(
      "color: hsl(var(--toast-accent, var(--popover-foreground)));",
    )
    expect(bodyOf(SONNER, `${toast} .dr-toast-title`)).toContain(
      "color: hsl(var(--toast-text));",
    )
  })

  it("paints no toast kind in ::before", () => {
    const before = rulesOf(SONNER).flatMap((rule) =>
      rule.selectors.filter((s) => /^\.dr-toast--\w+::before$/.test(s)),
    )
    expect(before).toEqual([])
  })

  it("leaves the banner's body text on the foreground in dark mode", () => {
    const dark = rulesOf(BANNER).flatMap((rule) =>
      rule.selectors.filter((s) => s.startsWith('[data-mode="dark"]')),
    )
    expect(dark).toEqual([])
  })
})

describe("toast surface", () => {
  it("reads the overlay tokens and blend mode like every other overlay", () => {
    const body = bodyOf(SONNER, ".dr-toast")
    for (const declaration of [
      "background: var(--overlay-bg);",
      "background-blend-mode: var(--surface-overlay-blend-mode);",
      "border-color: var(--overlay-border);",
      "box-shadow: var(--overlay-shadow);",
    ]) {
      expect(body).toContain(declaration)
    }
    expect(body).toContain("rounded-[var(--overlay-radius)]")
    expect(body).not.toMatch(/(?<![\w:-])(?:bg-popover|border-border)(?![\w-])/)
    expect(body).not.toContain("shadow-[var(--shadow-dropdown)]")
  })
})

const MENU = "src/components/menu-primitives/menu-primitives.css"
const SELECT = "src/components/select/select.css"
const MENUBAR = "src/components/menubar/menubar.css"
const COMMAND = "src/components/command/command.css"

/** The utilities a rule's @apply lists. */
function applied(body: string): string[] {
  return (/@apply ([^;]*);/.exec(body)?.[1] ?? "").split(" ")
}

describe("menu family", () => {
  it.each([
    [MENU, ".dr-menu-separator"],
    [SELECT, ".dr-select-separator"],
    [MENUBAR, ".dr-menubar-separator"],
    [COMMAND, ".dr-command-separator"],
  ])("%s %s draws a --border line", (path, selector) => {
    expect(applied(bodyOf(path, selector))).toContain("bg-border")
  })

  it.each([
    [MENU, ".dr-menu-shortcut"],
    [MENUBAR, ".dr-menubar-shortcut"],
    [COMMAND, ".dr-command-shortcut"],
  ])("%s %s is muted text, not faded", (path, selector) => {
    const utilities = applied(bodyOf(path, selector))
    expect(utilities).toContain("text-muted-foreground")
    expect(utilities.filter((u) => u.startsWith("opacity-"))).toEqual([])
  })

  it.each([
    [MENU, ".dr-menu-content"],
    [MENU, ".dr-menu-sub-content"],
    [MENUBAR, ".dr-menubar-content"],
    [MENUBAR, ".dr-menubar-sub-content"],
  ])("%s %s is at least 8rem wide", (path, selector) => {
    const utilities = applied(bodyOf(path, selector))
    expect(utilities).toContain("min-w-[8rem]")
    expect(utilities).not.toContain("min-w-[12rem]")
  })

  it.each([
    [MENU, ".dr-menu-label", "px-2"],
    [SELECT, ".dr-select-label", "pl-8"],
    [MENUBAR, ".dr-menubar-label", "px-2"],
  ])("%s %s is a muted caption", (path, selector, padding) => {
    const utilities = applied(bodyOf(path, selector))
    for (const utility of ["type-caption", "text-muted-foreground", padding]) {
      expect(utilities).toContain(utility)
    }
  })

  it("gives command group headings the same caption", () => {
    expect(
      applied(bodyOf(COMMAND, ".dr-command-group [cmdk-group-heading]")),
    ).toContain("type-caption")
    expect(applied(bodyOf(COMMAND, ".dr-command-group"))).toContain(
      "[&_[cmdk-group-heading]]:text-muted-foreground",
    )
  })
})

describe("menu rows", () => {
  it.each([
    ["src/components/combobox/combobox.css", ".dr-combobox-item"],
    ["src/components/listbox/listbox.css", ".dr-listbox-item"],
    ["src/components/tree-view/tree-view.css", ".dr-tree-view-item"],
    ["src/components/cascade-select/cascade-select.css", ".dr-cascade-item"],
  ])("%s %s pads its rows with the density token", (path, selector) => {
    const utilities = applied(bodyOf(path, selector))
    expect(utilities).toContain("py-[var(--density-row-py)]")
    expect(utilities).not.toContain("py-1.5")
  })

  it("gives command items the pointer cursor every other menu row has", () => {
    const utilities = applied(bodyOf(COMMAND, ".dr-command-item"))
    expect(utilities).toContain("cursor-pointer")
    expect(utilities).not.toContain("cursor-default")
  })
})

describe("header chrome", () => {
  it.each([
    [
      "src/components/navigation-menu/navigation-menu.css",
      ".dr-navigation-menu-trigger",
    ],
    [MENUBAR, ".dr-menubar"],
  ])("%s %s is transparent at rest", (path, selector) => {
    const utilities = applied(bodyOf(path, selector))
    expect(utilities).toContain("bg-transparent")
    expect(utilities).not.toContain("bg-background")
  })

  it("keeps the menubar's frame", () => {
    expect(applied(bodyOf(MENUBAR, ".dr-menubar"))).toContain("border")
  })
})

describe("alert dialog footer", () => {
  // The footer stacks Cancel under Action below `sm` with gap-2; a margin
  // on Cancel doubled that to 16px.
  it("leaves the footer gap as the only space between the buttons", () => {
    const margins = rulesOf("src/components/alert-dialog/alert-dialog.css")
      .filter((rule) =>
        rule.selectors.some((s) => s.includes(".dr-alert-dialog-cancel")),
      )
      .filter((rule) => /(?<![\w-])(?:m[trblxy]?-|margin)/.test(rule.body))
    expect(margins).toEqual([])
    expect(
      applied(
        bodyOf(
          "src/components/overlay-primitives/overlay-primitives.css",
          ".dr-overlay-footer",
        ),
      ),
    ).toContain("gap-2")
  })
})

describe("sheet edges", () => {
  it.each([
    [
      "top",
      "border-width: 0 0 1px;",
      "border-radius: 0 0 var(--overlay-radius) var(--overlay-radius);",
      "padding-top: max(1.5rem, env(safe-area-inset-top));",
    ],
    [
      "bottom",
      "border-width: 1px 0 0;",
      "border-radius: var(--overlay-radius) var(--overlay-radius) 0 0;",
      "padding-bottom: max(1.5rem, env(safe-area-inset-bottom));",
    ],
    [
      "left",
      "border-width: 0 1px 0 0;",
      "border-radius: 0 var(--overlay-radius) var(--overlay-radius) 0;",
      "padding-left: max(1.5rem, env(safe-area-inset-left));",
    ],
    [
      "right",
      "border-width: 0 0 0 1px;",
      "border-radius: var(--overlay-radius) 0 0 var(--overlay-radius);",
      "padding-right: max(1.5rem, env(safe-area-inset-right));",
    ],
  ])(
    "a %s sheet squares its viewport edge and pads it like the others",
    (side, border, radius, padding) => {
      const body = bodyOf(
        "src/components/sheet/sheet.css",
        `.dr-sheet-content[data-side="${side}"]`,
      )
      expect(body).toContain(border)
      expect(body).toContain(radius)
      expect(body).toContain(padding)
    },
  )
})
