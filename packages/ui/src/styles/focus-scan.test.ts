import { describe, it, expect } from "vitest"
import {
  RULES,
  TSX,
  classGroups,
  interactiveClasses,
  resolved,
  subjectClasses,
} from "./interactive-classes"

/**
 * Interactive classes that draw no focus indicator of their own, each with
 * the reason that is acceptable.
 */
const EXEMPT = new Map<string, string>([
  ["dr-label", "a label is not focusable; clicking it focuses its control"],
  [
    "dr-calendar-caption-label",
    "shares its button with dr-calendar-caption-label-btn, which draws the ring",
  ],
  [
    "dr-json-chevron",
    "the chevron button has tabIndex -1; keyboard toggling happens on the focused row",
  ],
  [
    "dr-sidebar-nav-item",
    "shares its element with dr-sidebar-nav-link, dr-sidebar-nav-popover-trigger or dr-stacked-layout-rail-item, each of which draws the ring",
  ],
  [
    "dr-json-row",
    "draws its focus ring on its own dr-json-line, so the outline does not wrap the expanded children",
  ],
  [
    "dr-sidebar-nav-collapsible-link",
    "shares its element with dr-sidebar-nav-link, which draws the ring",
  ],
  [
    "dr-sidebar-nav-popover-parent",
    "shares its element with dr-sidebar-popover-child, which draws the ring",
  ],
  [
    "dr-file-upload-dropzone",
    "a role=presentation div that takes no focus; its trigger button inside draws the ring",
  ],
])

const FOCUS_STATE =
  /:focus-visible|:focus-within|\[data-highlighted|\[data-focused/
/**
 * Rows whose keyboard-active state is an attribute (aria-activedescendant),
 * mapped to that attribute. Elsewhere `data-active` means "selected", and a
 * selection glow is not focus.
 */
const ACTIVE_ROW_STATE = new Map([
  ["dr-vdm-item", "[data-active"],
  ["dr-command-item", "[data-selected"],
])

/** Declarations and utilities that remove an indicator rather than draw one. */
const REMOVALS =
  /(?:[\w-]+:)*outline-none|(?:[\w-]+:)*ring-0(?![\w-])|outline\s*:\s*(?:none|0)\s*;|box-shadow\s*:\s*none\s*;/g

function drawsIndicator(body: string): boolean {
  const drawn = body.replace(REMOVALS, "")
  return /outline\s*:|box-shadow\s*:|(?<![\w-])ring-(?!0(?![\w-]))|(?<![\w-])outline-(?!none)\w/.test(
    drawn,
  )
}

function hasFocusRule(cls: string): boolean {
  for (const rule of RULES) {
    for (const selector of rule.selectors) {
      if (!subjectClasses(selector).includes(cls)) continue
      if (/(?<![\w-])focus-ring/.test(resolved(rule.body))) return true
      const variantRing = rule.body
        .replace(REMOVALS, "")
        .match(
          /(?:focus-visible|focus-within):(?:ring-(?!0(?![\w-]))|outline-(?!none)\w)/,
        )
      if (variantRing) return true
      const keyboardState =
        FOCUS_STATE.test(selector) ||
        selector.includes(ACTIVE_ROW_STATE.get(cls) ?? "\u0000")
      if (keyboardState && drawsIndicator(rule.body)) return true
    }
  }
  for (const { source } of TSX) {
    for (const group of classGroups(source)) {
      if (
        group.includes(cls) &&
        group.some((c) => c.startsWith("focus-ring"))
      ) {
        return true
      }
    }
  }
  return false
}

describe("every interactive class draws a focus indicator", () => {
  const interactive = interactiveClasses()

  it("finds the classes it must check", () => {
    expect(interactive.size).toBeGreaterThan(40)
  })

  it("has no interactive class without a focus rule or a justified exemption", () => {
    const missing = [...interactive]
      .filter(([cls]) => !EXEMPT.has(cls) && !hasFocusRule(cls))
      .map(([cls, path]) => `${cls} (${path})`)
      .sort()
    expect(missing).toEqual([])
  })

  it("keeps every exemption justified and still needed", () => {
    for (const [cls, reason] of EXEMPT) {
      expect(interactive.has(cls), `${cls} is no longer interactive`).toBe(true)
      expect(hasFocusRule(cls), `${cls} now draws its own ring`).toBe(false)
      expect(reason.length, `${cls} needs a reason`).toBeGreaterThan(20)
    }
  })
})

/**
 * Components whose focus styling sits next to box-shadow or ring chrome, each
 * with the reason. Everywhere else focus is an outline: forced colours drop
 * box-shadow, and a preset rule can restyle a shadow away (the glass slider
 * thumb lost its ring exactly that way).
 */
const OUTLINE_EXEMPT = new Map<string, string>([
  [
    "dr-image-cropper-selection",
    "the crop box draws its frame with a ring at rest; that is selection chrome, and focus-ring draws focus on top of it",
  ],
  [
    "dr-resizable-handle",
    "resize handles keep their own treatment, drawn on a hit area wider than the visible line",
  ],
  [
    "dr-split-panel-layout-handle",
    "a 4px-wide separator whose focus ring is drawn with ring-2 above both panes, as a resize handle",
  ],
  [
    "dr-contribution-graph-cell",
    "a chart cell whose hover outline and level colours are chart chrome; keyboard focus is focus-ring-inset on the cell",
  ],
])

/**
 * The 1px edge the field utilities draw (theme.css): --primary, or
 * --destructive-edge on an invalid field.
 */
const FIELD_INDICATOR =
  /border-color:\s*hsl\(var\(--(primary|destructive-edge)\)\);[\s\S]*?box-shadow:\s*0 0 0 1px hsl\(var\(--\1\)\)/

const SHADOW_OR_RING =
  /box-shadow\s*:|(?<![\w-])(?:ring|shadow)-(?!0(?![\w-])|none(?![\w-]))/

const FOCUS_VARIANT_SHADOW_OR_RING =
  /(?<![\w-])(?:focus|focus-visible|focus-within):(?:ring|shadow)-(?!0(?![\w-])|none(?![\w-]))/

describe("focus indicators are outlines", () => {
  it("draws no focus indicator with box-shadow or a ring", () => {
    const offenders: string[] = []
    for (const rule of RULES) {
      const exempt = rule.selectors
        .flatMap(subjectClasses)
        .some((cls) => OUTLINE_EXEMPT.has(cls))
      if (exempt) continue
      const drawn = rule.body.replace(REMOVALS, "")
      if (FOCUS_VARIANT_SHADOW_OR_RING.test(drawn)) {
        offenders.push(`${rule.selectors.join(", ")} (${rule.path})`)
        continue
      }
      const focused = rule.selectors.filter((s) => FOCUS_STATE.test(s))
      if (focused.length === 0) continue
      if (rule.selectors.some((s) => s.includes(":hover"))) continue
      if (FIELD_INDICATOR.test(drawn)) continue
      if (SHADOW_OR_RING.test(drawn)) {
        offenders.push(`${focused.join(", ")} (${rule.path})`)
      }
    }
    for (const { path, source } of TSX) {
      for (const group of classGroups(source)) {
        if (group.some((cls) => FOCUS_VARIANT_SHADOW_OR_RING.test(cls))) {
          offenders.push(`${group.join(" ")} (${path})`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it("keeps every outline exemption named and justified", () => {
    const styled = new Set(
      RULES.flatMap((rule) => rule.selectors.flatMap(subjectClasses)),
    )
    for (const [cls, reason] of OUTLINE_EXEMPT) {
      expect(styled.has(cls), `${cls} is no longer styled`).toBe(true)
      expect(reason.length, `${cls} needs a reason`).toBeGreaterThan(20)
    }
  })

  it("puts the date input on the field indicator and drops the open multi-select ring", () => {
    const dateInput = RULES.find(
      (rule) =>
        rule.path.endsWith("date-input.css") &&
        rule.selectors.includes(".dr-date-input"),
    )
    expect(dateInput?.body).toMatch(
      /@apply[^;]*(?<![\w-])focus-ring-input-wrapper(?![\w-])/,
    )
    const multiSelect = RULES.filter((rule) =>
      rule.path.endsWith("multi-select.css"),
    ).flatMap((rule) => rule.selectors)
    expect(multiSelect).not.toContain(
      '.dr-multi-select-control[data-state="open"]',
    )
  })

  it("rings the listbox root with focus-ring", () => {
    const listbox = RULES.find(
      (rule) =>
        rule.path.endsWith("listbox.css") &&
        rule.selectors.includes(".dr-listbox"),
    )
    expect(listbox?.body).toMatch(/@apply[^;]*(?<![\w-])focus-ring(?![\w-])/)
  })
})
