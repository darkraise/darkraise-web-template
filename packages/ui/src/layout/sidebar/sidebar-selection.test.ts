import { describe, expect, it } from "vitest"
import { resolveRegistry } from "@theme/config/registry"
import { SIGNATURES } from "@theme/config/signatures"
import { BUILTIN_STYLES, STYLE_NAMES, type StyleName } from "@theme/styles"
import { resolveSidebarSelection } from "./sidebar-selection"

/** The look a built-in style's definition names for Auto. */
const own = (style: StyleName) =>
  BUILTIN_STYLES[style].signatures?.navSelection ??
  SIGNATURES.navSelection.default

const registry = resolveRegistry({
  styles: {
    "on-quiet": { label: "On Quiet", extends: "quiet" },
    "on-flat": { label: "On Flat", extends: "flat" },
    "on-tactile": { label: "On Tactile", extends: "tactile" },
    "on-glass": { label: "On Glass", extends: "glass" },
    "two-down": { label: "Two Down", extends: "on-glass" },
    own: { label: "Own" },
    tiled: {
      label: "Tiled",
      extends: "glass",
      signatures: { navSelection: "tile" },
    },
  },
  presets: {
    pillish: {
      label: "Pillish",
      style: "tiled",
      signatures: { navSelection: "pill" },
    },
  },
})

describe("resolveSidebarSelection", () => {
  it.each(STYLE_NAMES)("resolves auto under %s to its own look", (style) => {
    expect(resolveSidebarSelection("auto", style, "base", registry)).toBe(
      own(style),
    )
  })

  it.each([
    ["on-quiet", own("quiet")],
    ["on-flat", own("flat")],
    ["on-tactile", own("tactile")],
    ["on-glass", own("glass")],
    ["two-down", own("glass")],
    ["own", "chip"],
    ["tiled", "tile"],
  ] as const)(
    "resolves auto under the consumer style %s to %s",
    (style, look) => {
      expect(resolveSidebarSelection("auto", style, "base", registry)).toBe(
        look,
      )
    },
  )

  it("takes the preset's look over its style's under auto", () => {
    expect(resolveSidebarSelection("auto", "tiled", "pillish", registry)).toBe(
      "pill",
    )
  })

  it("ignores a preset of another style", () => {
    expect(resolveSidebarSelection("auto", "glass", "pillish", registry)).toBe(
      own("glass"),
    )
  })

  it("resolves auto to chip for a style it cannot place or without a registry", () => {
    expect(resolveSidebarSelection("auto", "unknown", "base", registry)).toBe(
      "chip",
    )
    expect(resolveSidebarSelection("auto", "glass", "base")).toBe("chip")
  })

  it("passes an explicit look through under any style", () => {
    expect(resolveSidebarSelection("frosted", "flat", "base", registry)).toBe(
      "frosted",
    )
    expect(resolveSidebarSelection("pill", "glass", "base")).toBe("pill")
  })
})
