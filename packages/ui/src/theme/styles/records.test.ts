import { describe, it, expect } from "vitest"
import {
  AXES,
  AXIS_KEYS,
  isAxisValue,
  type AxisKey,
} from "@theme/axes/registry"
import { resolveRegistry } from "@theme/config/registry"
import { STYLE_NAMES } from "@theme/styles"

const { styles } = resolveRegistry()

describe("built-in style records", () => {
  it("ships the four styles in display order", () => {
    expect(STYLE_NAMES).toEqual(["flat", "quiet", "tactile", "glass"])
    expect(Object.keys(styles)).toEqual([...STYLE_NAMES])
  })

  it("names the style axis's values", () => {
    expect(AXES.style.values).toEqual(STYLE_NAMES)
  })

  it.each(STYLE_NAMES)("%s defaults only valid registry values", (name) => {
    for (const [key, value] of Object.entries(styles[name]?.defaults ?? {})) {
      expect(AXIS_KEYS, `${name}.${key}`).toContain(key)
      expect(
        isAxisValue(key as AxisKey, value),
        `${name}.${key}=${value}`,
      ).toBe(true)
    }
  })

  it.each(STYLE_NAMES)("%s defaults neither mode nor style", (name) => {
    expect(styles[name]?.defaults).not.toHaveProperty("mode")
    expect(styles[name]?.defaults).not.toHaveProperty("style")
  })

  it("frosts only glass", () => {
    expect(STYLE_NAMES.filter((name) => styles[name]?.frosted)).toEqual([
      "glass",
    ])
  })

  it("holds the agreed defaults", () => {
    expect(styles.flat?.defaults).toEqual({ elevation: "flat" })
    expect(styles.quiet?.defaults).toEqual({})
    expect(styles.tactile?.defaults).toEqual({})
    expect(styles.glass?.defaults).toEqual({
      backgroundStyle: "gradient",
      gradientPattern: "blobs",
    })
  })
})
