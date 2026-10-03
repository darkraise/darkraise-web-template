import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join, sep } from "node:path"

// Every control and chrome token has its base value in @layer base, and only
// the unlayered style files under theme/styles/ override it, so a style file
// wins over a base value whatever their specificity. An unlayered declaration
// anywhere else would compete with the style files on specificity and source
// order instead of losing to them outright. jsdom never parses CSS, so the
// source text is what this asserts.

const CONTROL_TOKENS = [
  "--btn-edge",
  "--btn-sheen",
  "--btn-shadow",
  "--btn-neutral-edge",
  "--btn-neutral-sheen",
  "--btn-neutral-shadow",
  "--field-shadow",
  "--check-well-shadow",
  "--thumb-shadow",
  "--selected-view-shadow",
]

const CHROME_TOKENS = [
  "--chrome-rail-bg",
  "--chrome-bar-bg",
  "--chrome-edge",
  "--chrome-shadow",
  "--chrome-backdrop",
  "--chrome-canvas",
]

/** The overlay inputs a style may set; theme.css composes the rest. */
const OVERLAY_TOKENS = [
  "--surface-overlay-layers",
  "--surface-overlay-base",
  "--surface-overlay-blend-mode",
  "--overlay-border",
  "--overlay-shadow",
  "--overlay-backdrop",
]

const CONTRACT = [
  ...CONTROL_TOKENS,
  ...CHROME_TOKENS,
  ...OVERLAY_TOKENS,
  "--shadow-dropdown",
]

/**
 * The surface prop recomposes these on the element that carries it
 * (`[data-surface-fill]` in theme.css), outside @layer base: a custom
 * property that reads another resolves where it is declared, so a :root
 * value would keep <html>'s fill. None of them is a contract token.
 */
const RECOMPOSED_BY_SURFACE_PROP = [
  "--overlay-bg",
  "--surface-overlay-bg",
  "--surface-card-fill",
  "--surface-popover-fill",
  "--surface-raised-fill",
  "--surface-overlay-fill",
  "--surface-card-fill-opaque",
]

/**
 * The inset and flat shell styles clear or tone the chrome by rebinding its
 * fill tokens on the region element, so they hold under every style.
 */
const SHELL_STYLES = join("src", "layout", "shell", "shell-styles.css")
const SHELL_STYLE_REBINDS = [
  "--chrome-rail-bg",
  "--chrome-bar-bg",
  "--chrome-canvas",
]

interface Declaration {
  path: string
  /** At-rule and selector preludes, outermost first. */
  context: string[]
  property: string
  value: string
}

/**
 * Every custom-property declaration in a stylesheet with the blocks it sits
 * in. Comments are dropped; a semicolon or brace inside a string or inside
 * parentheses (a data: URL) splits nothing.
 */
function declarations(path: string): Declaration[] {
  const source = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
  const found: Declaration[] = []
  const context: string[] = []
  let text = ""
  let quote = ""
  let parens = 0
  const flush = () => {
    const match = /^\s*(--[\w-]+)\s*:([\s\S]*)$/.exec(text)
    if (match) {
      found.push({
        path,
        context: [...context],
        property: match[1] as string,
        value: (match[2] as string).replace(/\s+/g, " ").trim(),
      })
    }
    text = ""
  }
  for (const ch of source) {
    if (quote) {
      text += ch
      if (ch === quote) quote = ""
    } else if (ch === '"' || ch === "'") {
      quote = ch
      text += ch
    } else if (ch === "(" || ch === ")") {
      parens += ch === "(" ? 1 : -1
      text += ch
    } else if (parens > 0) {
      text += ch
    } else if (ch === "{") {
      context.push(text.replace(/\s+/g, " ").trim())
      text = ""
    } else if (ch === "}") {
      flush()
      context.pop()
    } else if (ch === ";") {
      flush()
    } else {
      text += ch
    }
  }
  return found
}

function stylesheets(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return stylesheets(path)
    return entry.name.endsWith(".css") ? [path] : []
  })
}

const THEME = join("src", "styles", "theme.css")
const STYLES_DIR = join("src", "theme", "styles") + sep
const SHEETS = stylesheets("src")
const KIT_SHEETS = SHEETS.filter((path) => !path.startsWith(STYLES_DIR))

const LIGHT_BASE = ["@layer base", ":root"]
const DARK_BASE = ["@layer base", ':root[data-mode="dark"]']

function sameContext(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((item, i) => item === b[i])
}

function where(d: Declaration): string {
  return `${d.property} in ${d.context.join(" > ") || "(top level)"} (${d.path})`
}

describe("contract base values", () => {
  const base = declarations(THEME)

  it.each(CONTRACT)("declares %s for light on the layered :root", (token) => {
    expect(
      base.some(
        (d) => d.property === token && sameContext(d.context, LIGHT_BASE),
      ),
    ).toBe(true)
  })

  // Only the control tokens differ by mode at their base.
  it.each(CONTROL_TOKENS)(
    "declares %s for dark in the layered dark block",
    (token) => {
      expect(
        base.some(
          (d) => d.property === token && sameContext(d.context, DARK_BASE),
        ),
      ).toBe(true)
    },
  )
})

describe("where contract tokens are declared", () => {
  const kit = KIT_SHEETS.flatMap(declarations)

  it("reads the kit stylesheets", () => {
    expect(KIT_SHEETS).toContain(THEME)
    expect(KIT_SHEETS).toContain(SHELL_STYLES)
  })

  it("declares a contract token outside theme/styles only inside @layer base", () => {
    const offenders = kit
      .filter((d) => CONTRACT.includes(d.property))
      .filter((d) => d.context[0] !== "@layer base")
      .filter(
        (d) =>
          !(
            d.path === SHELL_STYLES && SHELL_STYLE_REBINDS.includes(d.property)
          ),
      )
      .map(where)
    expect(offenders).toEqual([])
  })

  it("sets a control token outside theme/styles only as a light or dark base value", () => {
    const offenders = kit
      .filter((d) => CONTROL_TOKENS.includes(d.property))
      .filter(
        (d) =>
          d.path !== THEME ||
          !(
            sameContext(d.context, LIGHT_BASE) ||
            sameContext(d.context, DARK_BASE)
          ),
      )
      .map(where)
    expect(offenders).toEqual([])
  })

  it("lets the surface prop recompose only its named fills", () => {
    const recomposed = declarations(THEME).filter((d) =>
      d.context.some((c) => c.startsWith("[data-surface-fill=")),
    )
    expect(recomposed.length).toBeGreaterThan(0)
    expect(
      recomposed
        .map((d) => d.property)
        .filter((name) => !RECOMPOSED_BY_SURFACE_PROP.includes(name)),
    ).toEqual([])
    expect(
      RECOMPOSED_BY_SURFACE_PROP.filter((name) => CONTRACT.includes(name)),
    ).toEqual([])
  })
})

/** Prettier wraps long values inside ( … ); undo that. */
function normalise(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
}

interface Rule {
  selectors: string[]
  body: string
}

/** Innermost rules; @layer and @media are transparent. */
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

/** Every rule body whose selector list holds `selector`, in source order. */
function bodyOf(path: string, selector: string): string {
  const bodies = rulesOf(path)
    .filter((rule) => rule.selectors.includes(selector))
    .map((rule) => rule.body)
  if (bodies.length === 0) throw new Error(`no rule ${selector} in ${path}`)
  return bodies.join(" ")
}

const BUTTON = join("src", "components", "button", "button.css")
const TOGGLE = join("src", "components", "toggle", "toggle.css")
const PAGINATION = join("src", "components", "pagination", "pagination.css")
const CROPPER = join("src", "components", "image-cropper", "image-cropper.css")

const FILLED_SHADOW =
  "box-shadow: var(--btn-edge), var(--btn-shadow), var(--glow-outer), var(--glow-inner);"
const NEUTRAL_SHADOW =
  "box-shadow: var(--btn-neutral-edge), var(--btn-neutral-shadow), var(--glow-outer), var(--glow-inner);"

describe("button families", () => {
  it.each(["default", "destructive"])(
    "the %s button composes the filled family with the glows",
    (variant) => {
      const body = bodyOf(BUTTON, `.dr-btn[data-variant="${variant}"]`)
      expect(body).toContain("background-image: var(--btn-sheen);")
      expect(body).toContain(FILLED_SHADOW)
    },
  )

  it.each(["outline", "secondary"])(
    "the %s button composes the neutral family with the glows",
    (variant) => {
      const body = bodyOf(BUTTON, `.dr-btn[data-variant="${variant}"]`)
      expect(body).toContain("background-image: var(--btn-neutral-sheen);")
      expect(body).toContain(NEUTRAL_SHADOW)
    },
  )

  // Hover and press come from the state layer, so today no rule changes a
  // variant's shadow; one that does must restate the whole list.
  it("restates the whole list wherever a variant's shadow is set", () => {
    const offenders = rulesOf(BUTTON)
      .filter((rule) => rule.body.includes("box-shadow:"))
      .filter((rule) => {
        const selector = rule.selectors.join(", ")
        const filled = /data-variant="(?:default|destructive)"/.test(selector)
        const neutral = /data-variant="(?:outline|secondary)"/.test(selector)
        return (
          (filled && !rule.body.includes(FILLED_SHADOW)) ||
          (neutral && !rule.body.includes(NEUTRAL_SHADOW))
        )
      })
      .map((rule) => rule.selectors.join(", "))
    expect(offenders).toEqual([])
  })

  it.each([
    [
      TOGGLE,
      '.dr-toggle[data-variant="outline"]',
      "box-shadow: var(--btn-neutral-edge), var(--btn-neutral-shadow);",
    ],
    [
      TOGGLE,
      '.dr-toggle[data-variant="default"][data-state="on"]',
      "box-shadow: var(--btn-neutral-edge), var(--btn-neutral-shadow), var(--affordance-glow);",
    ],
    [
      TOGGLE,
      '.dr-toggle[data-variant="outline"][data-state="on"]',
      "box-shadow: var(--btn-neutral-edge), var(--btn-neutral-shadow), var(--affordance-glow);",
    ],
    [
      PAGINATION,
      '.dr-pagination-link[data-active="true"][data-variant="ghost"]',
      "box-shadow: var(--btn-neutral-edge), var(--btn-neutral-shadow), var(--affordance-glow);",
    ],
    [
      CROPPER,
      ".dr-image-cropper-dimensions",
      "box-shadow: var(--btn-neutral-edge), var(--btn-neutral-shadow);",
    ],
  ])("%s %s composes the neutral family", (path, selector, declaration) => {
    expect(bodyOf(path, selector)).toContain(declaration)
  })
})

const OTP = join("src", "components", "input-otp", "input-otp.css")
const OTP_INVALID_ACTIVE =
  ".dr-input-otp-container[data-invalid] .dr-input-otp-slot[data-active]"

describe("InputOTP invalid slot", () => {
  // Both selectors share one rule: the overlay variant's active slot and the
  // separate variant's focused input.
  it("keeps the affordance glow after the destructive ring", () => {
    const body = bodyOf(OTP, OTP_INVALID_ACTIVE)
    expect(body).toMatch(
      /box-shadow: 0 0 0 1px hsl\(var\(--destructive-edge\)\),[^;]*var\(--affordance-glow\);/,
    )
    expect(
      rulesOf(OTP).find((rule) => rule.selectors.includes(OTP_INVALID_ACTIVE))
        ?.selectors,
    ).toContain(
      ".dr-input-otp-container[data-invalid] .dr-input-otp-slot-separate:focus",
    )
  })
})

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
  return css.slice(start, end - 1)
}

const PICKER = join("src", "components", "color-picker", "color-picker.css")
const NUMBER = join("src", "components", "number-input", "number-input.css")
const INVALID = ':is([data-invalid], [aria-invalid="true"])'

describe("fields compose --field-shadow", () => {
  const theme = normalise(
    readFileSync(THEME, "utf8").replace(/\/\*[\s\S]*?\*\//g, ""),
  )

  it.each(["focus-ring-input", "focus-ring-input-wrapper"])(
    "%s paints the field shadow at rest and under each ring",
    (utility) => {
      const body = block(theme, new RegExp(`@utility ${utility} \\{`))
      expect(body).toContain("box-shadow: var(--field-shadow);")
      expect(body).toContain(
        "box-shadow: 0 0 0 1px hsl(var(--primary)), var(--field-shadow);",
      )
      expect(body).toContain(
        "box-shadow: 0 0 0 1px hsl(var(--destructive-edge)), var(--field-shadow);",
      )
    },
  )

  it.each([
    [OTP, ".dr-input-otp-slot", "box-shadow: var(--field-shadow);"],
    [
      OTP,
      ".dr-input-otp-slot[data-active]",
      "box-shadow: 0 0 0 1px hsl(var(--primary)), var(--field-shadow), var(--affordance-glow);",
    ],
    [
      OTP,
      ".dr-input-otp-slot-separate:focus",
      "box-shadow: 0 0 0 1px hsl(var(--primary)), var(--field-shadow), var(--affordance-glow);",
    ],
    [
      OTP,
      OTP_INVALID_ACTIVE,
      "box-shadow: 0 0 0 1px hsl(var(--destructive-edge)), var(--field-shadow), var(--affordance-glow);",
    ],
    [PICKER, ".dr-color-picker-trigger", "box-shadow: var(--field-shadow);"],
    [
      NUMBER,
      `.dr-number-input-control:has(${INVALID}):focus-within`,
      "box-shadow: 0 0 0 1px hsl(var(--destructive-edge)), var(--field-shadow);",
    ],
  ])("%s %s composes the field shadow", (path, selector, declaration) => {
    expect(bodyOf(path, selector)).toContain(declaration)
  })
})

const CHECKBOX = join("src", "components", "checkbox", "checkbox.css")
const RADIO = join("src", "components", "radio-group", "radio-group.css")
const SWITCH = join("src", "components", "switch", "switch.css")
const SLIDER = join("src", "components", "slider", "slider.css")
const ANGLE = join("src", "components", "angle-slider", "angle-slider.css")
const TABS = join("src", "components", "tabs", "tabs.css")
const SEGMENT = join("src", "components", "segment-group", "segment-group.css")

describe("checkables, thumbs and the view pill", () => {
  it.each([
    [CHECKBOX, '.dr-checkbox[data-state="unchecked"]'],
    [RADIO, '.dr-radio-group-item[data-state="unchecked"]'],
    [SWITCH, '.dr-switch[data-state="unchecked"]'],
  ])("%s %s sinks into the check well", (path, selector) => {
    expect(bodyOf(path, selector)).toContain(
      "box-shadow: var(--check-well-shadow);",
    )
  })

  it.each([
    [SWITCH, ".dr-switch-thumb", "box-shadow: var(--thumb-shadow);"],
    [
      SLIDER,
      ".dr-slider-thumb",
      "box-shadow: var(--thumb-shadow), var(--affordance-glow);",
    ],
    [ANGLE, ".dr-angle-slider-pointer", "box-shadow: var(--thumb-shadow);"],
  ])("%s %s raises its thumb", (path, selector, declaration) => {
    expect(bodyOf(path, selector)).toContain(declaration)
  })

  it.each([
    [
      CHECKBOX,
      '.dr-checkbox[data-state="checked"]',
      "box-shadow: var(--affordance-glow);",
    ],
    [
      RADIO,
      '.dr-radio-group-item[data-state="checked"]',
      "box-shadow: var(--affordance-glow);",
    ],
    [
      SWITCH,
      '.dr-switch[data-state="checked"] .dr-switch-thumb',
      "box-shadow: var(--thumb-shadow), var(--affordance-glow);",
    ],
    [
      TABS,
      '.dr-tabs-indicator[data-variant="default"]',
      "box-shadow: var(--selected-view-shadow), var(--affordance-glow);",
    ],
    [
      SEGMENT,
      ".dr-segment-group-indicator",
      "box-shadow: var(--selected-view-shadow), var(--affordance-glow);",
    ],
    [
      SEGMENT,
      '.dr-segment-group[data-color="accent"] .dr-segment-group-indicator[data-variant="default"]',
      "box-shadow: var(--selected-view-shadow), var(--affordance-glow);",
    ],
  ])(
    "%s %s keeps the affordance glow beside its family token",
    (path, selector, declaration) => {
      expect(bodyOf(path, selector)).toContain(declaration)
    },
  )
})
