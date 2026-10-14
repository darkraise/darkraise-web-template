import { describe, expect, it } from "vitest"
import { resolveRegistry } from "@theme/config/registry"

const registry = resolveRegistry()

// The owner-approved control anatomy of every built-in look (spec section 4,
// 2026-10-14): style, preset ("base" for the style itself), then
// buttonStyle, iconButton, switchStyle, checkStyle, tabStyle, sliderStyle.
// prettier-ignore
const ASSIGNMENT = [
  ["quiet",   "base",            "solid", "square", "pill",   "box",     "well",      "round"],
  ["quiet",   "paper-ink",       "solid", "square", "track",  "outline", "underline", "ruled"],
  ["quiet",   "linen-teal",      "soft",  "round",  "pill",   "box",     "pill",      "round"],
  ["quiet",   "red-graphite",    "solid", "square", "marked", "box",     "outline",   "bar"],
  ["quiet",   "studio-green",    "soft",  "square", "track",  "round",   "underline", "knob"],
  ["flat",    "base",            "solid", "square", "pill",   "box",     "underline", "round"],
  ["flat",    "pastel-soft",     "soft",  "round",  "pill",   "round",   "pill",      "knob"],
  ["flat",    "forest-lime",     "solid", "round",  "track",  "box",     "pill",      "round"],
  ["tactile", "base",            "key",   "square", "pill",   "box",     "well",      "knob"],
  ["tactile", "braun-panel",     "key",   "square", "slide",  "box",     "outline",   "bar"],
  ["tactile", "dark-instrument", "key",   "square", "marked", "box",     "outline",   "ruled"],
  ["tactile", "card-stock",      "key",   "square", "slide",  "outline", "well",      "bar"],
  ["glass",   "base",            "glass", "round",  "pill",   "round",   "well",      "knob"],
  ["glass",   "mica-desk",       "solid", "square", "track",  "box",     "underline", "knob"],
  ["glass",   "smoked-obsidian", "glass", "square", "track",  "box",     "well",      "knob"],
  ["glass",   "milk-glass",      "glass", "round",  "pill",   "round",   "pill",      "knob"],
  ["glass",   "aurora-night",    "glass", "round",  "pill",   "box",     "pill",      "round"],
  ["glass",   "coral-space",     "soft",  "round",  "pill",   "round",   "underline", "round"],
  ["glass",   "dusk-haze",       "glass", "round",  "track",  "round",   "pill",      "knob"],
  ["glass",   "soft-glass",      "glass", "round",  "pill",   "round",   "well",      "round"],
] as const

const ANATOMY = [
  "buttonStyle",
  "iconButton",
  "switchStyle",
  "checkStyle",
  "tabStyle",
  "sliderStyle",
] as const

describe("control anatomy of the built-in looks", () => {
  it("lists every built-in style and preset once", () => {
    const listed = ASSIGNMENT.map(([style, preset]) => `${style}/${preset}`)
    const builtIn = [
      ...Object.keys(registry.styles).map((style) => `${style}/base`),
      ...Object.values(registry.presets)
        .filter((preset) => preset.builtIn)
        .map((preset) => `${preset.style}/${preset.name}`),
    ]
    expect([...listed].sort()).toEqual([...builtIn].sort())
    expect(listed).toHaveLength(20)
  })

  it.each(ASSIGNMENT)(
    "resolves %s %s to the approved anatomy",
    (style, preset, ...values) => {
      const resolved = registry.signaturesFor(style, preset)
      expect(ANATOMY.map((key) => resolved[key])).toEqual(values)
    },
  )

  // A base style writes what differs from the kit default, a preset what
  // differs from its style, a return to the kit default included.
  it.each(ASSIGNMENT.filter(([, preset]) => preset !== "base"))(
    "writes for %s %s only the anatomy that differs from its style",
    (style, preset) => {
      const own = registry.presets[preset]?.signatures ?? {}
      const inherited = registry.signaturesFor(style, "base")
      for (const key of ANATOMY) {
        if (key in own) {
          expect(own[key], `${preset} ${key}`).not.toBe(inherited[key])
        }
      }
    },
  )
})
