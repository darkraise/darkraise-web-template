import { describe, expect, it } from "vitest"
import { resolveSidebarSelection } from "./sidebar-selection"

describe("resolveSidebarSelection", () => {
  it.each([
    ["quiet", "chip"],
    ["flat", "pill"],
    ["tactile", "tile"],
    ["glass", "frosted"],
  ] as const)("resolves auto under %s to %s", (style, look) => {
    expect(resolveSidebarSelection("auto", style)).toBe(look)
  })

  it("passes an explicit look through under any style", () => {
    expect(resolveSidebarSelection("frosted", "flat")).toBe("frosted")
    expect(resolveSidebarSelection("pill", "glass")).toBe("pill")
  })
})
