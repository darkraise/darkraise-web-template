import { describe, expect, it } from "vitest"
import { KIT_FALLBACK, PAINT_TOKENS } from "./tokens"

describe("PAINT_TOKENS", () => {
  it("lists the schema names in contract order", () => {
    expect(Object.keys(PAINT_TOKENS)).toEqual([
      "buttonEdge",
      "buttonSheen",
      "buttonShadow",
      "buttonNeutralEdge",
      "buttonNeutralSheen",
      "buttonNeutralShadow",
      "fieldShadow",
      "checkWellShadow",
      "thumbShadow",
      "selectedViewShadow",
      "cardEdge",
      "cardSheen",
      "trackWell",
      "chromeRailFill",
      "chromeBarFill",
      "chromeEdge",
      "chromeShadow",
      "chromeBackdrop",
      "chromeCanvas",
      "overlayFillLayers",
      "overlayFillBase",
      "overlayFillBlend",
      "overlayBorder",
      "overlayShadow",
      "overlayBackdrop",
      "dropdownShadow",
    ])
  })

  it("maps every name to a distinct custom property", () => {
    const names = Object.values(PAINT_TOKENS)
    expect(new Set(names).size).toBe(names.length)
    for (const name of names) expect(name).toMatch(/^--[a-z][a-z-]*$/)
  })
})

describe("KIT_FALLBACK", () => {
  it("resets the backdrops and the overlay fill to their opaque values", () => {
    expect(KIT_FALLBACK).toEqual({
      chromeBackdrop: "none",
      chromeCanvas: "none",
      overlayBackdrop: "none",
      overlayFillLayers: "",
      overlayFillBase: "hsl(var(--popover))",
      overlayFillBlend: "normal",
    })
  })
})
