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
    // The control also carries .dr-combobox-control, whose glass border
    // shorthand (0,2,0) would repaint the bottom; its inner input has no
    // border, unlike the combobox's.
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
