import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

// One rule for every floating surface and severity message: Alert, Banner
// and Toast share a 10% status tint over an opaque base, toasts read the
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

/** A status colour written with a literal alpha instead of --status-tint. */
const LITERAL_TINT =
  /hsl\(var\(--(?:alert|banner|toast)-accent\) \/ (?:\d*\.)?\d+\)/

describe("severity tint", () => {
  it("declares one tint for every severity surface", () => {
    expect(normalise(source(THEME))).toContain("--status-tint: 0.1;")
  })

  it.each([
    [ALERT, '.dr-alert[data-variant="destructive"]', "--alert-accent"],
    [BANNER, '.dr-banner[data-variant="info"]', "--banner-accent"],
  ])("%s %s paints the tint over its opaque base", (path, selector, accent) => {
    const body = bodyOf(path, selector)
    const tint = `hsl(var(${accent}) / var(--status-tint))`
    expect(body).toContain(
      `background-image: linear-gradient(${tint}, ${tint});`,
    )
    expect(body).not.toMatch(/background-color:/)
    expect(body).toContain(`border-left-color: hsl(var(${accent}));`)
  })

  it.each([ALERT, BANNER, SONNER])(
    "%s writes no literal tint alpha",
    (path) => {
      expect(normalise(source(path))).not.toMatch(LITERAL_TINT)
    },
  )

  it("keeps the banner on its muted base and neutral frame", () => {
    const body = bodyOf(BANNER, '.dr-banner[data-variant="info"]')
    expect(body).toMatch(/(?<![\w:-])bg-muted(?![\w-])/)
    expect(body).toMatch(/(?<![\w:-])border-border(?![\w-])/)
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
      "isolation: isolate;",
    ]) {
      expect(body).toContain(declaration)
    }
    expect(body).toContain("rounded-[var(--overlay-radius)]")
    expect(body).not.toMatch(/(?<![\w:-])(?:bg-popover|border-border)(?![\w-])/)
    expect(body).not.toContain("shadow-[var(--shadow-dropdown)]")
  })

  // --overlay-bg is a multi-layer `background` value, which a later
  // background-image on the toast would overwrite.
  it.each(["success", "error", "warning", "info"])(
    "paints the %s tint in ::before over the surface",
    (kind) => {
      const tint = bodyOf(SONNER, `.dr-toast--${kind}::before`)
      expect(tint).toContain(
        "background: hsl(var(--toast-accent) / var(--status-tint));",
      )
      expect(tint).toContain("inset: 0;")
      expect(tint).toContain("z-index: -1;")
      expect(bodyOf(SONNER, `.dr-toast--${kind}`)).not.toMatch(
        /border-color|background/,
      )
    },
  )
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
  ])("%s %s is a small muted group label", (path, selector, padding) => {
    const utilities = applied(bodyOf(path, selector))
    for (const utility of [
      "text-xs",
      "font-medium",
      "text-muted-foreground",
      padding,
    ]) {
      expect(utilities).toContain(utility)
    }
    expect(utilities).not.toContain("text-sm")
    expect(utilities).not.toContain("font-semibold")
  })

  it("gives command group headings the same label style", () => {
    const utilities = applied(bodyOf(COMMAND, ".dr-command-group"))
    for (const utility of [
      "[&_[cmdk-group-heading]]:text-xs",
      "[&_[cmdk-group-heading]]:font-medium",
      "[&_[cmdk-group-heading]]:text-muted-foreground",
    ]) {
      expect(utilities).toContain(utility)
    }
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
