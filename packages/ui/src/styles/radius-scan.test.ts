import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

// Two axes own every corner: --radius for surfaces and --radius-control for
// buttons and single-line fields. A literal radius follows neither, and
// Tailwind's bare `rounded` is a literal: it compiles to Tailwind's own
// 0.25rem, not to --radius.

const ROOTS = ["src/components", "src/layout"]

/**
 * Decorative blob and orb shapes on the page canvas. They are artwork, not
 * the corner of a control or a surface, so the radius axis does not apply.
 */
const EXEMPT_DIRS = new Set(["background-page"])

/** Classes drawn as a circle or a capsule on purpose, with the reason. */
const FULL_ROUND = new Map<string, string>([
  ["dr-angle-slider", "a circular dial"],
  ["dr-angle-slider-pointer", "the dial's needle is a capsule"],
  ["dr-avatar", "avatars are circles"],
  ["dr-avatar-fallback", "fills the circular avatar"],
  ["dr-badge", "badges are pills at every radius step"],
  ["dr-badge-anchor-dot", "status dot"],
  ["dr-box", 'the consumer asked for rounded="full"'],
  ["dr-carousel-previous", "round arrow floating over the slide"],
  ["dr-carousel-next", "round arrow floating over the slide"],
  ["dr-carousel-indicator", "carousel dot"],
  ["dr-drawer-handle", "the grab handle is a capsule"],
  ["dr-empty-state-icon", "circular icon medallion"],
  ["dr-image-cropper-selection", "the circle crop shape"],
  ["dr-image-cropper-handle", "resize handles are dots"],
  ["dr-notification-bell-badge", "count badge"],
  ["dr-progress", "the track is a capsule"],
  ["dr-radio-group-item", "radios are circles"],
  ["dr-scroll-thumb", "the scrollbar thumb is a capsule"],
  ["dr-sidebar-nav-badge", "count badge"],
  ["dr-slider-track", "the track is a capsule"],
  ["dr-slider-thumb", "slider thumb"],
  ["dr-slider-step", "step dots"],
  ["dr-spinner-circle", "spinner ring"],
  ["dr-steps-indicator", "circular step number"],
  ["dr-switch", "the track is a capsule"],
  ["dr-switch-thumb", "switch thumb"],
  ["dr-timeline-indicator", "timeline dot"],
  ["dr-user-menu-trigger", "avatar trigger"],
])

/** Every overlay surface: [stylesheet, selector of the rule that shapes it]. */
const OVERLAYS: Array<[string, string]> = [
  ["dialog/dialog.css", ".dr-dialog-content"],
  ["drawer/drawer.css", '.dr-drawer-content[data-direction="bottom"]'],
  ["drawer/drawer.css", '.dr-drawer-content[data-direction="top"]'],
  ["drawer/drawer.css", '.dr-drawer-content[data-direction="left"]'],
  ["drawer/drawer.css", '.dr-drawer-content[data-direction="right"]'],
  ["popover/popover.css", ".dr-popover-content"],
  ["hover-card/hover-card.css", ".dr-hover-card-content"],
  ["tooltip/tooltip.css", ".dr-tooltip-content"],
  ["menu-primitives/menu-primitives.css", ".dr-menu-content"],
  ["menu-primitives/menu-primitives.css", ".dr-menu-sub-content"],
  ["menubar/menubar.css", ".dr-menubar-content"],
  ["menubar/menubar.css", ".dr-menubar-sub-content"],
  ["select/select.css", ".dr-select-content"],
  ["combobox/combobox.css", ".dr-combobox-content"],
  ["date-picker/date-picker.css", ".dr-date-picker-content"],
  ["command/command.css", ".dr-command"],
  [
    "virtualized-dropdown-menu/virtualized-dropdown-menu.css",
    ".dr-vdm-content",
  ],
  ["navigation-menu/navigation-menu.css", ".dr-navigation-menu-content"],
  ["color-picker/color-picker.css", ".dr-color-picker-content"],
  ["floating-panel/floating-panel.css", ".dr-floating-panel"],
  ["tour/tour.css", ".dr-tour-popover"],
  ["sonner/sonner.css", ".dr-toast"],
]

/**
 * Stylesheets whose overlay paints the shared overlay surface. Floating
 * panel, tour and toast paint their own and only take the radius.
 */
const OVERLAY_SURFACES = [
  "dialog/dialog.css",
  "sheet/sheet.css",
  "drawer/drawer.css",
  "popover/popover.css",
  "hover-card/hover-card.css",
  "tooltip/tooltip.css",
  "menu-primitives/menu-primitives.css",
  "menubar/menubar.css",
  "select/select.css",
  "combobox/combobox.css",
  "date-picker/date-picker.css",
  "command/command.css",
  "virtualized-dropdown-menu/virtualized-dropdown-menu.css",
  "navigation-menu/navigation-menu.css",
  "color-picker/color-picker.css",
]

const SIDES = "(?:-(?:t|r|b|l|s|e|tl|tr|br|bl|ss|se|es|ee))?"
/** `rounded`, `rounded-t`, `first:rounded-l`: Tailwind's fixed 0.25rem. */
const BARE = new RegExp(`(?<![\\w-])rounded${SIDES}(?![\\w\\[-])`, "g")
/** Tailwind scale steps this kit does not rebind to --radius. */
const UNBOUND_STEP = new RegExp(
  `(?<![\\w-])rounded${SIDES}-(?:xs|xl|2xl|3xl|4xl)(?![\\w-])`,
  "g",
)
const ARBITRARY_LITERAL = new RegExp(
  `(?<![\\w-])rounded${SIDES}-\\[-?\\d*\\.?\\d+[a-z%]+\\]`,
  "g",
)
const RADIUS_DECLARATION = /(?<![\w-])border(?:-[a-z]+)*-radius\s*:\s*([^;]+)/g
const LENGTH = /(?<![\w.-])-?\d*\.?\d+[a-z%]+/g
const FULL = /(?<![\w-])rounded-full(?![\w-])/

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      return EXEMPT_DIRS.has(entry.name) ? [] : filesUnder(path)
    }
    return entry.name.endsWith(".css") ? [path] : []
  })
}

interface Rule {
  path: string
  selectors: string[]
  body: string
}

/** Innermost rules; wrappers such as @layer and @media are transparent. */
function rulesOf(path: string): Rule[] {
  const css = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    path,
    selectors: (match[1] as string)
      .split(",")
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter(Boolean),
    body: match[2] as string,
  }))
}

/** The dr-* classes on a selector's last compound: the element the rule styles. */
function subjectClasses(selector: string): string[] {
  const last = selector.split(/\s*[>+~]\s*|\s+/).pop() ?? ""
  return [...last.matchAll(/\.(dr-[\w-]+)/g)].map((m) => m[1] as string)
}

const RULES = ROOTS.flatMap(filesUnder).flatMap(rulesOf)
const THEME = readFileSync("src/styles/theme.css", "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\s+/g, " ")

function label(rule: Rule): string {
  return `${rule.path}: ${rule.selectors.join(", ")}`
}

function bodyOf(file: string, selector: string): string {
  const rule = RULES.find(
    (r) => r.path.endsWith(file) && r.selectors.includes(selector),
  )
  if (!rule) throw new Error(`no rule ${selector} in ${file}`)
  return rule.body
}

function readsRadius(body: string, token: string): boolean {
  return new RegExp(
    `rounded${SIDES}-\\[var\\(${token}\\)\\]|border-radius:\\s*var\\(${token}\\)\\s*;`,
  ).test(body)
}

function exempt(rule: Rule, list: Map<string, string>): boolean {
  return rule.selectors.some((s) =>
    subjectClasses(s).some((cls) => list.has(cls)),
  )
}

/**
 * The value with every function call that reads a var() removed, so what is
 * left is what the value hard-codes: `calc(var(--r) - 2px)` leaves nothing,
 * `calc(4px + 2px)` leaves both lengths.
 */
function hardCoded(value: string): string {
  let current = value
  for (;;) {
    const next = current.replace(
      /([a-z-]*)\(([^()]*)\)/gi,
      (_, name: string, inner: string) =>
        name === "var" || inner.includes("TOKEN")
          ? "TOKEN"
          : `${name}[${inner}]`,
    )
    if (next === current) return current.replace(/TOKEN/g, "")
    current = next
  }
}

describe("control radius tokens", () => {
  it.each([
    ["sharp", "0"],
    ["subtle", "0.25rem"],
    ["rounded", "0.5rem"],
    ["pill", "9999px"],
  ])("sets --radius-control for %s", (step, value) => {
    const block = new RegExp(`\\[data-radius="${step}"\\] \\{([^}]*)\\}`).exec(
      THEME,
    )
    expect(block?.[1]).toContain(`--radius-control: ${value};`)
  })

  it("defaults --radius-control on :root", () => {
    expect(THEME).toMatch(/:root \{[^}]*--radius-control: 0\.5rem;/)
  })

  it("points the button and field radii at --radius-control", () => {
    expect(THEME).toContain("--btn-radius: var(--radius-control);")
    expect(THEME).toContain("--field-radius: var(--radius-control);")
  })

  it("leaves no reader of the old name", () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name)
        if (entry.isDirectory()) return walk(path)
        return /\.(css|tsx?)$/.test(entry.name) &&
          !entry.name.includes(".test.")
          ? [path]
          : []
      })
    const old = ["--radius", "button"].join("-")
    const offenders = walk("src").filter((path) =>
      readFileSync(path, "utf8").includes(old),
    )
    expect(offenders).toEqual([])
  })
})

describe("control radius readers", () => {
  it("rounds buttons with --btn-radius", () => {
    expect(
      readsRadius(bodyOf("button/button.css", ".dr-btn"), "--btn-radius"),
    ).toBe(true)
  })

  it.each([
    ["input/input.css", ".dr-input"],
    ["input/input.css", ".dr-input-group"],
    ["select/select.css", ".dr-select-trigger"],
    ["date-input/date-input.css", ".dr-date-input"],
    ["number-input/number-input.css", ".dr-number-input-control"],
    ["combobox/combobox.css", '[data-preset="glass"] .dr-combobox-control'],
    [
      "input-otp/input-otp.css",
      '.dr-input-otp-container[data-variant="separate"] .dr-input-otp-slot',
    ],
  ])(
    "rounds the single-line field %s %s with --field-radius",
    (file, selector) => {
      expect(readsRadius(bodyOf(file, selector), "--field-radius")).toBe(true)
    },
  )

  it("rounds the outer corners of grouped OTP slots with --field-radius", () => {
    const body = bodyOf("input-otp/input-otp.css", ".dr-input-otp-slot")
    expect(body).toContain("first:rounded-l-[var(--field-radius)]")
    expect(body).toContain("last:rounded-r-[var(--field-radius)]")
  })

  it.each([
    ["textarea/textarea.css", ".dr-textarea"],
    ["tags-input/tags-input.css", ".dr-tags-input-control"],
    ["multi-select/multi-select.css", ".dr-multi-select-control"],
    [
      "multi-select/multi-select.css",
      '[data-preset="glass"] .dr-combobox-control.dr-multi-select-control',
    ],
  ])("keeps the multi-line field %s %s on --radius", (file, selector) => {
    expect(readsRadius(bodyOf(file, selector), "--radius")).toBe(true)
  })

  it("caps the kbd radius so a pill axis leaves keys square-ish", () => {
    expect(bodyOf("kbd/kbd.css", ".dr-kbd")).toMatch(
      /border-radius:\s*min\(var\(--radius-control\),\s*0\.375rem\)\s*;/,
    )
  })
})

describe("radius scan", () => {
  it("finds the rules it must check", () => {
    expect(RULES.length).toBeGreaterThan(500)
  })

  it("uses no bare rounded utility", () => {
    const offenders = RULES.flatMap((rule) =>
      [...rule.body.matchAll(BARE)].map((m) => `${m[0]} in ${label(rule)}`),
    )
    expect(offenders).toEqual([])
  })

  it("uses no Tailwind radius step the kit does not rebind", () => {
    const offenders = RULES.flatMap((rule) =>
      [...rule.body.matchAll(UNBOUND_STEP)].map(
        (m) => `${m[0]} in ${label(rule)}`,
      ),
    )
    expect(offenders).toEqual([])
  })

  it("uses no literal length in an arbitrary rounded utility", () => {
    const offenders = RULES.flatMap((rule) =>
      [...rule.body.matchAll(ARBITRARY_LITERAL)].map(
        (m) => `${m[0]} in ${label(rule)}`,
      ),
    )
    expect(offenders).toEqual([])
  })

  it("uses no literal length in a border-radius declaration", () => {
    const offenders = RULES.flatMap((rule) =>
      [...rule.body.matchAll(RADIUS_DECLARATION)].flatMap((decl) =>
        [...hardCoded(decl[1] as string).matchAll(LENGTH)].map(
          (m) => `${m[0]} in ${label(rule)}`,
        ),
      ),
    )
    expect(offenders).toEqual([])
  })

  it("draws full circles only where the allowlist says so", () => {
    const offenders = RULES.filter(
      (rule) => FULL.test(rule.body) && !exempt(rule, FULL_ROUND),
    ).map(label)
    expect(offenders).toEqual([])
  })

  it("keeps no stale allowlist entry", () => {
    const used = new Set(
      RULES.filter((rule) => FULL.test(rule.body)).flatMap((rule) =>
        rule.selectors.flatMap(subjectClasses),
      ),
    )
    expect([...FULL_ROUND.keys()].filter((cls) => !used.has(cls))).toEqual([])
  })
})

describe("overlay family", () => {
  it("declares the overlay tokens on :root", () => {
    expect(THEME).toContain("--overlay-bg: var(--surface-overlay-bg);")
    expect(THEME).toContain("--overlay-border: var(--surface-overlay-border);")
    expect(THEME).toContain("--overlay-shadow: var(--surface-overlay-shadow);")
    expect(THEME).toContain("--overlay-radius: var(--radius);")
  })

  it.each(OVERLAYS)("rounds %s %s with --overlay-radius", (file, selector) => {
    const body = bodyOf(file, selector)
    expect(readsRadius(body, "--overlay-radius")).toBe(true)
    expect(body).not.toMatch(
      new RegExp(`(?<![\\w-])rounded${SIDES}-(?:sm|md|lg)(?![\\w-])`),
    )
  })

  // SheetContent renders DialogContent, so the sheet takes the dialog's
  // radius and must not set one of its own.
  it("leaves the sheet on the dialog's radius", () => {
    const own = RULES.filter(
      (rule) =>
        rule.path.endsWith("sheet/sheet.css") &&
        /(?<![\w-])rounded|border(?:-[a-z]+)*-radius/.test(rule.body),
    ).map(label)
    expect(own).toEqual([])
  })

  it.each(OVERLAY_SURFACES)(
    "%s reads the surface through --overlay-*",
    (file) => {
      const css = readFileSync(`src/components/${file}`, "utf8").replace(
        /\/\*[\s\S]*?\*\//g,
        "",
      )
      expect(css).not.toMatch(/var\(--surface-overlay-(?:bg|border|shadow)\)/)
      expect(css).toContain("var(--overlay-bg)")
    },
  )
})
