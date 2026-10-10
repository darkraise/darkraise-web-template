import { describe, expect, it } from "vitest"
import { resolveRegistry } from "@theme/config/registry"
import { resolveSidebarSelection } from "./sidebar-selection"

const registry = resolveRegistry({
  styles: {
    "on-quiet": { label: "On Quiet", extends: "quiet" },
    "on-flat": { label: "On Flat", extends: "flat" },
    "on-tactile": { label: "On Tactile", extends: "tactile" },
    "on-glass": { label: "On Glass", extends: "glass" },
    "two-down": { label: "Two Down", extends: "on-glass" },
    own: { label: "Own" },
  },
})

describe("resolveSidebarSelection", () => {
  it.each([
    ["quiet", "chip"],
    ["flat", "pill"],
    ["tactile", "tile"],
    ["glass", "frosted"],
  ] as const)("resolves auto under %s to %s", (style, look) => {
    expect(resolveSidebarSelection("auto", style)).toBe(look)
  })

  it.each([
    ["on-quiet", "chip"],
    ["on-flat", "pill"],
    ["on-tactile", "tile"],
    ["on-glass", "frosted"],
    ["two-down", "frosted"],
    ["own", "chip"],
  ] as const)(
    "resolves auto under the consumer style %s to %s",
    (style, look) => {
      expect(resolveSidebarSelection("auto", style, registry)).toBe(look)
    },
  )

  it("resolves auto to chip for a style it cannot place", () => {
    expect(resolveSidebarSelection("auto", "unknown")).toBe("chip")
    expect(resolveSidebarSelection("auto", "unknown", registry)).toBe("chip")
  })

  it("passes an explicit look through under any style", () => {
    expect(resolveSidebarSelection("frosted", "flat")).toBe("frosted")
    expect(resolveSidebarSelection("pill", "glass")).toBe("pill")
  })
})
