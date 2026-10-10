import { describe, expect, it } from "vitest"
import { resolveRegistry } from "@theme/config/registry"
import { AXES, AXIS_KEYS, type AxisValues } from "./registry"
import { applyAxisChange, effectiveSettings } from "./resolve"

const registry = resolveRegistry({
  styles: {
    ink: { label: "Ink", extends: "glass", defaults: { elevation: "flat" } },
  },
  presets: {
    night: {
      label: "Night",
      style: "ink",
      axes: { elevation: "high", accentColor: "violet" },
    },
    dusk: { label: "Dusk", style: "quiet", axes: { radius: "pill" } },
  },
})

const DEFAULTS = Object.fromEntries(
  AXIS_KEYS.map((key) => [key, AXES[key].default]),
) as AxisValues

const defaults = (values: Partial<AxisValues>): AxisValues => ({
  ...DEFAULTS,
  ...values,
})

describe("effectiveSettings", () => {
  it("takes the stored style, else the default style", () => {
    expect(
      effectiveSettings({}, defaults({ style: "flat" }), registry),
    ).toMatchObject({
      style: "flat",
    })
    expect(
      effectiveSettings(
        { style: "ink" },
        defaults({ style: "flat" }),
        registry,
      ),
    ).toMatchObject({ style: "ink" })
  })

  it("ignores a stored style the registry does not know", () => {
    expect(
      effectiveSettings(
        { style: "gone" },
        defaults({ style: "tactile" }),
        registry,
      ),
    ).toMatchObject({ style: "tactile", preset: "base" })
  })

  it("applies a consumer style's own and inherited defaults", () => {
    expect(
      effectiveSettings({ style: "ink" }, DEFAULTS, registry),
    ).toMatchObject({
      style: "ink",
      preset: "base",
      elevation: "flat",
      backgroundStyle: "gradient",
    })
  })

  it("takes a stored preset of the resolved style, with its axes", () => {
    expect(
      effectiveSettings({ style: "ink", preset: "night" }, DEFAULTS, registry),
    ).toMatchObject({
      style: "ink",
      preset: "night",
      elevation: "high",
      accentColor: "violet",
      backgroundStyle: "gradient",
    })
  })

  it("drops a stored preset of another style for the config default, else base", () => {
    const stored = { style: "quiet", preset: "night" }
    expect(effectiveSettings(stored, DEFAULTS, registry)).toMatchObject({
      preset: "base",
      elevation: "standard",
      accentColor: "blue",
    })
    expect(
      effectiveSettings(stored, defaults({ preset: "dusk" }), registry),
    ).toMatchObject({ preset: "dusk", radius: "pill" })
  })

  it("takes the config default preset when it belongs to the resolved style", () => {
    expect(
      effectiveSettings(
        {},
        defaults({ style: "ink", preset: "night" }),
        registry,
      ),
    ).toMatchObject({ style: "ink", preset: "night", elevation: "high" })
  })

  it("ignores a config default preset of another style", () => {
    expect(
      effectiveSettings(
        {},
        defaults({ style: "quiet", preset: "night" }),
        registry,
      ),
    ).toMatchObject({ style: "quiet", preset: "base", elevation: "standard" })
  })

  it("keeps a stored base over the config default preset", () => {
    expect(
      effectiveSettings(
        { preset: "base" },
        defaults({ style: "ink", preset: "night" }),
        registry,
      ),
    ).toMatchObject({ style: "ink", preset: "base", elevation: "flat" })
  })

  it("resolves a stored preset without a stored style against the default style", () => {
    expect(
      effectiveSettings(
        { preset: "night" },
        defaults({ style: "ink" }),
        registry,
      ),
    ).toMatchObject({ style: "ink", preset: "night" })
    expect(
      effectiveSettings(
        { preset: "night" },
        defaults({ style: "quiet" }),
        registry,
      ),
    ).toMatchObject({ style: "quiet", preset: "base" })
  })

  it("ranks a user value over the preset, the style, the config default and the registry", () => {
    const elevation = (
      stored: Partial<AxisValues>,
      config: Partial<AxisValues> = {},
    ) => effectiveSettings(stored, defaults(config), registry).elevation
    expect(
      elevation({ style: "ink", preset: "night", elevation: "standard" }),
    ).toBe("standard")
    expect(elevation({ style: "ink", preset: "night" })).toBe("high")
    expect(elevation({ style: "ink" }, { elevation: "high" })).toBe("flat")
    expect(elevation({ style: "quiet" }, { elevation: "high" })).toBe("high")
    expect(elevation({ style: "quiet" })).toBe(AXES.elevation.default)
  })
})

describe("applyAxisChange", () => {
  it("stores a preset's style along with the preset", () => {
    expect(
      applyAxisChange(
        { style: "quiet", accentColor: "rose" },
        "preset",
        "night",
        registry,
      ),
    ).toEqual({ style: "ink", preset: "night", accentColor: "rose" })
  })

  it("keeps the style when the preset goes back to base", () => {
    expect(
      applyAxisChange(
        { style: "ink", preset: "night" },
        "preset",
        "base",
        registry,
      ),
    ).toEqual({ style: "ink", preset: "base" })
  })

  it("resets the preset to base when the style changes", () => {
    expect(
      applyAxisChange(
        { style: "ink", preset: "night" },
        "style",
        "glass",
        registry,
      ),
    ).toEqual({ style: "glass", preset: "base" })
  })

  it("sets any other axis alone", () => {
    expect(
      applyAxisChange(
        { style: "ink", preset: "night" },
        "elevation",
        "flat",
        registry,
      ),
    ).toEqual({ style: "ink", preset: "night", elevation: "flat" })
  })

  it("does not change its input", () => {
    const stored = Object.freeze({ style: "quiet" })
    expect(() =>
      applyAxisChange(stored, "preset", "night", registry),
    ).not.toThrow()
    expect(stored).toEqual({ style: "quiet" })
  })
})
