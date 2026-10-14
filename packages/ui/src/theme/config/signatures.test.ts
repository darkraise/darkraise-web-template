import { describe, expect, it } from "vitest"
import { SIDEBAR_SELECTIONS } from "../types"
import { resolveRegistry } from "./registry"
import {
  SIGNATURE_KEYS,
  SIGNATURES,
  STAMPED_SIGNATURES,
  signatureAttribute,
} from "./signatures"

describe("SIGNATURES", () => {
  it("lists the signatures, each defaulting to its first value", () => {
    expect(SIGNATURE_KEYS).toEqual([
      "navSelection",
      "navMarker",
      "railTone",
      "barTone",
      "barSpan",
      "barEdge",
      "menuHighlight",
      "menuTone",
      "tooltipTone",
      "labelCase",
      "figureFamily",
      "cardDivider",
      "cardFooter",
      "bannerMark",
      "bannerSurface",
      "badgeStyle",
      "fieldFill",
      "fieldBorder",
      "tableHead",
      "rowSelection",
      "dialogHeader",
      "dialogFooter",
      "ghostButton",
      "avatarShape",
      "buttonStyle",
      "iconButton",
      "switchStyle",
      "checkStyle",
      "tabStyle",
      "sliderStyle",
    ])
    for (const key of SIGNATURE_KEYS) {
      expect(SIGNATURES[key].values[0], key).toBe(SIGNATURES[key].default)
    }
  })

  it("lists the control anatomy values, today's look first", () => {
    expect({
      buttonStyle: SIGNATURES.buttonStyle,
      iconButton: SIGNATURES.iconButton,
      switchStyle: SIGNATURES.switchStyle,
      checkStyle: SIGNATURES.checkStyle,
      tabStyle: SIGNATURES.tabStyle,
      sliderStyle: SIGNATURES.sliderStyle,
    }).toEqual({
      buttonStyle: {
        values: ["solid", "key", "soft", "glass"],
        default: "solid",
      },
      iconButton: { values: ["square", "round"], default: "square" },
      switchStyle: {
        values: ["pill", "track", "slide", "marked"],
        default: "pill",
      },
      checkStyle: { values: ["box", "outline", "round"], default: "box" },
      tabStyle: {
        values: ["well", "underline", "pill", "outline"],
        default: "well",
      },
      sliderStyle: {
        values: ["round", "bar", "knob", "ruled"],
        default: "round",
      },
    })
  })

  it("draws navSelection from the sidebar selection looks", () => {
    expect(SIGNATURES.navSelection.values).toEqual(
      SIDEBAR_SELECTIONS.filter((value) => value !== "auto"),
    )
  })

  it("stamps every signature but navSelection as a kebab-case attribute", () => {
    expect(STAMPED_SIGNATURES.map(signatureAttribute)).toEqual([
      "data-nav-marker",
      "data-rail-tone",
      "data-bar-tone",
      "data-bar-span",
      "data-bar-edge",
      "data-menu-highlight",
      "data-menu-tone",
      "data-tooltip-tone",
      "data-label-case",
      "data-figure-family",
      "data-card-divider",
      "data-card-footer",
      "data-banner-mark",
      "data-banner-surface",
      "data-badge-style",
      "data-field-fill",
      "data-field-border",
      "data-table-head",
      "data-row-selection",
      "data-dialog-header",
      "data-dialog-footer",
      "data-ghost-button",
      "data-avatar-shape",
      "data-button-style",
      "data-icon-button",
      "data-switch-style",
      "data-check-style",
      "data-tab-style",
      "data-slider-style",
    ])
  })
})

describe("built-in signatures", () => {
  it("names a nav selection look for every built-in style", () => {
    const registry = resolveRegistry()
    for (const style of Object.values(registry.styles)) {
      expect(
        SIGNATURES.navSelection.values as readonly string[],
        style.name,
      ).toContain(style.signatures.navSelection)
    }
  })
})
