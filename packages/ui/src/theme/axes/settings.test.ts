import { describe, expect, it } from "vitest"
import {
  completePresetAxisValues,
  presetAxisStorageKey,
  readPresetAxisValues,
  readStoredAxes,
  sanitizeSettings,
} from "./settings"

const from = (entries: Record<string, string>) => (key: string) =>
  entries[key] ?? null

describe("readStoredAxes", () => {
  it("keeps valid stored values and drops the rest", () => {
    expect(
      readStoredAxes(
        from({
          "theme-density": "spacious",
          mode: "sepia",
          "theme-accent": "rose",
        }),
      ),
    ).toEqual({ density: "spacious", accentColor: "rose" })
  })

  it("returns nothing when nothing is stored", () => {
    expect(readStoredAxes(() => null)).toEqual({})
  })
})

describe("preset axis values", () => {
  it("names storage keys after the preset and axis", () => {
    expect(presetAxisStorageKey("glass", "blur")).toBe("theme-glass-blur")
  })

  it("fills every preset axis with its default", () => {
    expect(completePresetAxisValues()).toEqual({
      default: {},
      glass: { opacity: "medium", blur: "medium" },
    })
  })

  it("reads valid stored preset axes", () => {
    expect(
      readPresetAxisValues(
        from({ "theme-glass-blur": "high", "theme-glass-opacity": "cloudy" }),
      ),
    ).toEqual({ default: {}, glass: { opacity: "medium", blur: "high" } })
  })
})

describe("sanitizeSettings", () => {
  it("drops unknown and invalid axis values from a synced payload", () => {
    expect(
      sanitizeSettings({
        accentColor: "rose",
        mode: "sepia",
        density: 4,
        surfaceColor: "slate",
        unknownAxis: "x",
      }),
    ).toEqual({ accentColor: "rose", surfaceColor: "slate" })
  })

  it("drops preset axis entries for presets and axes that do not exist", () => {
    expect(
      sanitizeSettings({
        presetAxisValues: {
          scifi: { glow: "high" },
          glass: { blur: "high", tint: "x", opacity: "nope" },
        },
      }),
    ).toEqual({ presetAxisValues: { glass: { blur: "high" } } })
  })

  it("treats a non-object payload as empty", () => {
    expect(sanitizeSettings(null)).toEqual({})
    expect(sanitizeSettings("dark")).toEqual({})
  })
})
