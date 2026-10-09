import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { cssRules } from "../test/css-rules"
import { stripCssComments } from "../test/strip-css-comments"

// These controls share the `.dr-btn` state layer (button.css), and every
// hover or press rule on them is guarded so a disabled control stays inert
// under the pointer. The guard is what does that: a native disabled button
// keeps its pointer events — for the not-allowed cursor, and for a tooltip
// that says why — so nothing else stops hover from painting on it.

/** [control class, the guard its hover and press rules carry] */
const CONTROLS: Array<[string, string]> = [
  ["dr-toggle", ":not(:disabled)"],
  ["dr-tabs-trigger", ":not(:disabled)"],
  ["dr-segment-group-item", ":not(:disabled)"],
  ["dr-number-input-stepper", ":not(:disabled)"],
  ["dr-overlay-close-btn", ":not(:disabled)"],
  // An <a>, which never matches :disabled; its wash comes from `.dr-btn`.
  ["dr-pagination-link", ":not([data-disabled])"],
  // Icon triggers: icon-only native buttons whose hover was colour-only.
  ["dr-password-input-trigger", ":not(:disabled)"],
  ["dr-date-picker-trigger", ":not(:disabled)"],
  ["dr-combobox-clear-trigger", ":not(:disabled)"],
  ["dr-combobox-trigger", ":not(:disabled)"],
  // Multi-select's clear and toggle also carry the two combobox classes
  // above, and take the layer from them.
  ["dr-multi-select-clear", ":not(:disabled)"],
  ["dr-multi-select-toggle", ":not(:disabled)"],
  ["dr-multi-select-chip-remove", ":not(:disabled)"],
  ["dr-tags-input-item-delete-trigger", ":not(:disabled)"],
  ["dr-tags-input-clear-trigger", ":not(:disabled)"],
  ["dr-file-upload-item-delete-trigger", ":not(:disabled)"],
  ["dr-editable-edit-trigger", ":not(:disabled)"],
  ["dr-editable-submit-trigger", ":not(:disabled)"],
  ["dr-editable-cancel-trigger", ":not(:disabled)"],
  ["dr-banner-close", ":not(:disabled)"],
  ["dr-color-picker-trigger", ":not(:disabled)"],
  ["dr-color-picker-eye-dropper-trigger", ":not(:disabled)"],
  ["dr-floating-panel-trigger", ":not(:disabled)"],
  // Rows and fields: a disabled one keeps its pointer events, so its hover
  // needs the guard too.
  ["dr-cascade-item", ':not([aria-disabled="true"])'],
  ["dr-file-upload-dropzone", ":not([data-disabled])"],
  ["dr-file-upload-clear-trigger", ":not(:disabled)"],
  ["dr-menubar-item", ":not([data-disabled])"],
  ["dr-menubar-checkbox-item", ":not([data-disabled])"],
  ["dr-menubar-radio-item", ":not([data-disabled])"],
  ["dr-tree-view-branch-control", ":not([data-disabled])"],
  ["dr-tree-view-item", ":not([data-disabled])"],
  ["dr-timer-action-trigger", ":not(:disabled)"],
]

function stylesheets(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return stylesheets(path)
    return entry.name.endsWith(".css") ? [path] : []
  })
}

interface Rule {
  path: string
  selectors: string[]
  body: string
}

/** Prettier wraps long selectors inside :not( … ); undo that before matching. */
function normalise(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
}

const RULES: Rule[] = [
  ...["src/components", "src/layout", "src/theme"].flatMap(stylesheets),
  "src/styles/theme.css",
].flatMap((path) => {
  const css = stripCssComments(readFileSync(path, "utf8"))
  return cssRules(css).map((rule) => ({
    path,
    selectors: rule.selector
      .split(/,(?![^(]*\))/)
      .map(normalise)
      .filter(Boolean),
    body: rule.body,
  }))
})

/** The last compound selector: the element the rule styles. */
function subject(selector: string): string {
  let depth = 0
  let start = 0
  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i] as string
    if (ch === "(" || ch === "[") depth++
    else if (ch === ")" || ch === "]") depth--
    else if (depth === 0 && /[\s>+~]/.test(ch)) start = i + 1
  }
  return selector.slice(start)
}

function styles(selector: string, cls: string): boolean {
  return new RegExp(`\\.${cls}(?![\\w-])`).test(subject(selector))
}

describe("hover and press on controls with the shared state layer", () => {
  it.each(CONTROLS)("%s is still styled", (cls) => {
    expect(
      RULES.some((rule) => rule.selectors.some((s) => styles(s, cls))),
    ).toBe(true)
  })

  it.each(CONTROLS)(
    "%s guards every :hover and :active rule with %s",
    (cls, guard) => {
      const offenders = RULES.flatMap((rule) =>
        rule.selectors
          .filter(
            (s) =>
              styles(s, cls) &&
              /:(?:hover|active)(?![\w-])/.test(subject(s)) &&
              !subject(s).includes(guard),
          )
          .map((s) => `${s} (${rule.path})`),
      )
      expect(offenders).toEqual([])
    },
  )

  it.each(CONTROLS)("%s carries no hover or press utility in @apply", (cls) => {
    const offenders = RULES.filter(
      (rule) =>
        rule.selectors.some((s) => styles(s, cls)) &&
        /@apply[^;]*(?<![\w-])(?:hover|active):/.test(rule.body),
    ).map((rule) => `${rule.selectors.join(", ")} (${rule.path})`)
    expect(offenders).toEqual([])
  })

  it("paints no hover fill on a pagination link: the state layer washes it", () => {
    const offenders = RULES.filter(
      (rule) =>
        rule.selectors.some(
          (s) =>
            styles(s, "dr-pagination-link") &&
            /:hover(?![\w-])/.test(subject(s)),
        ) && /background/.test(rule.body),
    ).map((rule) => `${rule.selectors.join(", ")} (${rule.path})`)
    expect(offenders).toEqual([])
  })

  it("keeps underline-on-hover to links: the accordion trigger has none", () => {
    const offenders = RULES.filter(
      (rule) =>
        rule.selectors.some((s) => styles(s, "dr-accordion-trigger")) &&
        (/(?<![\w-])hover:underline(?![\w-])/.test(rule.body) ||
          (rule.selectors.some((s) => s.includes(":hover")) &&
            /text-decoration|(?<![\w-])underline(?![\w-])/.test(rule.body))),
    ).map((rule) => `${rule.selectors.join(", ")} (${rule.path})`)
    expect(offenders).toEqual([])
  })
})
