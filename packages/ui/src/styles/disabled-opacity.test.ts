import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { splitToken } from "./interactive-classes"
import { resolveFieldTrigger } from "../test/fieldTrigger"

// Disabled controls faded by three amounts — 0.5 on most, 0.6 on compound
// roots, 0.7 on the label and Editable — so two unavailable controls side by
// side disagreed about how unavailable they were. Every disabled rule now
// reads one token.
//
// A disabled rule is one whose selector, or the Tailwind variant on the
// utility, names `disabled`, `data-disabled`, `aria-disabled` or
// `peer-disabled`. A `:not(…)` guard means the opposite — it keeps a hover
// rule off disabled controls — so it is stripped before the check.

const TOKEN_DECLARATION = "var(--disabled-opacity)"
const TOKEN_UTILITY = "opacity-[var(--disabled-opacity)]"

const NOT_ALLOWED = "cursor-not-allowed"
const BLOCKERS = ["pointer-events-none", "cursor-default"]
const DECLARED_AS: Record<string, string> = {
  "opacity: var(--disabled-opacity)": TOKEN_UTILITY,
  "cursor: not-allowed": NOT_ALLOWED,
  "cursor: default": "cursor-default",
  "pointer-events: none": "pointer-events-none",
}

const C = "src/components/"

/**
 * Where each control draws its disabled state: [file, selector, variant
 * chain ("" for the selector itself), what it must set]. A "fade" sets the
 * token and the not-allowed cursor; a "cursor" sets only the cursor, because
 * an ancestor fades. Listing them makes a deleted or renamed rule fail here
 * instead of passing the scan by absence.
 */
const REQUIRED: Array<[string, string, string, "fade" | "cursor"]> = [
  [
    `${C}angle-slider/angle-slider.css`,
    ".dr-angle-slider[data-disabled]",
    "",
    "fade",
  ],
  [`${C}button/button.css`, ".dr-btn", "disabled", "fade"],
  [`${C}button/button.css`, ".dr-btn", "aria-disabled", "fade"],
  [
    `${C}calendar/calendar.css`,
    ".dr-calendar-nav-btn",
    "aria-disabled",
    "fade",
  ],
  [
    `${C}cascade-select/cascade-select.css`,
    '.dr-cascade-item[aria-disabled="true"]',
    "",
    "fade",
  ],
  [`${C}checkbox/checkbox.css`, ".dr-checkbox", "disabled", "fade"],
  [
    `${C}color-picker/color-picker.css`,
    '.dr-color-picker[data-disabled="true"]',
    "",
    "fade",
  ],
  [
    `${C}color-picker/color-picker.css`,
    '.dr-color-picker-swatch[data-disabled="true"]',
    "",
    "fade",
  ],
  [
    `${C}color-picker/color-picker.css`,
    '.dr-color-picker-trigger[data-disabled="true"]',
    "",
    "fade",
  ],
  [
    `${C}color-picker/color-picker.css`,
    '.dr-color-picker-area[data-disabled="true"]',
    "",
    "fade",
  ],
  [
    `${C}color-picker/color-picker.css`,
    '.dr-color-picker-swatch-item[data-disabled="true"]',
    "",
    "fade",
  ],
  [
    `${C}color-picker/color-picker.css`,
    '.dr-color-picker-eye-dropper-trigger[data-disabled="true"]',
    "",
    "fade",
  ],
  [
    `${C}combobox/combobox.css`,
    '.dr-combobox[data-disabled="true"]',
    "",
    "fade",
  ],
  [
    `${C}combobox/combobox.css`,
    '.dr-combobox-item[data-disabled="true"]',
    "",
    "fade",
  ],
  [`${C}command/command.css`, ".dr-command-input", "disabled", "fade"],
  [
    `${C}command/command.css`,
    ".dr-command-item",
    "data-[disabled=true]",
    "fade",
  ],
  [`${C}accordion/accordion.css`, ".dr-accordion-trigger:disabled", "", "fade"],
  [
    `${C}date-input/date-input.css`,
    ".dr-date-input[data-disabled]",
    "",
    "fade",
  ],
  [
    `${C}date-input/date-input.css`,
    ".dr-date-input-segment",
    "disabled",
    "cursor",
  ],
  [
    `${C}date-picker/date-picker.css`,
    '.dr-date-picker[data-disabled="true"]',
    "",
    "fade",
  ],
  [
    `${C}date-picker/date-picker.css`,
    '.dr-date-picker-trigger[data-disabled="true"]',
    "",
    "fade",
  ],
  [
    `${C}editable/editable.css`,
    '.dr-editable[data-disabled="true"] .dr-editable-preview',
    "",
    "fade",
  ],
  [
    `${C}editable/editable.css`,
    ".dr-editable-edit-trigger, .dr-editable-submit-trigger, .dr-editable-cancel-trigger",
    "disabled",
    "fade",
  ],
  [
    `${C}field/field.css`,
    ".dr-field-title",
    "group-data-[disabled=true]/field",
    "fade",
  ],
  [
    `${C}field/field.css`,
    ".dr-field-label",
    "group-data-[disabled=true]/field",
    "fade",
  ],
  [
    `${C}fieldset/fieldset.css`,
    ".dr-fieldset:disabled, .dr-fieldset[disabled]",
    "",
    "fade",
  ],
  [
    `${C}file-upload/file-upload.css`,
    '.dr-file-upload[data-disabled="true"]',
    "",
    "fade",
  ],
  [
    `${C}file-upload/file-upload.css`,
    '.dr-file-upload-dropzone[data-disabled="true"]',
    "",
    "fade",
  ],
  [
    `${C}file-upload/file-upload.css`,
    ".dr-file-upload-item-delete-trigger",
    "disabled",
    "fade",
  ],
  [
    `${C}file-upload/file-upload.css`,
    ".dr-file-upload-clear-trigger",
    "disabled",
    "fade",
  ],
  [`${C}input/input.css`, ".dr-input", "disabled", "fade"],
  [
    `${C}input/input.css`,
    ".dr-input-group:has(> .dr-input-grouped:disabled)",
    "",
    "fade",
  ],
  [
    `${C}input-otp/input-otp.css`,
    ".dr-input-otp-container",
    "has-[:disabled]",
    "fade",
  ],
  [
    `${C}input-otp/input-otp.css`,
    ".dr-input-otp-slot-separate:disabled",
    "",
    "fade",
  ],
  [`${C}label/label.css`, ".dr-label", "peer-disabled", "fade"],
  [`${C}listbox/listbox.css`, ".dr-listbox[data-disabled]", "", "fade"],
  [
    `${C}listbox/listbox.css`,
    ".dr-listbox[data-disabled] .dr-listbox-item",
    "",
    "cursor",
  ],
  [`${C}listbox/listbox.css`, ".dr-listbox-item[data-disabled]", "", "fade"],
  [
    `${C}menu-primitives/menu-primitives.css`,
    ".dr-menu-item",
    "data-[disabled]",
    "fade",
  ],
  [
    `${C}menu-primitives/menu-primitives.css`,
    ".dr-menu-checkbox-item",
    "data-[disabled]",
    "fade",
  ],
  [
    `${C}menu-primitives/menu-primitives.css`,
    ".dr-menu-radio-item",
    "data-[disabled]",
    "fade",
  ],
  [`${C}menubar/menubar.css`, ".dr-menubar-item", "data-[disabled]", "fade"],
  [
    `${C}menubar/menubar.css`,
    ".dr-menubar-checkbox-item",
    "data-[disabled]",
    "fade",
  ],
  [
    `${C}menubar/menubar.css`,
    ".dr-menubar-radio-item",
    "data-[disabled]",
    "fade",
  ],
  [
    `${C}multi-select/multi-select.css`,
    '.dr-multi-select-control[data-disabled="true"]',
    "",
    "fade",
  ],
  [
    `${C}multi-select/multi-select.css`,
    ".dr-multi-select-chip-remove:disabled",
    "",
    "fade",
  ],
  [
    `${C}multi-select/multi-select.css`,
    ".dr-multi-select-clear, .dr-multi-select-toggle",
    "disabled",
    "cursor",
  ],
  [
    `${C}navigation-menu/navigation-menu.css`,
    ".dr-navigation-menu-trigger",
    "disabled",
    "fade",
  ],
  [
    `${C}number-input/number-input.css`,
    ".dr-number-input[data-disabled]",
    "",
    "fade",
  ],
  [
    `${C}number-input/number-input.css`,
    ".dr-number-input-stepper",
    "disabled",
    "fade",
  ],
  [
    `${C}overlay-primitives/overlay-primitives.css`,
    ".dr-overlay-close-btn",
    "disabled",
    "fade",
  ],
  [
    `${C}password-input/password-input.css`,
    ".dr-password-input-trigger",
    "disabled",
    "fade",
  ],
  [
    `${C}radio-group/radio-group.css`,
    ".dr-radio-group-item",
    "disabled",
    "fade",
  ],
  [
    `${C}rating-group/rating-group.css`,
    '.dr-rating-group[data-disabled="true"]',
    "",
    "fade",
  ],
  [
    `${C}rating-group/rating-group.css`,
    '.dr-rating-group-item[data-disabled="true"]',
    "",
    "cursor",
  ],
  [
    `${C}resizable/resizable.css`,
    ".dr-resizable-handle[data-disabled]",
    "",
    "fade",
  ],
  [
    `${C}segment-group/segment-group.css`,
    '.dr-segment-group[data-disabled="true"]',
    "",
    "fade",
  ],
  [
    `${C}segment-group/segment-group.css`,
    ".dr-segment-group .dr-segment-group-item:disabled",
    "",
    "fade",
  ],
  [
    `${C}segment-group/segment-group.css`,
    ".dr-segment-group .dr-segment-group-item[data-disabled]",
    "",
    "fade",
  ],
  [`${C}select/select.css`, ".dr-select-item", "data-[disabled]", "fade"],
  [`${C}slider/slider.css`, ".dr-slider", "data-[disabled]", "fade"],
  [`${C}slider/slider.css`, ".dr-slider-thumb", "data-[disabled]", "cursor"],
  [`${C}switch/switch.css`, ".dr-switch", "disabled", "fade"],
  [`${C}tabs/tabs.css`, ".dr-tabs-trigger", "disabled", "fade"],
  [
    `${C}tags-input/tags-input.css`,
    '.dr-tags-input[data-disabled="true"]',
    "",
    "fade",
  ],
  [
    `${C}tags-input/tags-input.css`,
    '.dr-tags-input-item[data-disabled="true"] > .dr-tags-input-item-preview',
    "",
    "fade",
  ],
  [
    `${C}tags-input/tags-input.css`,
    '.dr-tags-input-item-delete-trigger[data-disabled="true"], .dr-tags-input-clear-trigger[data-disabled="true"]',
    "",
    "fade",
  ],
  [`${C}tags-input/tags-input.css`, ".dr-tags-input-input", "disabled", "fade"],
  [`${C}textarea/textarea.css`, ".dr-textarea", "disabled", "fade"],
  [
    `${C}timer/timer.css`,
    '.dr-timer-action-trigger:disabled, .dr-timer-action-trigger[data-state="disabled"]',
    "",
    "fade",
  ],
  [`${C}toggle/toggle.css`, ".dr-toggle", "disabled", "fade"],
  [
    `${C}tree-view/tree-view.css`,
    '.dr-tree-view-branch-control[data-disabled="true"], .dr-tree-view-item[data-disabled="true"]',
    "",
    "fade",
  ],
  [
    `${C}tree-view/tree-view.css`,
    '.dr-tree-view[data-disabled="true"] .dr-tree-view-branch-control, .dr-tree-view[data-disabled="true"] .dr-tree-view-item',
    "",
    "fade",
  ],
  [
    `${C}virtualized-dropdown-menu/virtualized-dropdown-menu.css`,
    ".dr-vdm-item",
    "data-[disabled]",
    "fade",
  ],
]

/**
 * Rules that stop a faded root's descendants fading a second time: each
 * sets the token to 1 on the root's children, so every disabled rule
 * beneath reads 1 and the control fades once, at its root. A child
 * disabled on its own, under an enabled root, still reads the real token.
 * [file, selector]
 */
const INHERITED_FADE_RESETS: Array<[string, string]> = [
  [
    `${C}input/input.css`,
    ".dr-input-group:has(> .dr-input-grouped:disabled) > *",
  ],
  [`${C}number-input/number-input.css`, ".dr-number-input[data-disabled] > *"],
  [
    `${C}color-picker/color-picker.css`,
    '.dr-color-picker[data-disabled="true"] > *',
  ],
  [`${C}combobox/combobox.css`, '.dr-combobox[data-disabled="true"] > *'],
  [
    `${C}date-picker/date-picker.css`,
    '.dr-date-picker[data-disabled="true"] > *',
  ],
  [
    `${C}field/field.css`,
    '.dr-field[data-disabled="true"] .dr-field-label > *',
  ],
  [
    `${C}fieldset/fieldset.css`,
    ".dr-fieldset:disabled > *, .dr-fieldset[disabled] > *",
  ],
  [
    `${C}file-upload/file-upload.css`,
    '.dr-file-upload[data-disabled="true"] > *',
  ],
  [`${C}input-otp/input-otp.css`, ".dr-input-otp-container:has(:disabled) > *"],
  [`${C}listbox/listbox.css`, ".dr-listbox[data-disabled] > *"],
  [
    `${C}segment-group/segment-group.css`,
    '.dr-segment-group[data-disabled="true"] > *',
  ],
  [`${C}tags-input/tags-input.css`, '.dr-tags-input[data-disabled="true"] > *'],
  [
    `${C}tags-input/tags-input.css`,
    '.dr-tags-input-item[data-disabled="true"] > .dr-tags-input-item-preview > *',
  ],
]

function filesUnder(dir: string, pattern: RegExp): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return filesUnder(path, pattern)
    const skip = /\.(test|stories)\.tsx?$/.test(entry.name)
    return pattern.test(entry.name) && !skip ? [path] : []
  })
}

/** Comments blanked out, keeping every newline so line numbers still match. */
function withoutComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "))
}

interface Rule {
  where: string
  selector: string
  body: string
}

function rulesOf(path: string): Rule[] {
  const css = withoutComments(readFileSync(path, "utf8"))
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => {
    // The match starts right after the previous brace.
    const start = (match.index as number) + (match[1] as string).search(/\S/)
    return {
      where: `${path}:${css.slice(0, start).split("\n").length}`,
      selector: (match[1] as string).trim().replace(/\s+/g, " "),
      body: match[2] as string,
    }
  })
}

function isDisabledSelector(selector: string): boolean {
  return /disabled/.test(selector.replace(/:not\((?:[^()]|\([^()]*\))*\)/g, ""))
}

/** Prettier wraps long selectors inside :not( … ); undo that before comparing. */
function normalise(selector: string): string {
  return selector
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
}

/**
 * What a rule sets for each disabled state it names, keyed by the variant
 * chain ("" for the rule's own selector). A declaration counts as the
 * utility that writes it; a field trigger's `@apply field-trigger` counts
 * as the utility's body.
 */
function disabledStates(rule: Rule): Map<string, string[]> {
  const states = new Map<string, string[]>()
  const add = (chain: string, utility: string) =>
    states.set(chain, [...(states.get(chain) ?? []), utility])
  const selectorDisabled = isDisabledSelector(rule.selector)
  const body = resolveFieldTrigger(rule.body.replace(/\s+/g, " ").trim())
  for (const apply of body.matchAll(/@apply([^;]*);/g)) {
    for (const token of (apply[1] as string).trim().split(/\s+/)) {
      const { variants, utility } = splitToken(token)
      if (variants.some((v) => /disabled/.test(v))) {
        add(variants.join(":"), utility)
      } else if (selectorDisabled && variants.length === 0) {
        add("", utility)
      }
    }
  }
  if (selectorDisabled) {
    for (const decl of body.matchAll(
      /(?<![\w-])(opacity|cursor|pointer-events)\s*:\s*([^;]+);/g,
    )) {
      const text = `${decl[1]}: ${(decl[2] as string).trim()}`
      add("", DECLARED_AS[text] ?? text)
    }
  }
  return states
}

const RULES = filesUnder("src", /\.css$/).flatMap(rulesOf)

function disabledOpacities(): Array<{ where: string; text: string }> {
  const found: Array<{ where: string; text: string }> = []
  for (const rule of RULES) {
    const selectorDisabled = isDisabledSelector(rule.selector)
    if (selectorDisabled) {
      for (const decl of rule.body.matchAll(
        /(?<![\w-])opacity\s*:\s*([^;]+);/g,
      )) {
        found.push({ where: rule.where, text: decl[0] })
      }
    }
    for (const apply of rule.body.matchAll(/@apply([^;]*);/g)) {
      for (const token of (apply[1] as string).trim().split(/\s+/)) {
        const { variants, utility } = splitToken(token)
        if (!utility.startsWith("opacity-")) continue
        if (selectorDisabled || variants.some((v) => /disabled/.test(v))) {
          found.push({ where: rule.where, text: token })
        }
      }
    }
  }
  return found
}

function ruleBody(path: string, selector: string): string {
  const rule = rulesOf(path).find((r) => r.selector === selector)
  expect(rule, `no rule ${selector} in ${path}`).toBeDefined()
  return rule?.body ?? ""
}

describe("disabled opacity", () => {
  const theme = readFileSync("src/styles/theme.css", "utf8")

  it("declares the disabled and loading opacities", () => {
    expect(theme).toMatch(/--disabled-opacity:\s*0\.5;/)
    expect(theme).toMatch(/--loading-opacity:\s*0\.7;/)
  })

  it("reports the line a rule's selector starts on", () => {
    const path = "src/components/button/button.css"
    const rule = rulesOf(path).find(
      (r) => r.selector === ".dr-btn[data-loading]",
    )
    const line =
      readFileSync(path, "utf8")
        .split("\n")
        .findIndex((text) => text.trim().startsWith(".dr-btn[data-loading]")) +
      1
    expect(line).toBeGreaterThan(0)
    expect(rule?.where).toBe(`${path}:${line}`)
  })

  it("finds the disabled rules it must check", () => {
    expect(disabledOpacities().length).toBeGreaterThan(60)
  })

  it("reads the token in every disabled rule", () => {
    const offenders = disabledOpacities()
      .filter(({ text }) => {
        const declaration = /^opacity\s*:\s*([^;]+);$/.exec(text)
        if (declaration) return declaration[1]?.trim() !== TOKEN_DECLARATION
        return splitToken(text).utility !== TOKEN_UTILITY
      })
      .map(({ where, text }) => `${text} at ${where}`)
    expect(offenders).toEqual([])
  })

  it("keeps a loading button above the disabled opacity", () => {
    // Loading is busy, not unavailable, so it stays less faded than disabled.
    expect(
      ruleBody("src/components/button/button.css", ".dr-btn[data-loading]"),
    ).toMatch(/opacity:\s*var\(--loading-opacity\);/)
  })

  it("dims a pinned panel's drag handle with the disabled token", () => {
    expect(
      ruleBody(
        "src/components/floating-panel/floating-panel.css",
        '.dr-floating-panel[data-pinned="true"] .dr-floating-panel-drag-handle',
      ),
    ).toMatch(/opacity:\s*var\(--disabled-opacity\);/)
  })

  it.each([
    ["src/components/toggle/toggle.css", ".dr-toggle"],
    ["src/components/tabs/tabs.css", ".dr-tabs-trigger"],
    [
      "src/components/navigation-menu/navigation-menu.css",
      ".dr-navigation-menu-trigger",
    ],
    [
      "src/components/number-input/number-input.css",
      ".dr-number-input-stepper",
    ],
    [
      "src/components/password-input/password-input.css",
      ".dr-password-input-trigger",
    ],
  ])("%s keeps pointer events on a disabled %s", (path, selector) => {
    // A native disabled button ignores clicks by itself; pointer-events: none
    // only cost it the not-allowed cursor and any tooltip explaining why.
    const body = ruleBody(path, selector)
    expect(body).not.toMatch(/(?<![\w-])disabled:pointer-events-none/)
    expect(body).toMatch(/(?<![\w-])disabled:cursor-not-allowed(?![\w-])/)
  })

  it("pairs every disabled fade with the not-allowed cursor", () => {
    const offenders = RULES.flatMap((rule) =>
      [...disabledStates(rule)]
        .filter(
          ([, set]) =>
            set.includes(TOKEN_UTILITY) && !set.includes(NOT_ALLOWED),
        )
        .map(([chain]) => `${chain || rule.selector} at ${rule.where}`),
    )
    expect(offenders).toEqual([])
  })

  it("never blocks pointer events or resets the cursor on a disabled control", () => {
    // Each component ignores activation itself; pointer-events: none only
    // hid the not-allowed cursor and any tooltip explaining why.
    const offenders = RULES.flatMap((rule) =>
      [...disabledStates(rule)].flatMap(([chain, set]) =>
        set
          .filter((utility) => BLOCKERS.includes(utility))
          .map((u) => `${chain ? `${chain}:` : ""}${u} at ${rule.where}`),
      ),
    )
    expect(offenders).toEqual([])
  })

  it.each(REQUIRED)(
    "%s %s keeps its disabled %s rule (%s)",
    (path, selector, chain, kind) => {
      const set = RULES.filter(
        (rule) =>
          rule.where.startsWith(`${path}:`) &&
          normalise(rule.selector) === normalise(selector),
      ).flatMap((rule) => disabledStates(rule).get(chain) ?? [])
      expect(set, `no disabled rule for ${selector} in ${path}`).toContain(
        NOT_ALLOWED,
      )
      if (kind === "fade") expect(set).toContain(TOKEN_UTILITY)
      else expect(set).not.toContain(TOKEN_UTILITY)
    },
  )

  it("resets the token only in the named inherited-fade rules", () => {
    const resets = RULES.filter(
      (rule) =>
        !rule.where.startsWith("src/styles/theme.css:") &&
        /(?<![\w-])--disabled-opacity\s*:/.test(rule.body),
    )
    expect(
      resets
        .map((r) => `${r.where.replace(/:\d+$/, "")} ${normalise(r.selector)}`)
        .sort(),
    ).toEqual(
      INHERITED_FADE_RESETS.map(([p, sel]) => `${p} ${normalise(sel)}`).sort(),
    )
    for (const rule of resets) {
      expect(rule.body.trim(), rule.where).toBe("--disabled-opacity: 1;")
    }
  })

  it("gives the field-trigger utility the disabled recipe", () => {
    const body = resolveFieldTrigger("@apply field-trigger;")
    expect(body).toMatch(/:disabled\s*\{[^}]*cursor:\s*not-allowed/)
    expect(body).toMatch(
      /:disabled\s*\{[^}]*opacity:\s*var\(--disabled-opacity\)/,
    )
    expect(body).not.toMatch(
      /pointer-events-none|pointer-events:\s*none|cursor-default/,
    )
  })

  it("keeps the navigation-menu trigger's hover off a disabled trigger", () => {
    const path = "src/components/navigation-menu/navigation-menu.css"
    expect(ruleBody(path, ".dr-navigation-menu-trigger")).not.toMatch(
      /(?<![\w-])(?:[\w-]+-\[[^\]]*\]:|[\w-]+:)*hover:/,
    )
    const hovers = rulesOf(path).filter(
      (r) =>
        r.selector.includes(".dr-navigation-menu-trigger") &&
        r.selector.includes(":hover"),
    )
    expect(hovers.length).toBeGreaterThan(0)
    for (const rule of hovers) {
      expect(rule.selector, rule.where).toContain(":not(:disabled)")
    }
  })

  it("sets no disabled opacity from TSX class strings", () => {
    const offenders: string[] = []
    for (const path of filesUnder("src", /\.tsx?$/)) {
      const source = readFileSync(path, "utf8")
      for (const literal of source.matchAll(/"[^"\n]*"|'[^'\n]*'|`[^`]*`/g)) {
        for (const token of literal[0].slice(1, -1).split(/\s+/)) {
          const { variants, utility } = splitToken(token)
          if (!utility.startsWith("opacity-")) continue
          if (variants.some((v) => /disabled/.test(v))) {
            offenders.push(`${token} in ${path}`)
          }
        }
      }
      for (const match of source.matchAll(
        /\w*[dD]isabled\w*\s*&&\s*["'`][^"'`]*(?<![\w-])opacity-/g,
      )) {
        offenders.push(`${match[0]} in ${path}`)
      }
    }
    expect(offenders).toEqual([])
  })
})
