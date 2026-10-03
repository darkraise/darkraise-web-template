import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

// A field keeps its faint --input border on the sides and top and draws the
// 3:1 --field-edge along its bottom; an unchecked checkbox, radio or switch
// draws the edge all round.

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

  // The base rule gives grouped slots top, bottom and right borders and the
  // first slot its left, so neighbouring slots share one seam.
  it("lets grouped OTP slots share one seam", () => {
    expect(bodyOf("input-otp/input-otp.css", ".dr-input-otp-slot")).toMatch(
      /(?<![\w:-])border-y border-r(?![\w-])/,
    )
  })

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

  it("keeps the checked checkbox and radio on --primary", () => {
    expect(bodyOf("checkbox/checkbox.css", ".dr-checkbox")).toMatch(
      /(?<![\w:-])border-primary(?![\w-])/,
    )
    expect(
      bodyOf("radio-group/radio-group.css", ".dr-radio-group-item"),
    ).toMatch(/(?<![\w:-])border-primary(?![\w-])/)
  })

  // The 16px thumb is centred by the track's 2px border.
  it("keeps the switch track's 2px border", () => {
    expect(bodyOf("switch/switch.css", ".dr-switch")).toMatch(
      /(?<![\w-])border-2(?![\w-])/,
    )
  })
})

const INVALID = ':is([data-invalid], [aria-invalid="true"])'

/** A rule's selector list, split at top-level commas. */
function selectorsOf(rule: Rule): string[] {
  return rule.selector.split(/,(?![^(]*\))/).map((s) => s.trim())
}

const OTP_INVALID = ".dr-input-otp-container[data-invalid] .dr-input-otp-slot"
const OTP_INVALID_FOCUSED = [
  `${OTP_INVALID}[data-active]`,
  ".dr-input-otp-container[data-invalid] .dr-input-otp-slot-separate:focus",
]

// The overlay variant's aria-invalid sits on its hidden input, so the slots
// read the container's data-invalid. The focused rule uses :focus, which the
// focus scan leaves to the field indicator check.
describe("InputOTP invalid state", () => {
  it("draws the invalid border and focused ring", () => {
    const rules = rulesOf("input-otp/input-otp.css")
    const rest = rules.find((r) => r.selector === OTP_INVALID)
    expect(rest?.body).toBe("border-color: hsl(var(--destructive-edge));")
    const focused = rules.find((r) =>
      OTP_INVALID_FOCUSED.every((f) => selectorsOf(r).includes(f)),
    )
    expect(focused, "no focused invalid rule").toBeDefined()
    expect(focused?.body).toContain(
      "border-color: hsl(var(--destructive-edge));",
    )
    expect(focused?.body).toContain("0 0 0 1px hsl(var(--destructive-edge))")
  })
})

// NumberField puts aria-invalid on the field and DateInput takes it on its
// root, but focus-ring-input-wrapper turns a wrapper's edge only while it is
// focused, and only for an attribute on the wrapper itself.
describe("wrapper field invalid state", () => {
  it("turns the number control's edge when its field is invalid", () => {
    const rules = rulesOf("number-input/number-input.css")
    const rest = rules.find(
      (r) => r.selector === `.dr-number-input-control:has(${INVALID})`,
    )
    expect(rest?.body).toBe("border-color: hsl(var(--destructive-edge));")
    const focused = rules.find(
      (r) =>
        r.selector === `.dr-number-input-control:has(${INVALID}):focus-within`,
    )
    expect(focused?.body).toBe(
      "border-color: hsl(var(--destructive-edge)); box-shadow: 0 0 0 1px hsl(var(--destructive-edge)), var(--field-shadow);",
    )
  })

  // The field carries .dr-input, whose invalid-focus ring is (0,3,0) and
  // would nest inside the control's ring; naming .dr-input lifts the reset
  // to (0,4,0).
  it("leaves the number control one invalid ring: the control's", () => {
    expect(
      bodyOf(
        "number-input/number-input.css",
        ".dr-number-input-control .dr-number-input-field.dr-input:is(:focus, :focus-visible)",
      ),
    ).toBe("box-shadow: none;")
  })

  it("turns the date input's edge at rest when it is invalid", () => {
    expect(
      bodyOf("date-input/date-input.css", `.dr-date-input${INVALID}`),
    ).toBe("border-color: hsl(var(--destructive-edge));")
  })
})
