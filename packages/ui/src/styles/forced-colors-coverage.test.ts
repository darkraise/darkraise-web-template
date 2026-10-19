import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import {
  RULES,
  interactiveClasses,
  parseRules,
  splitToken,
  type Rule,
} from "./interactive-classes"
import { stripCssComments } from "../test/strip-css-comments"

// Forced colours drop backgrounds and box-shadows, so a control drawn by its
// fill vanishes unless theme.css restates its boundary; and without
// `touch-action: manipulation` a tap waits on the double-tap-zoom gesture.
// Both lists in theme.css are kept by hand, so this ties them to the classes
// the focus scan already treats as interactive.

const THEME = stripCssComments(readFileSync("src/styles/theme.css", "utf8"))

/** Interactive classes with no boundary to restate, each with the reason. */
const FORCED_COLORS_EXEMPT = new Map<string, string>([
  ["dr-label", "a label forwards to its control, which draws the boundary"],
  ["dr-accordion-trigger", "a text-only trigger; its label is its whole shape"],
  ["dr-banner-close", "an icon-only trigger with no fill or border of its own"],
  ["dr-calendar-caption-label", "caption text inside its own caption button"],
  [
    "dr-calendar-caption-label-btn",
    "a text-only caption button with no fill or border",
  ],
  ["dr-cascade-item", "a menu row; the popover's border bounds the list"],
  [
    "dr-color-picker-swatch-item",
    "a data colour left unforced; its own edge and active outline show",
  ],
  [
    "dr-combobox-clear-trigger",
    "an icon-only trigger inside the bordered field",
  ],
  ["dr-combobox-item", "a menu row; the popover's border bounds the list"],
  ["dr-combobox-trigger", "an icon-only trigger inside the bordered field"],
  [
    "dr-command-item",
    "a menu row; the command palette's surface bounds the list",
  ],
  [
    "dr-contribution-graph-cell",
    "a data colour left unforced; its own hover outline shows",
  ],
  ["dr-date-picker-trigger", "an icon-only trigger inside the bordered field"],
  [
    "dr-editable-cancel-trigger",
    "an icon-only trigger with no fill or border of its own",
  ],
  [
    "dr-editable-edit-trigger",
    "an icon-only trigger with no fill or border of its own",
  ],
  [
    "dr-editable-preview",
    "reads as text until activated; the field it opens is bordered",
  ],
  [
    "dr-editable-submit-trigger",
    "an icon-only trigger with no fill or border of its own",
  ],
  [
    "dr-file-upload-clear-trigger",
    "an underlined text trigger, drawn like a link",
  ],
  [
    "dr-file-upload-item-delete-trigger",
    "an icon-only trigger with no fill or border of its own",
  ],
  [
    "dr-floating-panel-drag-handle",
    "an icon-only grip inside the panel header",
  ],
  [
    "dr-image-editor-perspective-handle",
    "an SVG circle with no box; forced colours repaint its fill and stroke",
  ],
  ["dr-json-chevron", "an icon-only disclosure inside a tree row"],
  [
    "dr-json-row",
    "a tree row; rows are marked by their focus outline, not a box",
  ],
  [
    "dr-json-show-more",
    "a text-only trigger with no fill or border of its own",
  ],
  [
    "dr-json-tree-body",
    "a focusable container, not a control; its rows are the items",
  ],
  ["dr-json-url", "a link, which forced colours already mark as LinkText"],
  ["dr-listbox-item", "a list row; the listbox's own boundary bounds the list"],
  [
    "dr-menu-checkbox-item",
    "a menu row; the menu content's border bounds the list",
  ],
  ["dr-menu-item", "a menu row; the menu content's border bounds the list"],
  [
    "dr-menu-radio-item",
    "a menu row; the menu content's border bounds the list",
  ],
  [
    "dr-menu-sub-trigger",
    "a menu row; the menu content's border bounds the list",
  ],
  [
    "dr-menubar-checkbox-item",
    "a menu row; the menu content's border bounds the list",
  ],
  ["dr-menubar-item", "a menu row; the menu content's border bounds the list"],
  [
    "dr-menubar-radio-item",
    "a menu row; the menu content's border bounds the list",
  ],
  [
    "dr-menubar-sub-trigger",
    "a menu row; the menu content's border bounds the list",
  ],
  ["dr-menubar-trigger", "a text-only trigger in the menubar strip"],
  ["dr-multi-select-chip-remove", "an icon-only trigger inside a chip"],
  ["dr-multi-select-clear", "an icon-only trigger inside the bordered field"],
  ["dr-multi-select-toggle", "an icon-only trigger inside the bordered field"],
  ["dr-navigation-menu-trigger", "a text-only trigger in the navigation strip"],
  [
    "dr-number-input-stepper",
    "an icon-only trigger inside the bordered number input",
  ],
  [
    "dr-overlay-close-btn",
    "an icon-only trigger with no fill or border at rest",
  ],
  [
    "dr-page-header-tab",
    "a text tab whose selected state is its underline border",
  ],
  [
    "dr-password-input-trigger",
    "an icon-only trigger inside the bordered field",
  ],
  [
    "dr-rating-group-item",
    "a star glyph; the glyph itself is the control's shape",
  ],
  ["dr-select-item", "a menu row; the select content's border bounds the list"],
  [
    "dr-sidebar-nav-chevron-button",
    "an icon-only trigger inside a sidebar row",
  ],
  [
    "dr-sidebar-nav-collapsible-link",
    "a sidebar navigation row, drawn like a link",
  ],
  ["dr-sidebar-nav-item", "a sidebar navigation row, drawn like a link"],
  ["dr-sidebar-nav-link", "a sidebar navigation row, drawn like a link"],
  [
    "dr-sidebar-nav-popover-parent",
    "a sidebar navigation row, drawn like a link",
  ],
  [
    "dr-sidebar-nav-popover-trigger",
    "a sidebar navigation row, drawn like a link",
  ],
  ["dr-sidebar-popover-child", "a navigation row inside the sidebar popover"],
  ["dr-stacked-layout-rail-item", "a navigation rail row, drawn like a link"],
  ["dr-steps-trigger", "a text-only trigger with a transparent background"],
  [
    "dr-tabs-trigger",
    "framed by its own border in the state block, which can open the enclosed seam",
  ],
  ["dr-tabs-content", "a focusable tab panel, not a control"],
  [
    "dr-tags-input-clear-trigger",
    "a text trigger inside the field's bounded block",
  ],
  ["dr-tags-input-item-delete-trigger", "an icon-only trigger inside a chip"],
  ["dr-time-column-item", "a list row inside the time picker column"],
  ["dr-toast-close", "an icon-only trigger with no fill or border of its own"],
  ["dr-top-nav-layout-nav-item", "a top navigation row, drawn like a link"],
  [
    "dr-tree-view-branch-control",
    "a tree row; rows are marked by their focus outline",
  ],
  ["dr-tree-view-item", "a tree row; rows are marked by their focus outline"],
  ["dr-vdm-item", "a menu row; the menu content's border bounds the list"],
  [
    "dr-virtualized-timeline-list-item",
    "a full-width row; a selected row takes the Highlight fill",
  ],
  [
    "dr-virtualized-timeline-scrubber",
    "a tick rail with no fill or border; the ticks are its shape",
  ],
  [
    "dr-virtualized-timeline-tile",
    "a cell whose rendered item is its shape; a selected tile draws a Highlight border",
  ],
])

/**
 * Drag surfaces keep the touch-action they set for themselves, or that their
 * drag ancestor sets (touch-action intersects down the tree), as
 * [file, owner, text the owner sets, reason]. In CSS the owner is the
 * selector of the rule that sets it; in TSX it is the class literal of the
 * element whose props set it, read up to the next `className=`.
 */
const DRAG_SURFACES = new Map<string, [string, string, string, string]>([
  [
    "dr-angle-slider",
    [
      "src/components/angle-slider/angle-slider.css",
      ".dr-angle-slider",
      "touch-action: none",
      "a rotary drag must not pan the page",
    ],
  ],
  [
    "dr-color-picker-sv",
    [
      "src/components/color-picker/ColorPicker.tsx",
      "dr-color-picker-sv",
      'touchAction: "none"',
      "a two-axis drag area must not pan the page",
    ],
  ],
  [
    "dr-color-picker-hue",
    [
      "src/components/color-picker/ColorPicker.tsx",
      "dr-color-picker-hue",
      'touchAction: "none"',
      "a hue drag strip must not pan the page",
    ],
  ],
  [
    "dr-floating-panel-drag-handle",
    [
      "src/components/floating-panel/floating-panel.css",
      ".dr-floating-panel-header",
      "touch-action: none",
      "sits in the panel header, which sets touch-action: none for the move drag",
    ],
  ],
  [
    "dr-image-cropper-handle",
    [
      "src/components/image-cropper/image-cropper.css",
      ".dr-image-cropper-viewport",
      "touch-action: none",
      "sits in the cropper viewport, which sets touch-action: none for the resize drag",
    ],
  ],
  [
    "dr-image-cropper-selection",
    [
      "src/components/image-cropper/image-cropper.css",
      ".dr-image-cropper-viewport",
      "touch-action: none",
      "sits in the cropper viewport, which sets touch-action: none for the drag",
    ],
  ],
  [
    "dr-image-editor-perspective-handle",
    [
      "src/components/image-editor/image-editor.css",
      ".dr-image-editor-perspective-handle",
      "touch-action: none",
      "a corner drag must not pan the page",
    ],
  ],
  [
    "dr-slider-thumb",
    [
      "src/components/slider/Slider.tsx",
      "dr-slider",
      'touchAction: horizontal ? "pan-y" : "pan-x"',
      "the slider root allows only the cross-axis pan so the thumb can be dragged",
    ],
  ],
  [
    "dr-virtualized-timeline-scrubber",
    [
      "src/components/virtualized-timeline/virtualized-timeline.css",
      ".dr-virtualized-timeline-scrubber",
      "touch-action: none",
      "a vertical scrub drag must not pan the page",
    ],
  ],
])

/** Whether `owner` sets `proof` in `file`; see DRAG_SURFACES. */
function ownerSets(file: string, owner: string, proof: string): boolean {
  const source = readFileSync(file, "utf8")
  if (file.endsWith(".css")) {
    return parseRules(source, file).some(
      (rule) => rule.selectors.includes(owner) && rule.body.includes(proof),
    )
  }
  const start = source.indexOf(`"${owner}"`)
  if (start === -1) return false
  const next = source.indexOf("className=", start + owner.length + 2)
  return source.slice(start, next === -1 ? undefined : next).includes(proof)
}

/** Interactive classes that must not take touch-action: manipulation. */
const TOUCH_EXEMPT = new Map<string, string>([
  [
    "dr-label",
    "a label forwards the tap to its control, which carries the rule",
  ],
  [
    "dr-tabs-content",
    "a content panel; manipulation would drop double-tap zoom for everything in it",
  ],
  [
    "dr-json-tree-body",
    "a content container; manipulation would drop double-tap zoom for every row",
  ],
  [
    "dr-listbox",
    "a list container; its items carry the rule, and the whole list would lose double-tap zoom",
  ],
])

/** The contents of the block opened by `opener`, braces balanced. */
function blockAfter(css: string, opener: RegExp): string {
  const match = opener.exec(css)
  if (!match) return ""
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

function classesOf(rules: Array<{ selectors: string[] }>): Set<string> {
  return new Set(
    rules.flatMap((rule) => rule.selectors).map((s) => s.replace(/^\./, "")),
  )
}

const FORCED = parseRules(
  blockAfter(THEME, /@media \(forced-colors: active\) \{/),
).map((rule) => ({
  selectors: rule.selectors,
  body: rule.body.replace(/\s+/g, " ").trim(),
}))
const BORDERED = classesOf(
  FORCED.filter((rule) => rule.body === "border: 1px solid ButtonBorder;"),
)
const OUTLINED = classesOf(
  FORCED.filter(
    (rule) =>
      rule.body === "outline: 1px solid ButtonBorder; outline-offset: -1px;",
  ),
)
const MANIPULATION = new Set(
  (
    /((?:\.dr-[\w-]+\s*,\s*)*\.dr-[\w-]+)\s*\{\s*touch-action:\s*manipulation;\s*\}/.exec(
      THEME,
    )?.[1] ?? ""
  )
    .split(",")
    .map((s) => s.trim().replace(/^\./, ""))
    .filter(Boolean),
)

describe("forced colours and touch action cover every interactive class", () => {
  const interactive = interactiveClasses()

  it("finds the classes it must check", () => {
    expect(interactive.size).toBeGreaterThan(40)
    expect(OUTLINED.size).toBeGreaterThan(0)
    expect(MANIPULATION.size).toBeGreaterThan(0)
  })

  it("restates a boundary for every interactive class that draws one", () => {
    const missing = [...interactive]
      .filter(
        ([cls]) =>
          !BORDERED.has(cls) &&
          !OUTLINED.has(cls) &&
          !FORCED_COLORS_EXEMPT.has(cls),
      )
      .map(([cls, path]) => `${cls} (${path})`)
      .sort()
    expect(missing).toEqual([])
  })

  it("keeps :focus-visible last and every boundary on a single class", () => {
    // `:focus-visible` has the specificity of one class and wins only on
    // source order; a two-class boundary selector would beat it.
    const last = FORCED[FORCED.length - 1]
    expect(last?.selectors).toEqual([":focus-visible"])
    const compound = FORCED.slice(0, -1)
      .flatMap((rule) => rule.selectors)
      .filter((selector) => !/^\.dr-[\w-]+$/.test(selector))
    expect(compound).toEqual([])
  })

  // An unlayered offset here would override every control's own layered
  // one, pushing inset rings out where a clipping wrapper cuts them off.
  it("draws the forced-colours focus ring at each control's own offset", () => {
    expect(FORCED[FORCED.length - 1]?.body).toBe(
      "outline: 2px solid Highlight;",
    )
    expect(OUTLINED.size).toBeGreaterThan(0)
  })

  it("gives every interactive class touch-action: manipulation", () => {
    const missing = [...interactive]
      .filter(
        ([cls]) =>
          !MANIPULATION.has(cls) &&
          !DRAG_SURFACES.has(cls) &&
          !TOUCH_EXEMPT.has(cls),
      )
      .map(([cls, path]) => `${cls} (${path})`)
      .sort()
    expect(missing).toEqual([])
  })

  it("leaves drag surfaces to the touch-action their owner sets", () => {
    for (const [cls, [file, owner, proof]] of DRAG_SURFACES) {
      expect(
        ownerSets(file, owner, proof),
        `${owner} in ${file} no longer sets ${proof}`,
      ).toBe(true)
      expect(MANIPULATION.has(cls), `${cls} must not take manipulation`).toBe(
        false,
      )
    }
  })

  it("keeps every exemption justified and still needed", () => {
    for (const [cls, reason] of FORCED_COLORS_EXEMPT) {
      expect(interactive.has(cls), `${cls} is no longer interactive`).toBe(true)
      expect(
        BORDERED.has(cls) || OUTLINED.has(cls),
        `${cls} now has a boundary`,
      ).toBe(false)
      expect(reason.length, `${cls} needs a reason`).toBeGreaterThan(20)
    }
    for (const [cls, reason] of TOUCH_EXEMPT) {
      expect(interactive.has(cls), `${cls} is no longer interactive`).toBe(true)
      expect(MANIPULATION.has(cls), `${cls} now takes manipulation`).toBe(false)
      expect(reason.length, `${cls} needs a reason`).toBeGreaterThan(20)
    }
    for (const [cls, [, , , reason]] of DRAG_SURFACES) {
      expect(interactive.has(cls), `${cls} is no longer interactive`).toBe(true)
      expect(reason.length, `${cls} needs a reason`).toBeGreaterThan(20)
    }
  })
})

/**
 * State attributes whose rules draw a chosen, current or open state, with
 * the values that mean it; an empty list means any value. `data-state="open"`
 * counts only on a trigger, where it marks the open menu; elsewhere it keys
 * an overlay's enter animation.
 */
const STATE_ATTRIBUTES = new Map<string, string[]>([
  ["data-state", ["active", "checked", "on", "selected", "open"]],
  ["data-status", ["complete", "current"]],
  ["data-active", []],
  ["data-current", []],
  ["data-highlighted", []],
  ["data-selected", []],
  ["data-selected-single", []],
  ["aria-selected", ["true"]],
  ["aria-current", []],
  ["aria-pressed", ["true"]],
])

/** Classes that carry a state through their own name. */
const FORCED_STATE_CLASSES = new Set(["dr-sidebar-nav-current"])

/** Rows whose pointer highlight is DOM focus, so `:focus` is a state. */
const MENU_ROW =
  /^dr-(menu|menubar|select)-(item|checkbox-item|radio-item|sub-trigger)$/

/** State-keyed classes that need no forced-colours rule, each with the reason. */
const FORCED_STATE_EXEMPT = new Map<string, string>([
  [
    "dr-accordion-trigger",
    "the open state turns the chevron, a glyph forced colours keep",
  ],
  [
    "dr-calendar-outside",
    "an outside day's text colour; its day button carries the selection",
  ],
  [
    "dr-calendar-today",
    "squares the cell's corners; its day button carries the marks",
  ],
  [
    "dr-checkbox",
    "the checked state is its check glyph, drawn in currentColor",
  ],
  [
    "dr-checkbox-indicator",
    "shows or hides the check glyph, which forced colours keep",
  ],
  [
    "dr-color-picker-swatch-item",
    "a data colour left unforced, so its own active outline shows",
  ],
  [
    "dr-combobox-item",
    "the highlighted row also draws an outline ring, which forced colours keep",
  ],
  [
    "dr-command-item",
    "the highlighted row also draws an outline ring, which forced colours keep",
  ],
  [
    "dr-radio-group-indicator",
    "shows or hides the checked dot, which forced colours keep",
  ],
  [
    "dr-radio-group-item",
    "the checked state is its dot glyph, drawn in currentColor",
  ],
  ["dr-steps-title", "a label colour; the step's indicator carries the state"],
  [
    "dr-swap-indicator",
    "swaps which icon shows; the visible icon is the state",
  ],
  [
    "dr-switch-marks",
    "repeats the state its switch's track and thumb restate; the lit lamp stays a Canvas dot and the glyphs are text",
  ],
  [
    "dr-tabs-indicator",
    "hides the indicator until it has measured; opacity survives forced colours",
  ],
  [
    "dr-theme-settings-advanced-chevron",
    "turns a quarter to show the open state, a glyph forced colours keep",
  ],
  [
    "dr-theme-settings-advanced-trigger",
    "the open state turns the chevron, a glyph forced colours keep",
  ],
  [
    "dr-theme-switcher-swatch",
    "a data colour left unforced, so its own active ring shows",
  ],
  [
    "dr-vdm-item",
    "the highlighted row also draws an outline ring, which forced colours keep",
  ],
])

/** A selector without its :not() groups, which select the other state. */
function withoutNegations(selector: string): string {
  let out = ""
  let i = 0
  while (i < selector.length) {
    if (selector.startsWith(":not(", i)) {
      let depth = 1
      i += 5
      while (depth > 0 && i < selector.length) {
        if (selector[i] === "(") depth++
        else if (selector[i] === ")") depth--
        i++
      }
    } else {
      out += selector[i]
      i++
    }
  }
  return out
}

/** A selector's compounds, split on combinators outside parentheses. */
function compoundsOf(selector: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ""
  for (const ch of selector) {
    if (ch === "(") depth++
    else if (ch === ")") depth--
    if (depth === 0 && /[\s>+~]/.test(ch)) {
      if (current) parts.push(current)
      current = ""
    } else {
      current += ch
    }
  }
  if (current) parts.push(current)
  return parts
}

function dashClasses(text: string): string[] {
  return [...text.matchAll(/\.(dr-[\w-]+)/g)].map((m) => m[1] as string)
}

/** The state an attribute and value mark, or null when they mark none. */
function stateKey(
  attribute: string,
  value: string | undefined,
  classes: string[],
): string | null {
  const values = STATE_ATTRIBUTES.get(attribute)
  if (!values) return null
  if (values.length === 0) return attribute
  if (value === undefined || !values.includes(value)) return null
  if (value === "open" && !classes.some((cls) => cls.endsWith("-trigger"))) {
    return null
  }
  return `${attribute}=${value}`
}

/** The states a selector text keys on, for the classes it styles. */
function stateKeysIn(text: string, classes: string[]): string[] {
  const keys: string[] = []
  for (const match of text.matchAll(
    /\[([\w-]+)(?:=["']?([^"'\]]+)["']?)?\]/g,
  )) {
    const key = stateKey(match[1] as string, match[2], classes)
    if (key) keys.push(key)
  }
  if (/:focus(?![\w-])/.test(text) && classes.some((c) => MENU_ROW.test(c))) {
    keys.push(":focus")
  }
  for (const cls of classes) {
    if (FORCED_STATE_CLASSES.has(cls)) keys.push(cls)
  }
  return keys
}

/** The state a Tailwind variant keys on, for the classes it styles. */
function variantKey(variant: string, classes: string[]): string | null {
  if (variant === "focus") {
    return classes.some((c) => MENU_ROW.test(c)) ? ":focus" : null
  }
  const bracket = /^(?:has-)?(data|aria)-\[([\w-]+)(?:=([\w-]+))?\]$/.exec(
    variant,
  )
  if (bracket) {
    return stateKey(`${bracket[1]}-${bracket[2]}`, bracket[3], classes)
  }
  const aria = /^aria-(selected|pressed|current)$/.exec(variant)
  if (aria) return stateKey(`aria-${aria[1]}`, "true", classes)
  const data = /^data-([\w-]+)$/.exec(variant)
  if (data) return stateKey(`data-${data[1]}`, undefined, classes)
  return null
}

/** Every kit class with a state rule, mapped to its states and a file. */
function stateClasses(): Map<string, { keys: Set<string>; path: string }> {
  const found = new Map<string, { keys: Set<string>; path: string }>()
  const add = (cls: string, key: string, path: string) => {
    const entry = found.get(cls) ?? { keys: new Set<string>(), path }
    entry.keys.add(key)
    found.set(cls, entry)
  }
  for (const rule of RULES) {
    const tokens = [...rule.body.matchAll(/@apply\s+([^;]+);/g)].flatMap((m) =>
      (m[1] as string).trim().split(/\s+/),
    )
    for (const selector of rule.selectors) {
      const compounds = compoundsOf(withoutNegations(selector))
      const subject = dashClasses(compounds[compounds.length - 1] ?? "")
      compounds.forEach((compound, index) => {
        const classes = dashClasses(compound)
        for (const key of stateKeysIn(compound, classes)) {
          // A state named by a class belongs to that class alone; a state on
          // an ancestor also keys the element the rule styles.
          const owners = FORCED_STATE_CLASSES.has(key) ? [key] : classes
          const ancestor = index < compounds.length - 1
          for (const cls of new Set([
            ...owners,
            ...(ancestor ? subject : []),
          ])) {
            add(cls, key, rule.path)
          }
        }
      })
      for (const token of tokens) {
        for (const variant of splitToken(token).variants) {
          const key = variantKey(variant, subject)
          if (key) for (const cls of subject) add(cls, key, rule.path)
        }
      }
    }
  }
  return found
}

/** The second forced-colours block, found after the first one's opener. */
const STATES = parseRules(
  blockAfter(
    THEME.slice(THEME.indexOf("@media (forced-colors: active) {") + 1),
    /@media \(forced-colors: active\) \{/,
  ),
)

/**
 * Whether a selector of the second block styles `cls` in state `key`: `cls`
 * is on the element the selector styles, and the state is on it or on an
 * ancestor.
 */
function restated(cls: string, key: string): boolean {
  return STATES.flatMap((rule) => rule.selectors).some((selector) => {
    const compounds = compoundsOf(withoutNegations(selector))
    const subject = compounds[compounds.length - 1] ?? ""
    if (!dashClasses(subject).includes(cls)) return false
    return compounds.some((compound) =>
      stateKeysIn(compound, dashClasses(compound)).includes(key),
    )
  })
}

describe("forced colours restate every state", () => {
  const states = stateClasses()

  it("finds the states it must check", () => {
    expect(states.size).toBeGreaterThan(30)
    expect(STATES.length).toBeGreaterThan(10)
  })

  it("restates each chosen, current and open state", () => {
    const missing = [...states]
      .filter(([cls]) => !FORCED_STATE_EXEMPT.has(cls))
      .flatMap(([cls, { keys, path }]) =>
        [...keys]
          .filter((key) => !restated(cls, key))
          .map((key) => `${cls} ${key} (${path})`),
      )
      .sort()
    expect(missing).toEqual([])
  })

  it("keeps every state exemption justified and still needed", () => {
    for (const [cls, reason] of FORCED_STATE_EXEMPT) {
      const entry = states.get(cls)
      expect(entry, `${cls} no longer has a state rule`).toBeDefined()
      expect(
        [...(entry?.keys ?? [])].every((key) => restated(cls, key)),
        `${cls} is now restated`,
      ).toBe(false)
      expect(reason.length, `${cls} needs a reason`).toBeGreaterThan(20)
    }
  })

  // The boundary block's single-class :focus-visible ring wins only on
  // source order; any selector here outranks it.
  it("never sets an outline in the state block", () => {
    const outlines = STATES.flatMap((rule) =>
      rule.body
        .split(";")
        .map((declaration) => declaration.split(":")[0]?.trim() ?? "")
        .filter((property) => property.startsWith("outline"))
        .map((property) => `${rule.selectors.join(", ")} { ${property} }`),
    )
    expect(outlines).toEqual([])
  })
})

/**
 * The third forced-colours block: focus rings drawn inside a Highlight fill,
 * which take the fill's text colour instead.
 */
const RINGS = parseRules(
  blockAfter(
    THEME.slice(THEME.lastIndexOf("@media (forced-colors: active) {")),
    /@media \(forced-colors: active\) \{/,
  ),
)

const selectorsOf = (rules: Rule[], body: string) =>
  rules
    .filter((rule) => rule.body.replace(/\s+/g, " ").includes(body))
    .flatMap((rule) => rule.selectors.map((s) => s.replace(/\s+/g, " ")))

describe("forced-colours details", () => {
  it("rings a focused checked segment in the fill's text colour", () => {
    expect(selectorsOf(RINGS, "outline-color: HighlightText;")).toContain(
      '.dr-segment-group-item[data-state="checked"]:focus-visible',
    )
  })

  it("keeps a checked choice card's field in the row colour", () => {
    expect(selectorsOf(STATES, "color: inherit;")).toContain(
      '.dr-field-label:has(> [data-slot="field"]):has([data-state="checked"]) > .dr-field',
    )
  })

  it("paints the OTP caret through its kit class", () => {
    expect(selectorsOf(STATES, "background-color: CanvasText;")).toContain(
      ".dr-input-otp-slot .dr-input-otp-caret",
    )
    expect(THEME).not.toContain("animate-caret-blink")
  })

  // A step dot sits inside the CanvasText track and paints Canvas; a ruled
  // step tick crosses the hairline track and lies mostly on Canvas.
  it("paints ruled slider step ticks in the text colour", () => {
    expect(selectorsOf(STATES, "background-color: Canvas;")).toContain(
      ".dr-slider-step",
    )
    expect(selectorsOf(STATES, "background-color: CanvasText;")).toContain(
      '[data-slider-style="ruled"] .dr-slider-step',
    )
  })
})
