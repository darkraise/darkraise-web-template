import { describe, expect, it } from "vitest"
import type { ThemeSettings } from "@theme/types"
import {
  THEME_PAYLOAD_VERSION,
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

describe("glass axes", () => {
  it("read from their own storage keys like any axis", () => {
    expect(
      readStoredAxes(
        from({
          "theme-preset": "glass",
          "theme-glass-blur": "high",
          "theme-glass-opacity": "cloudy",
        }),
      ),
    ).toEqual({ style: "glass", glassBlur: "high" })
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

  it("keeps the glass axes and drops the removed preset axis values", () => {
    expect(
      sanitizeSettings({
        glassOpacity: "strong",
        glassBlur: "cloudy",
        presetAxisValues: { glass: { blur: "high" } },
      }),
    ).toEqual({ glassOpacity: "strong" })
  })

  it("treats a non-object payload as empty", () => {
    expect(sanitizeSettings(null)).toEqual({})
    expect(sanitizeSettings("dark")).toEqual({})
  })
})

describe("THEME_PAYLOAD_VERSION", () => {
  it("is 7 and never reaches the applied axes", () => {
    const payload: ThemeSettings = {
      version: THEME_PAYLOAD_VERSION,
      density: "compact",
    }
    expect(THEME_PAYLOAD_VERSION).toBe(7)
    expect(sanitizeSettings(payload)).toEqual({ density: "compact" })
  })
})
