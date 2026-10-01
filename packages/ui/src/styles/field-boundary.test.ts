import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

// A field keeps its faint --input border on the sides and top and draws the
// 3:1 --field-edge along its bottom; an unchecked checkbox, radio or switch
// draws the edge all round. Under glass only the colours change, so the
// base border widths survive.

interface Rule {
  selector: string
  body: string
}

function rulesOf(file: string): Rule[] {
  const css = readFileSync(`src/components/${file}`, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    // Prettier wraps long :is() lists, leaving spaces inside the parens.
    selector: (m[1] as string)
      .trim()
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")"),
    body: (m[2] as string).trim(),
  }))
}

function bodyOf(file: string, selector: string): string {
  const rule = rulesOf(file).find((r) => r.selector === selector)
  if (!rule) throw new Error(`no rule ${selector} in ${file}`)
  return rule.body
}

/** The glass rule that paints the control at rest. */
function glassRestBody(file: string, cls: string): string {
  const subject = new RegExp(`^\\[data-preset="glass"\\] \\.${cls}(?![\\w-])`)
  const rule = rulesOf(file).find(
    (r) =>
      subject.test(r.selector) &&
      !/:focus|:hover|:disabled|\[data-state|\[data-active/.test(r.selector),
  )
  if (!rule) throw new Error(`no glass rest rule for .${cls} in ${file}`)
  return rule.body
}

const SHORTHAND = /(?<![\w-])border\s*:/

const FIELDS: Array<[string, string]> = [
  ["input/input.css", "dr-input"],
  ["input/input.css", "dr-input-group"],
  ["select/select.css", "dr-select-trigger"],
  ["textarea/textarea.css", "dr-textarea"],
  ["number-input/number-input.css", "dr-number-input-control"],
  ["date-input/date-input.css", "dr-date-input"],
  ["tags-input/tags-input.css", "dr-tags-input-control"],
  ["multi-select/multi-select.css", "dr-multi-select-control"],
  ["input-otp/input-otp.css", "dr-input-otp-slot"],
]

const GLASS_FIELDS: Array<[string, string]> = [
  ["input/input.css", "dr-input"],
  ["select/select.css", "dr-select-trigger"],
  ["textarea/textarea.css", "dr-textarea"],
  ["number-input/number-input.css", "dr-number-input-control"],
  ["date-input/date-input.css", "dr-date-input"],
  ["input-otp/input-otp.css", "dr-input-otp-slot"],
  ["password-input/password-input.css", "dr-password-input-field"],
  ["combobox/combobox.css", "dr-combobox-control"],
]

const SMALL_CONTROLS: Array<[string, string]> = [
  ["checkbox/checkbox.css", "dr-checkbox"],
  ["radio-group/radio-group.css", "dr-radio-group-item"],
  ["switch/switch.css", "dr-switch"],
]

describe("field boundary", () => {
  it.each(FIELDS)(
    "%s .%s draws a faint border and a 3:1 bottom edge",
    (file, cls) => {
      const body = bodyOf(file, `.${cls}`)
      expect(body).toMatch(
        /(?<![\w:-])border-input(?![\w-])|border-color:\s*hsl\(var\(--input\)\)/,
      )
      // Last, so no border-color shorthand after it can take the bottom back.
      expect(body).toMatch(/border-bottom-color: var\(--field-edge\);$/)
    },
  )

  it("gives the glass multi-select the edge its combobox glass rule hides", () => {
    // The control also carries .dr-combobox-control; this rule restores the
    // surface radius for wrapping chips and has to keep the edge with it.
    const body = bodyOf(
      "multi-select/multi-select.css",
      '[data-preset="glass"] .dr-combobox-control.dr-multi-select-control',
    )
    expect(body).toContain("border-bottom-color: var(--field-edge);")
  })

  it("recolours the glass multi-select's bottom with its focus border", () => {
    // The combobox's glass focus rule is (0,3,0), the same as the rule above,
    // and loads earlier, so without this the bottom stays grey on focus.
    const body = bodyOf(
      "multi-select/multi-select.css",
      '[data-preset="glass"] .dr-combobox-control.dr-multi-select-control:is(:focus-within, [data-state="open"])',
    )
    expect(body).toContain("border-bottom-color: hsl(var(--primary) / 0.4);")
  })

  // Under glass the combobox control draws the field's border, so the
  // input inside it is bare; otherwise the two borders nest.
  // The input also carries .dr-input, whose invalid-focus ring is (0,3,0) and
  // sits later in the bundle, so a reset without .dr-input would tie and lose
  // and a focused invalid combobox would nest a second ring inside the control.
  it("leaves the glass combobox one border: the control's", () => {
    const body = bodyOf(
      "combobox/combobox.css",
      '[data-preset="glass"] .dr-combobox-control > .dr-combobox-input.dr-input',
    )
    for (const declaration of [
      "border-width: 0;",
      "background: transparent;",
      "box-shadow: none;",
      "backdrop-filter: none;",
    ]) {
      expect(body).toContain(declaration)
    }
  })

  // The number field carries .dr-input too; its own focus reset is (0,2,0) and
  // loses to the invalid ring, which under glass would nest inside the
  // wrapper's invalid ring.
  it("leaves the glass number input one invalid ring: the wrapper's", () => {
    const body = bodyOf(
      "number-input/number-input.css",
      '[data-preset="glass"] .dr-number-input-control .dr-number-input-field:is(:focus, :focus-visible)',
    )
    expect(body).toContain("box-shadow: none;")
  })

  // The base rule gives grouped slots top, bottom and right borders and the
  // first slot its left; setting widths under glass doubled every seam.
  it("lets grouped glass OTP slots share one seam", () => {
    expect(
      glassRestBody("input-otp/input-otp.css", "dr-input-otp-slot"),
    ).not.toMatch(/border(?:-[a-z]+)?-(?:width|style)\s*:/)
    expect(bodyOf("input-otp/input-otp.css", ".dr-input-otp-slot")).toMatch(
      /(?<![\w:-])border-y border-r(?![\w-])/,
    )
  })

  it.each(GLASS_FIELDS)(
    "glass %s .%s keeps the fog sides over the edge",
    (file, cls) => {
      const body = glassRestBody(file, cls)
      expect(body).not.toMatch(SHORTHAND)
      expect(body).toContain("border-color: var(--fog-15);")
      expect(body).toContain("border-bottom-color: var(--field-edge);")
    },
  )

  // Component rules declare their border colours after the utility's nested
  // rules, and native CSS nesting keeps that order, so an invalid rule with
  // no specificity lost to them and the field kept its neutral border.
  it("lets the invalid state outrank a field's own border colours", () => {
    const theme = readFileSync("src/styles/theme.css", "utf8")
    const utility = /@utility focus-ring-input \{([\s\S]*?)\n\}/.exec(
      theme,
    )?.[1]
    expect(utility).toBeDefined()
    expect(utility).not.toContain(":where(")
    expect(utility).toContain(':is([data-invalid], [aria-invalid="true"])')
  })
})

describe("small control edge", () => {
  it.each(SMALL_CONTROLS)(
    "%s .%s draws the edge while unchecked",
    (file, cls) => {
      expect(bodyOf(file, `.${cls}[data-state="unchecked"]`)).toContain(
        "border-color: var(--field-edge);",
      )
    },
  )

  it.each(SMALL_CONTROLS)(
    "glass %s .%s draws the edge in place of fog",
    (file, cls) => {
      const body = glassRestBody(file, cls)
      expect(body).not.toMatch(SHORTHAND)
      expect(body).toContain("border-color: var(--field-edge);")
    },
  )

  it("keeps the checked checkbox and radio on --primary", () => {
    expect(bodyOf("checkbox/checkbox.css", ".dr-checkbox")).toMatch(
      /(?<![\w:-])border-primary(?![\w-])/,
    )
    expect(
      bodyOf("radio-group/radio-group.css", ".dr-radio-group-item"),
    ).toMatch(/(?<![\w:-])border-primary(?![\w-])/)
  })

  // The 16px thumb is centred by the track's 2px border. Glass used to swap
  // in a 1px shorthand, which left the thumb 1px from one edge and 3px from
  // the other.
  it("keeps the switch track's 2px border under glass", () => {
    expect(bodyOf("switch/switch.css", ".dr-switch")).toMatch(
      /(?<![\w-])border-2(?![\w-])/,
    )
    expect(glassRestBody("switch/switch.css", "dr-switch")).not.toMatch(
      /border(?:-[a-z]+)?-width|(?<![\w-])border\s*:/,
    )
  })
})

const GLASS_INPUT =
  '[data-preset="glass"] .dr-input:not(.dr-number-input *):not(.dr-date-input *):not(.dr-password-input *):not(.dr-input-otp *):not(.dr-file-upload *):not(.dr-combobox *):not(.dr-cascade-select *)'
const INVALID = ':is([data-invalid], [aria-invalid="true"])'
const HAS_INVALID = `:has(${INVALID})`

/** [file, the glass rest rule, how the companion finds invalid, focus forms] */
const INVALID_COMPANIONS: Array<[string, string, string, string[]]> = [
  ["input/input.css", GLASS_INPUT, INVALID, [":focus", ":focus-visible"]],
  [
    "select/select.css",
    '[data-preset="glass"] .dr-select-trigger',
    INVALID,
    [":focus", ":focus-visible"],
  ],
  [
    "textarea/textarea.css",
    '[data-preset="glass"] .dr-textarea',
    INVALID,
    [":focus", ":focus-visible"],
  ],
  [
    "number-input/number-input.css",
    '[data-preset="glass"] .dr-number-input-control',
    HAS_INVALID,
    [":focus-within"],
  ],
  [
    "date-input/date-input.css",
    '[data-preset="glass"] .dr-date-input',
    INVALID,
    [":focus-within"],
  ],
  [
    "password-input/password-input.css",
    '[data-preset="glass"] .dr-password-input-field',
    INVALID,
    [":focus", ":focus-visible"],
  ],
  [
    "combobox/combobox.css",
    '[data-preset="glass"] .dr-combobox-control',
    HAS_INVALID,
    [":focus-within"],
  ],
  [
    "multi-select/multi-select.css",
    '[data-preset="glass"] .dr-combobox-control.dr-multi-select-control',
    HAS_INVALID,
    [":focus-within"],
  ],
]

/** A rule's selector list, split at top-level commas. */
function selectorsOf(rule: Rule): string[] {
  return rule.selector.split(/,(?![^(]*\))/).map((s) => s.trim())
}

// The glass rest rules sit at (0,2,0) or more, so focus-ring-input's invalid
// rule at (0,2,0) never reached a glass field. Each companion appends one
// attribute or pseudo-class to the rule it overrides and follows it in the
// file, so the rest-rule finder above still meets the rest rule first.
describe("glass invalid state", () => {
  it.each(INVALID_COMPANIONS)(
    "%s restates invalid on %s",
    (file, rest, invalid, focus) => {
      const rules = rulesOf(file)
      const restAt = rules.findIndex((r) => r.selector === rest)
      const companionAt = rules.findIndex(
        (r) => r.selector === `${rest}${invalid}`,
      )
      expect(restAt, `no rest rule ${rest}`).toBeGreaterThanOrEqual(0)
      expect(companionAt, "no invalid companion").toBeGreaterThan(restAt)
      expect(rules[companionAt]?.body).toBe(
        "border-color: hsl(var(--destructive));",
      )
      const focused = rules.find((r) =>
        focus.every((f) => selectorsOf(r).includes(`${rest}${invalid}${f}`)),
      )
      expect(focused, "no focused invalid companion").toBeDefined()
      expect(focused?.body).toContain("border-color: hsl(var(--destructive));")
      expect(focused?.body).toContain("0 0 0 1px hsl(var(--destructive))")
    },
  )
})

const OTP_INVALID = ".dr-input-otp-container[data-invalid] .dr-input-otp-slot"
const OTP_INVALID_FOCUSED = [
  `${OTP_INVALID}[data-active]`,
  ".dr-input-otp-container[data-invalid] .dr-input-otp-slot-separate:focus",
]

// The overlay variant's aria-invalid sits on its hidden input, so the slots
// read the container's data-invalid. The default focused rule uses :focus,
// which the focus scan leaves to the field indicator check.
describe("InputOTP invalid state", () => {
  it.each([
    ["default", ""],
    ["glass", '[data-preset="glass"] '],
  ])("draws the %s invalid border and focused ring", (_preset, prefix) => {
    const rules = rulesOf("input-otp/input-otp.css")
    const rest = rules.find((r) => r.selector === `${prefix}${OTP_INVALID}`)
    expect(rest?.body).toBe("border-color: hsl(var(--destructive));")
    const focused = rules.find((r) =>
      OTP_INVALID_FOCUSED.every((f) =>
        selectorsOf(r).includes(`${prefix}${f}`),
      ),
    )
    expect(focused, "no focused invalid rule").toBeDefined()
    expect(focused?.body).toContain("border-color: hsl(var(--destructive));")
    expect(focused?.body).toContain("0 0 0 1px hsl(var(--destructive))")
  })

  it("keeps the glass halo under the invalid ring, after the glass slot rules", () => {
    const rules = rulesOf("input-otp/input-otp.css")
    const glassActive = rules.findIndex((r) =>
      r.selector.startsWith(
        '[data-preset="glass"] .dr-input-otp-slot[data-active]',
      ),
    )
    const glassInvalid = rules.findIndex(
      (r) => r.selector === `[data-preset="glass"] ${OTP_INVALID}`,
    )
    expect(glassActive).toBeGreaterThanOrEqual(0)
    expect(glassInvalid).toBeGreaterThan(glassActive)
    const focused = rules.find((r) =>
      selectorsOf(r).includes(
        `[data-preset="glass"] ${OTP_INVALID}[data-active]`,
      ),
    )
    expect(focused?.body).toBe(
      "border-color: hsl(var(--destructive)); box-shadow: var(--inset-hi), var(--glass-halo-raised), 0 0 0 1px hsl(var(--destructive));",
    )
  })
})
