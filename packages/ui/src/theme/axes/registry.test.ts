import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import {
  AXES,
  AXIS_KEYS,
  isAxisValue,
  type AxisControlKind,
  type AxisKey,
} from "./registry"
import { KIT_VERSION } from "./version"
import { themeConfig } from "@theme/themeConfig"

describe("axis registry", () => {
  it("lists every axis once, in registry order", () => {
    expect(AXIS_KEYS).toEqual(Object.keys(AXES))
    expect(new Set(AXIS_KEYS).size).toBe(AXIS_KEYS.length)
  })

  it("lists the axes in switcher display order", () => {
    expect(AXIS_KEYS).toEqual([
      "mode",
      "accentColor",
      "surfaceColor",
      "tintWithAccent",
      "style",
      "glassOpacity",
      "glassBlur",
      "font",
      "radius",
      "density",
      "fontSize",
      "contrast",
      "darkAccentChroma",
      "elevation",
      "outerGlow",
      "innerGlow",
      "backgroundStyle",
      "backgroundIntensity",
      "gradientPattern",
      "sidebarSelection",
    ])
  })

  it.each(AXIS_KEYS)("%s names a control kind", (key) => {
    expect(["swatch", "choice", "ordinal", "switch"]).toContain(
      AXES[key].control,
    )
  })

  it("assigns each axis its control kind", () => {
    const byKind = (kind: AxisControlKind) =>
      AXIS_KEYS.filter((key) => AXES[key].control === kind)
    expect(byKind("swatch")).toEqual(["accentColor", "surfaceColor"])
    expect(byKind("choice")).toEqual([
      "mode",
      "style",
      "font",
      "backgroundStyle",
      "gradientPattern",
      "sidebarSelection",
    ])
    expect(byKind("ordinal")).toEqual([
      "glassOpacity",
      "glassBlur",
      "radius",
      "density",
      "fontSize",
      "contrast",
      "darkAccentChroma",
      "elevation",
      "outerGlow",
      "innerGlow",
      "backgroundIntensity",
    ])
    expect(byKind("switch")).toEqual(["tintWithAccent"])
  })

  it("gives every choice axis two to five values", () => {
    for (const key of AXIS_KEYS.filter((k) => AXES[k].control === "choice")) {
      expect(AXES[key].values.length, key).toBeGreaterThanOrEqual(2)
      expect(AXES[key].values.length, key).toBeLessThanOrEqual(5)
    }
  })

  it("gives every switch axis exactly off and on", () => {
    for (const key of AXIS_KEYS.filter((k) => AXES[k].control === "switch")) {
      expect(AXES[key].values, key).toEqual(["off", "on"])
    }
  })

  it("declares a visibility rule only where another axis gates the control", () => {
    expect(AXIS_KEYS.filter((key) => AXES[key].visibleWhen)).toEqual([
      "tintWithAccent",
      "glassOpacity",
      "glassBlur",
      "gradientPattern",
    ])
  })

  it("shows the glass axes only under the glass style", () => {
    for (const key of ["glassOpacity", "glassBlur"] as const) {
      const visible = AXES[key].visibleWhen
      expect(visible?.({ style: "glass" }), key).toBe(true)
      expect(visible?.({ style: "quiet" }), key).toBe(false)
    }
  })

  it("shows the gradient pattern only under the gradient style", () => {
    const visible = AXES.gradientPattern.visibleWhen
    expect(visible?.({ backgroundStyle: "gradient" })).toBe(true)
    expect(visible?.({ backgroundStyle: "solid" })).toBe(false)
  })

  it("hides tint with accent under the neutral accent", () => {
    const visible = AXES.tintWithAccent.visibleWhen
    expect(visible?.({ accentColor: "blue" })).toBe(true)
    expect(visible?.({ accentColor: "neutral" })).toBe(false)
  })

  it("keeps the style axis and the glass axes in the style layer", () => {
    expect(AXES.style.layer).toBe("style")
    expect(AXES.glassOpacity.layer).toBe("style")
    expect(AXES.glassBlur.layer).toBe("style")
    expect(AXES.font.layer).toBe("brand")
  })

  it("keeps the 6.x storage keys for the style and glass axes", () => {
    expect(AXES.style).toMatchObject({
      default: "quiet",
      storageKey: "theme-preset",
      attribute: "data-style",
    })
    expect(AXES.glassOpacity).toMatchObject({
      values: ["subtle", "medium", "strong"],
      default: "medium",
      storageKey: "theme-glass-opacity",
      attribute: "data-glass-opacity",
    })
    expect(AXES.glassBlur).toMatchObject({
      values: ["none", "low", "medium", "high"],
      default: "medium",
      storageKey: "theme-glass-blur",
      attribute: "data-glass-blur",
    })
  })

  it("holds only registry axes and their values in the kit config", () => {
    for (const [key, value] of Object.entries(themeConfig.defaults)) {
      expect(AXIS_KEYS).toContain(key)
      expect(isAxisValue(key as AxisKey, value), key).toBe(true)
    }
  })

  it.each(AXIS_KEYS)("%s default is one of its values", (key) => {
    expect(AXES[key].values).toContain(AXES[key].default)
  })

  it("gives every axis a unique storage key", () => {
    const keys = AXIS_KEYS.map((k) => AXES[k].storageKey)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it("gives every attribute axis a unique data attribute", () => {
    const attrs = AXIS_KEYS.flatMap((k) => AXES[k].attribute ?? [])
    expect(new Set(attrs).size).toBe(attrs.length)
    for (const a of attrs) expect(a).toMatch(/^data-[a-z-]+$/)
  })

  it("keeps the sidebar selection off the document element", () => {
    expect(AXES.sidebarSelection.attribute).toBeUndefined()
    expect(AXES.sidebarSelection.storageKey).toBe("theme-sidebar-selection")
    expect(AXES.accentColor.attribute).toBe("data-accent")
    expect(AXES.surfaceColor.attribute).toBe("data-surface")
  })

  it("registers the colour engine axes", () => {
    expect(AXES.contrast).toMatchObject({
      values: ["low", "standard", "high"],
      default: "standard",
      storageKey: "theme-contrast",
      attribute: "data-contrast",
      layer: "advanced",
    })
    expect(AXES.darkAccentChroma).toMatchObject({
      values: ["calm", "standard", "vivid"],
      default: "standard",
      storageKey: "theme-dark-accent-chroma",
      attribute: "data-dark-accent-chroma",
      layer: "advanced",
    })
    expect(AXES.tintWithAccent).toMatchObject({
      values: ["off", "on"],
      default: "off",
      storageKey: "theme-tint-with-accent",
      attribute: "data-tint-with-accent",
      layer: "brand",
    })
  })

  it("reduces elevation to flat, standard and high", () => {
    expect(AXES.elevation).toMatchObject({
      values: ["flat", "standard", "high"],
      default: "standard",
      storageKey: "theme-elevation",
      attribute: "data-elevation",
      layer: "advanced",
    })
  })

  it("drops the button elevation axis", () => {
    expect("buttonElevation" in AXES).toBe(false)
    expect("buttonElevation" in themeConfig.defaults).toBe(false)
    expect("buttonElevation" in (themeConfig.switcher.axes ?? {})).toBe(false)
  })

  it("registers the font axis", () => {
    expect(AXES.font).toMatchObject({
      values: ["inter", "geist", "ibm-plex-sans"],
      default: "inter",
      storageKey: "theme-font",
      attribute: "data-font",
      layer: "brand",
    })
  })

  it("drops the axes the colour engine replaced", () => {
    for (const key of [
      "surfaceIntensity",
      "borderIntensity",
      "controlDepth",
      "accentIntensity",
    ])
      expect(key in AXES).toBe(false)
  })

  it("validates values against the registry", () => {
    expect(isAxisValue("density", "spacious")).toBe(true)
    expect(isAxisValue("density", "huge")).toBe(false)
    expect(isAxisValue("mode", 3)).toBe(false)
    expect(isAxisValue("accentColor", null)).toBe(false)
  })

  it("pins the kit version to package.json", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      version: string
    }
    expect(KIT_VERSION).toBe(pkg.version)
  })
})
