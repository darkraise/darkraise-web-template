import { describe, expect, it } from "vitest"
import type { ThemeConfig } from "../themeConfig"
import { definePreset, defineStyle, defineThemeConfig } from "./define"
import type { PresetDefinition, StyleDefinition } from "./schema"

describe("define helpers", () => {
  it("defineStyle returns its argument", () => {
    const style: StyleDefinition = {
      label: "Paper",
      extends: "tactile",
      tokens: { shared: { cardEdge: "none" } },
    }
    expect(defineStyle(style)).toBe(style)
  })

  it("definePreset returns its argument", () => {
    const preset: PresetDefinition = {
      label: "Ink",
      style: "paper",
      axes: { radius: "sharp" },
    }
    expect(definePreset(preset)).toBe(preset)
  })

  it("defineThemeConfig returns its argument", () => {
    const config: ThemeConfig = { defaults: {}, switcher: { enabled: true } }
    expect(defineThemeConfig(config)).toBe(config)
  })
})
