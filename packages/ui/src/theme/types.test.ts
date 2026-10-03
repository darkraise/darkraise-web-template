import { describe, it, expect } from "vitest"
import {
  BACKGROUND_INTENSITIES,
  FONTS,
  SHELL_STYLES,
  SIDEBAR_ACTIVE_BARS,
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

describe("sidebarActiveBar axis", () => {
  it("leads with the default indicator", () => {
    expect(SIDEBAR_ACTIVE_BARS).toEqual(["default", "bar", "ring", "both"])
  })

  it("defaults to the default indicator so nothing moves", () => {
    expect(resolveDefaults(themeConfig).sidebarActiveBar).toBe("default")
  })

  it("is switchable by default", () => {
    expect(themeConfig.switcher.axes?.sidebarActiveBar).not.toBe(false)
  })
})

describe("font faces", () => {
  it("lists Inter first, then Geist and IBM Plex Sans", () => {
    expect(FONTS).toEqual(["inter", "geist", "ibm-plex-sans"])
  })
})
