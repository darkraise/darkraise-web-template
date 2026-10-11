import { describe, it, expect } from "vitest"
import {
  BACKGROUND_INTENSITIES,
  FONTS,
  SHELL_STYLES,
  SIDEBAR_SELECTIONS,
} from "./types"
import { resolveDefaults, themeConfig } from "./themeConfig"
import { AXES } from "./axes/registry"

describe("backgroundIntensity axis", () => {
  it("has five steps from neutral to intense", () => {
    expect(BACKGROUND_INTENSITIES).toEqual([
      "neutral",
      "subtle",
      "balanced",
      "vivid",
      "intense",
    ])
  })

  it("defaults to the uncapped step", () => {
    expect(resolveDefaults(themeConfig).backgroundIntensity).toBe("vivid")
  })

  it("is switchable by default", () => {
    expect(themeConfig.switcher.axes?.backgroundIntensity).not.toBe(false)
  })
})

describe("shell style", () => {
  it("lists the six shell styles with classic first", () => {
    expect(SHELL_STYLES).toEqual([
      "classic",
      "inset",
      "island",
      "floating",
      "framed",
      "flat",
    ])
  })

  it("is a layout setting, not a theme axis", () => {
    expect("shellStyle" in AXES).toBe(false)
    expect("shellStyle" in themeConfig.defaults).toBe(false)
    expect("shellStyle" in (themeConfig.switcher.axes ?? {})).toBe(false)
  })
})

describe("sidebarSelection axis", () => {
  it("leads with auto, then the four kit looks and the five newer ones", () => {
    expect(SIDEBAR_SELECTIONS).toEqual([
      "auto",
      "chip",
      "pill",
      "tile",
      "frosted",
      "tint",
      "accent",
      "rule",
      "key",
      "tab",
    ])
  })

  it("defaults to auto so the style decides", () => {
    expect(resolveDefaults(themeConfig).sidebarSelection).toBe("auto")
  })

  it("is switchable by default", () => {
    expect(themeConfig.switcher.axes?.sidebarSelection).not.toBe(false)
  })
})

describe("font faces", () => {
  it("lists Inter first, then Geist and IBM Plex Sans", () => {
    expect(FONTS).toEqual(["inter", "geist", "ibm-plex-sans"])
  })
})
