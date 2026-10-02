import { describe, it, expect } from "vitest"
import {
  applyBorderIntensity,
  generateTokens,
} from "@theme/engine/generateTokens"
import type { BorderIntensity } from "@theme/types"

const lightness = (hsl: string) => parseFloat(hsl.split(" ")[2] ?? "0")

const lightTokens = generateTokens({
  accentColor: "blue",
  surfaceColor: "slate",
  preset: "default",
  backgroundStyle: "solid",
  mode: "light",
  contrast: "standard",
  darkAccentChroma: "standard",
  tintWithAccent: false,
})

const darkTokens = generateTokens({
  accentColor: "blue",
  surfaceColor: "slate",
  preset: "default",
  backgroundStyle: "solid",
  mode: "dark",
  contrast: "standard",
  darkAccentChroma: "standard",
  tintWithAccent: false,
})

const borderAt = (tokens: Record<string, string>, intensity: BorderIntensity) =>
  lightness(applyBorderIntensity(tokens, intensity)["--border"] ?? "")

describe("applyBorderIntensity", () => {
  it("leaves the recipe untouched at balanced", () => {
    expect(applyBorderIntensity(lightTokens, "balanced")).toBe(lightTokens)
  })

  it("moves the light border away from the page as intensity rises", () => {
    const steps = (["subtle", "balanced", "strong", "bold"] as const).map(
      (step) => borderAt(lightTokens, step),
    )
    expect(steps).toEqual([...steps].sort((a, b) => b - a))
    expect(new Set(steps).size).toBe(4)
  })

  it("moves the dark border away from the page as intensity rises", () => {
    const steps = (["subtle", "balanced", "strong", "bold"] as const).map(
      (step) => borderAt(darkTokens, step),
    )
    expect(steps).toEqual([...steps].sort((a, b) => a - b))
    expect(new Set(steps).size).toBe(4)
  })

  it("rewrites every border tier and the input outline", () => {
    const bold = applyBorderIntensity(lightTokens, "bold")
    for (const key of [
      "--border",
      "--input",
      "--border-subtle",
      "--border-default",
      "--border-strong",
      "--sidebar-border",
    ]) {
      expect(bold[key], key).not.toBe(lightTokens[key])
    }
    expect(bold["--background"]).toBe(lightTokens["--background"])
  })

  it("scales a translucent border's alpha instead of blending it", () => {
    const tokens = { ...darkTokens, "--border": "0 0% 100% / 0.1" }
    expect(applyBorderIntensity(tokens, "subtle")["--border"]).toBe(
      "0 0% 100% / 0.06",
    )
    expect(applyBorderIntensity(tokens, "bold")["--border"]).toBe(
      "0 0% 100% / 0.25",
    )
  })

  it("passes through a value it cannot parse", () => {
    const tokens = { ...lightTokens, "--border": "var(--fog-15)" }
    expect(applyBorderIntensity(tokens, "bold")["--border"]).toBe(
      "var(--fog-15)",
    )
  })
})
