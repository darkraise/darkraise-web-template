import { describe, it, expect } from "vitest"
import {
  controlWells,
  mixHsl,
  generateTokens,
} from "@theme/engine/generateTokens"

const lightness = (hsl: string) => parseFloat(hsl.split(" ")[2] ?? "0")

// The two rungs the default preset hands the axis: surface[900] / surface[950]
// in dark, white / surface[100] in light.
const DARK_RAISED = "222 47% 11%"
const DARK_SUNKEN = "229 84% 5%"
const LIGHT_RAISED = "0 0% 100%"
const LIGHT_SUNKEN = "210 40% 96%"

describe("mixHsl", () => {
  it("interpolates each channel at the midpoint", () => {
    expect(mixHsl("200 40% 20%", "220 60% 40%", 0.5)).toBe("210 50% 30%")
  })

  it("returns each end unchanged at t=0 and t=1", () => {
    expect(mixHsl(DARK_RAISED, DARK_SUNKEN, 0)).toBe("222 47% 11%")
    expect(mixHsl(DARK_RAISED, DARK_SUNKEN, 1)).toBe("229 84% 5%")
  })

  // White is stored as `0 0% 100%`. Interpolating from that hue would drag a
  // light field's midpoint toward red instead of leaving it on the surface
  // colour, so an achromatic end yields to the chromatic one.
  it("takes the chromatic hue when one end has no saturation", () => {
    expect(mixHsl(LIGHT_RAISED, LIGHT_SUNKEN, 0.5)).toBe("210 20% 98%")
    expect(mixHsl(LIGHT_SUNKEN, LIGHT_RAISED, 0.5)).toBe("210 20% 98%")
  })
})

describe("controlWells", () => {
  it("puts subtle between the two rungs it is derived from", () => {
    const { subtle } = controlWells(DARK_RAISED, DARK_SUNKEN)
    expect(lightness(subtle)).toBeGreaterThan(lightness(DARK_SUNKEN))
    expect(lightness(subtle)).toBeLessThan(lightness(DARK_RAISED))
  })

  it("puts deep below the sunken rung", () => {
    for (const [raised, sunken] of [
      [DARK_RAISED, DARK_SUNKEN],
      [LIGHT_RAISED, LIGHT_SUNKEN],
    ]) {
      const { deep } = controlWells(raised, sunken)
      expect(lightness(deep)).toBeLessThan(lightness(sunken))
    }
  })

  it("keeps the sunken hue and saturation on deep", () => {
    const { deep } = controlWells(DARK_RAISED, DARK_SUNKEN)
    expect(deep.startsWith("229 84%")).toBe(true)
  })

  // Light has headroom under its sunken rung, so deep continues by the full
  // raised→sunken distance: 96 − (100 − 96) = 92.
  it("extrapolates by a full rung where there is headroom", () => {
    expect(controlWells(LIGHT_RAISED, LIGHT_SUNKEN).deep).toBe("210 40% 92%")
  })

  // Dark has almost none — 5 − (11 − 5) is negative — so the floor at 40% of
  // the sunken lightness keeps a hued well instead of a black hole.
  it("floors deep rather than going negative in dark", () => {
    const { deep } = controlWells(DARK_RAISED, DARK_SUNKEN)
    expect(lightness(deep)).toBe(2)
    expect(lightness(deep)).toBeGreaterThan(0)
  })
})

describe("--control-well-* tokens", () => {
  const tokens = (mode: "light" | "dark") =>
    generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode,
      accentIntensity: "balanced",
    })

  it("are emitted in both modes without any axis input", () => {
    for (const mode of ["light", "dark"] as const) {
      const t = tokens(mode)
      expect(t["--control-well-subtle"]).toBeTruthy()
      expect(t["--control-well-deep"]).toBeTruthy()
    }
  })

  it("bracket the sunken rung in dark", () => {
    const t = tokens("dark")
    const sunken = lightness(t["--surface-sunken"] ?? "")
    expect(lightness(t["--control-well-subtle"] ?? "")).toBeGreaterThan(sunken)
    expect(lightness(t["--control-well-deep"] ?? "")).toBeLessThan(sunken)
  })
})
