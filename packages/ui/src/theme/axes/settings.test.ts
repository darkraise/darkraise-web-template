import { describe, expect, it } from "vitest"
import { resolveRegistry } from "@theme/config/registry"
import type { ThemeSettings } from "@theme/types"
import {
  THEME_PAYLOAD_VERSION,
  readStoredAxes,
  sanitizeSettings,
} from "./settings"

const from = (entries: Record<string, string>) => (key: string) =>
  entries[key] ?? null

const consumer = resolveRegistry({
  styles: { ink: { label: "Ink", extends: "glass" } },
  presets: { night: { label: "Night", style: "ink" } },
})

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
          "theme-style": "glass",
          "theme-glass-blur": "high",
          "theme-glass-opacity": "cloudy",
        }),
      ),
    ).toEqual({ style: "glass", glassBlur: "high" })
  })
})

describe("registry values", () => {
  it("reads a consumer style and preset only through a registry that has them", () => {
    const read = from({ "theme-style": "ink", "theme-preset": "night" })
    expect(readStoredAxes(read, consumer)).toEqual({
      style: "ink",
      preset: "night",
    })
    expect(readStoredAxes(read)).toEqual({})
  })

  it("keeps a synced consumer style and preset only under a registry that has them", () => {
    const payload = { style: "ink", preset: "night", density: "compact" }
    expect(sanitizeSettings(payload, consumer)).toEqual(payload)
    expect(sanitizeSettings(payload)).toEqual({ density: "compact" })
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
        glassTransparency: "high",
        glassBlur: "cloudy",
        presetAxisValues: { glass: { blur: "high" } },
      }),
    ).toEqual({ glassTransparency: "high" })
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
