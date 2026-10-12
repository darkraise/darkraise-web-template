import { describe, expect, it } from "vitest"
import { resolveRegistry } from "@theme/config/registry"
import { presetOptions } from "./presetOptions"

const registry = resolveRegistry({
  styles: { ink: { label: "Ink", extends: "glass" }, bare: { label: "Bare" } },
  presets: {
    "ink-night": { label: "Ink night", style: "ink" },
    "quiet-dawn": { label: "Quiet dawn", style: "quiet" },
  },
})

describe("presetOptions", () => {
  it.each<[string, string, string, readonly string[] | undefined, string[]]>([
    [
      "base, then the style's presets in registry order",
      "quiet",
      "base",
      undefined,
      [
        "base",
        "paper-ink",
        "linen-teal",
        "red-graphite",
        "studio-green",
        "quiet-dawn",
      ],
    ],
    [
      "only the presets of the active style",
      "flat",
      "base",
      undefined,
      ["base", "pastel-soft", "forest-lime"],
    ],
    [
      "a config style's own presets, not its parent's",
      "ink",
      "base",
      undefined,
      ["base", "ink-night"],
    ],
    [
      "base alone for a style without presets",
      "bare",
      "base",
      undefined,
      ["base"],
    ],
    [
      "the allowed presets, still in registry order",
      "quiet",
      "base",
      ["quiet-dawn", "linen-teal", "mica-desk"],
      ["base", "linen-teal", "quiet-dawn"],
    ],
    ["base alone when nothing is allowed", "quiet", "base", [], ["base"]],
    [
      "the active preset last when it is not allowed",
      "quiet",
      "studio-green",
      ["paper-ink"],
      ["base", "paper-ink", "studio-green"],
    ],
    [
      "the active preset once when it is allowed",
      "quiet",
      "paper-ink",
      ["paper-ink"],
      ["base", "paper-ink"],
    ],
  ])("lists %s", (_title, style, active, allowed, expected) => {
    expect(presetOptions(registry, style, active, allowed)).toEqual(expected)
  })
})
