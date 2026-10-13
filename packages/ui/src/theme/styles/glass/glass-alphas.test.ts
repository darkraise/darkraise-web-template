import { describe, expect, it } from "vitest"
import { resolvedTokens } from "@test/preset-tokens"
import { resolveRegistry } from "../../config/registry"

const registry = resolveRegistry()

/**
 * Each look's Medium alphas: the card plane in light and dark, then the
 * overlay in light and dark. A preset that writes none inherits Glass's.
 */
const DECLARED = [
  ["base", "0.72", "0.66", "0.6", "0.6"],
  ["mica-desk", "0.75", "0.75", "0.6", "0.6"],
  ["smoked-obsidian", "0.7", "0.7", "0.85", "0.6"],
  ["milk-glass", "0.78", "0.8", "0.7", "0.7"],
  ["aurora-night", "0.62", "0.57", "0.55", "0.55"],
  ["coral-space", "0.82", "0.8", "0.65", "0.65"],
  ["dusk-haze", "0.72", "0.7", "0.6", "0.6"],
] as const

describe("glass declared alphas", () => {
  it.each(DECLARED)(
    "%s declares its Medium card and overlay alphas",
    (look, cardLight, cardDark, overlayLight, overlayDark) => {
      const preset = look === "base" ? undefined : registry.presets[look]
      const at = (mode: "light" | "dark") =>
        resolvedTokens(registry.styles.glass?.tokens, preset?.tokens, mode)
      expect([
        at("light").surfaceFillAlpha,
        at("dark").surfaceFillAlpha,
        at("light").overlayFillAlpha,
        at("dark").overlayFillAlpha,
      ]).toEqual([cardLight, cardDark, overlayLight, overlayDark])
    },
  )

  it("paints overlays and dialogs from the effective overlay alpha", () => {
    const shared = registry.styles.glass?.tokens.shared
    expect(shared?.overlayFillBase).toBe(
      "hsl(var(--popover) / var(--overlay-alpha))",
    )
    expect(shared?.dialogFill).toBe(
      "hsl(var(--popover) / var(--overlay-alpha))",
    )
  })
})
