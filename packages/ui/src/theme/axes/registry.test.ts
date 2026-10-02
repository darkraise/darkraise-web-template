import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { AXES, AXIS_KEYS, isAxisValue, type AxisKey } from "./registry"
import { KIT_VERSION } from "./version"
import { themeConfig } from "@theme/themeConfig"
import { PRESET_NAMES, presets } from "@theme/presets"

describe("axis registry", () => {
  it("lists every axis once, in registry order", () => {
    expect(AXIS_KEYS).toEqual(Object.keys(AXES))
    expect(new Set(AXIS_KEYS).size).toBe(AXIS_KEYS.length)
  })

  it("covers exactly the axes the config declares", () => {
    expect([...AXIS_KEYS].sort()).toEqual(
      Object.keys(themeConfig.defaults).sort(),
    )
  })

  it.each(AXIS_KEYS)("%s defaults to the config default", (key) => {
    expect(AXES[key].default).toBe(themeConfig.defaults[key])
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

  it("keeps the three token-only axes attribute-free", () => {
    expect(AXES.sidebarActiveBar.attribute).toBeUndefined()
    expect(AXES.borderIntensity.attribute).toBeUndefined()
    expect(AXES.accentIntensity.attribute).toBeUndefined()
    expect(AXES.accentColor.attribute).toBe("data-accent")
    expect(AXES.surfaceColor.attribute).toBe("data-surface")
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

  it.each(PRESET_NAMES)(
    "%s preset's common axis defaults are registry values",
    (name) => {
      const defaults: Readonly<Record<string, string>> =
        presets[name].commonAxisDefaults ?? {}
      for (const [key, value] of Object.entries(defaults)) {
        expect(AXIS_KEYS).toContain(key)
        expect(isAxisValue(key as AxisKey, value)).toBe(true)
      }
    },
  )
})
