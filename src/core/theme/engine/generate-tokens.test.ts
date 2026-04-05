import { describe, it, expect } from "vitest"
import { generateTokens } from "./generate-tokens"

describe("generateTokens", () => {
  it("produces all expected token keys for the default combination", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "light",
    })

    const expectedKeys = [
      "--primary",
      "--primary-foreground",
      "--ring",
      "--chart-1",
      "--chart-2",
      "--chart-3",
      "--chart-4",
      "--chart-5",
      "--background",
      "--foreground",
      "--card",
      "--card-foreground",
      "--popover",
      "--popover-foreground",
      "--secondary",
      "--secondary-foreground",
      "--muted",
      "--muted-foreground",
      "--accent",
      "--accent-foreground",
      "--destructive",
      "--destructive-foreground",
      "--border",
      "--input",
      "--surface-base",
      "--surface-raised",
      "--surface-overlay",
      "--surface-sunken",
      "--surface-sidebar",
      "--surface-header",
      "--border-subtle",
      "--border-default",
      "--radius",
      "--shadow-card",
      "--shadow-dropdown",
      "--backdrop-blur",
      "--surface-opacity",
      "--theme-font-heading",
    ]

    for (const key of expectedKeys) {
      expect(tokens).toHaveProperty(key)
      expect(tokens[key]).toBeTruthy()
    }
  })

  it("uses shade 500 for primary in light mode and shade 400 in dark mode", () => {
    const light = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "light",
    })
    const dark = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "dark",
    })

    expect(light["--primary"]).toBe("217 91% 60%")
    expect(dark["--primary"]).toBe("213 94% 68%")
  })

  it("uses dark foreground for light accent colors (amber, yellow, lime)", () => {
    const amber = generateTokens({
      accentColor: "amber",
      surfaceColor: "slate",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "light",
    })
    expect(amber["--primary-foreground"]).toBe("21 92% 14%")

    const blue = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "light",
    })
    expect(blue["--primary-foreground"]).toBe("0 0% 100%")
  })

  it("dark mode flips background to step 950 and foreground to step 50", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "dark",
    })

    expect(tokens["--background"]).toBe("229 84% 5%")
    expect(tokens["--foreground"]).toBe("210 40% 98%")
  })

  it("derives chart colors from evenly spaced accent palettes", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "light",
    })

    expect(tokens["--chart-1"]).toBeTruthy()
    expect(tokens["--chart-2"]).toBeTruthy()
    expect(tokens["--chart-3"]).toBeTruthy()
    expect(tokens["--chart-4"]).toBeTruthy()
    expect(tokens["--chart-5"]).toBeTruthy()

    const allDifferentOrValid = new Set([
      tokens["--chart-1"],
      tokens["--chart-2"],
      tokens["--chart-3"],
      tokens["--chart-4"],
      tokens["--chart-5"],
    ])
    expect(allDifferentOrValid.size).toBe(5)
  })

  it("glassmorphism style sets backdrop-blur and reduced opacity", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "glassmorphism",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "light",
    })

    expect(tokens["--backdrop-blur"]).toBe("12px")
    expect(tokens["--surface-opacity"]).toBe("0.5")
  })

  it("destructive uses red-500 for light and red-600 for dark", () => {
    const light = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "light",
    })
    const dark = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "dark",
    })

    expect(light["--destructive"]).toBe("0 84% 60%")
    expect(dark["--destructive"]).toBe("0 72% 51%")
  })

  it("emits font tokens for the selected font family", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "humanist",
      mode: "light",
    })

    expect(tokens["--theme-font-sans"]).toBe("DM Sans")
    expect(tokens["--theme-font-heading"]).toBe("DM Sans")
    expect(tokens["--theme-font-mono"]).toBe("DM Mono")
  })

  it("uses desaturated accent color scale as surface when surfaceColor is set", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "red",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "light",
    })

    expect(tokens["--background"]).toBe("0 34% 97%")
    expect(tokens["--foreground"]).toBe("222 47% 11%")
  })

  it("surfaceColor slate produces identical tokens to the original behavior", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "light",
    })

    expect(tokens["--background"]).toBe("210 40% 98%")
    expect(tokens["--foreground"]).toBe("222 47% 11%")
  })

  it("dark mode with accent surface color uses shade 950 for background", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "emerald",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "dark",
    })

    expect(tokens["--background"]).toBe("166 32% 5%")
    expect(tokens["--foreground"]).toBe("210 40% 98%")
  })
})
