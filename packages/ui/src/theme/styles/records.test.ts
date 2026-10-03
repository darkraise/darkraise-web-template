import { describe, it, expect } from "vitest"
import {
  AXES,
  AXIS_KEYS,
  isAxisValue,
  type AxisKey,
} from "@theme/axes/registry"
import { STYLE_NAMES, STYLES } from "@theme/styles"

describe("style records", () => {
  it("ships the four styles in display order", () => {
    expect(STYLE_NAMES).toEqual(["flat", "quiet", "tactile", "glass"])
    expect(Object.keys(STYLES)).toEqual([...STYLE_NAMES])
  })

  it("names the style axis's values", () => {
    expect(AXES.style.values).toEqual(STYLE_NAMES)
  })

  it.each(STYLE_NAMES)("%s defaults only valid registry values", (name) => {
    for (const [key, value] of Object.entries(STYLES[name].defaults)) {
      expect(AXIS_KEYS, `${name}.${key}`).toContain(key)
      expect(
        isAxisValue(key as AxisKey, value),
        `${name}.${key}=${value}`,
      ).toBe(true)
    }
  })

  it.each(STYLE_NAMES)("%s defaults neither mode nor style", (name) => {
    expect(STYLES[name].defaults).not.toHaveProperty("mode")
    expect(STYLES[name].defaults).not.toHaveProperty("style")
  })

  it("frosts only glass", () => {
    expect(STYLE_NAMES.filter((name) => STYLES[name].frosted)).toEqual([
      "glass",
    ])
  })

  it("holds the agreed defaults", () => {
    expect(STYLES.flat.defaults).toEqual({ elevation: "flat" })
    expect(STYLES.quiet.defaults).toEqual({})
    expect(STYLES.tactile.defaults).toEqual({})
    expect(STYLES.glass.defaults).toEqual({ backgroundStyle: "gradient" })
  })
})
