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
    ])
    for (const key of SIGNATURE_KEYS) {
      expect(SIGNATURES[key].values[0], key).toBe(SIGNATURES[key].default)
    }
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
    ])
  })
})

describe("built-in signatures", () => {
  it("gives each built-in style its nav selection look", () => {
    const registry = resolveRegistry()
    expect(
      Object.fromEntries(
        Object.values(registry.styles).map((style) => [
          style.name,
          style.signatures,
        ]),
      ),
    ).toEqual({
      flat: { navSelection: "pill" },
      quiet: { navSelection: "chip" },
      tactile: { navSelection: "tile" },
      glass: { navSelection: "frosted" },
    })
  })
})
