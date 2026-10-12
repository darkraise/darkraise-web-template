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
