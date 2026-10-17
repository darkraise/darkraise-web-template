import { describe, expect, it } from "vitest"
import { AXES, AXIS_KEYS, type AxisValues } from "@theme/axes/registry"
import { effectiveSettings } from "@theme/axes/resolve"
import { engineInput } from "./engineInput"
import { resolveRegistry } from "./registry"

const DEFAULTS = Object.fromEntries(
  AXIS_KEYS.map((key) => [key, AXES[key].default]),
) as AxisValues

describe("engineInput", () => {
  it("carries a preset's axes, its style's chrome and its chrome tones", () => {
    const registry = resolveRegistry()
    const current = effectiveSettings(
      { style: "quiet", preset: "red-graphite" },
      DEFAULTS,
      registry,
    )
    expect(engineInput(registry, current, "dark")).toEqual({
      accentColor: "red",
      surfaceColor: "zinc",
      frosted: false,
      backgroundStyle: current.backgroundStyle,
      mode: "dark",
      contrast: current.contrast,
      darkAccentChroma: current.darkAccentChroma,
      tintWithAccent: false,
      backgroundIntensity: current.backgroundIntensity,
      hairlines: "opaque",
      signalColor: "none",
      railTone: "inverse",
      barTone: "page",
      groundArt: { layers: [], blobs: false },
    })
  })

  it("turns the tint on and frosts the chrome under Glass", () => {
    const registry = resolveRegistry()
    const current = {
      ...effectiveSettings({ style: "glass" }, DEFAULTS, registry),
      tintWithAccent: "on",
    } as AxisValues
    expect(engineInput(registry, current, "light")).toMatchObject({
      frosted: true,
      tintWithAccent: true,
      mode: "light",
    })
  })

  it("reads the engine colours a look's ground art paints", () => {
    const registry = resolveRegistry()
    const art = (preset: string) =>
      engineInput(
        registry,
        effectiveSettings({ style: "glass", preset }, DEFAULTS, registry),
        "light",
      ).groundArt
    expect(art("mica-desk")).toEqual({
      layers: [{ token: "--primary", alpha: 0.34 }],
      blobs: false,
    })
    expect(art("soft-glass")).toEqual({ layers: [], blobs: true })
  })

  it("takes a config style's hairlines", () => {
    const registry = resolveRegistry({
      styles: { ledger: { label: "Ledger", hairlines: "alpha" } },
    })
    const current = effectiveSettings({ style: "ledger" }, DEFAULTS, registry)
    expect(engineInput(registry, current, "light")).toMatchObject({
      frosted: false,
      hairlines: "alpha",
    })
  })
})
