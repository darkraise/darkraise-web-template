import { describe, expect, it } from "vitest"
import { composite, contrastRatio } from "@theme/engine/oklch"
import {
  contentStripGround,
  generateTokens,
  gradientCanvasPeak,
} from "@theme/engine/generateTokens"
import { comboName, reachableCombos } from "../../test/contrast-matrix"

const STRIP_FLOORS = [
  ["--field-edge-color", 3],
  ["--primary", 3],
  ["--ring", 3],
  ["--focus-ring", 3],
  ["--primary-text", 4.5],
  ["--muted-foreground", 4.5],
] as const

// Recorded from master on 2026-10-02 before the strip solve existed. Themes
// that paint no content strip must not move.
const UNCHANGED = [
  [
    "default",
    "solid",
    "light",
    "neutral",
    {
      "--primary": "217 91% 60%",
      "--ring": "217 91% 60%",
      "--focus-ring": "212 96% 60%",
      "--primary-text": "217 91% 44%",
      "--muted-foreground": "215 16% 35%",
      "--content-gradient-overlay": "none",
    },
  ],
  [
    "default",
    "solid",
    "light",
    "intense",
    {
      "--primary": "217 91% 60%",
      "--ring": "217 91% 60%",
      "--focus-ring": "212 96% 59%",
      "--primary-text": "217 91% 44%",
      "--muted-foreground": "215 16% 35%",
      "--content-gradient-overlay": "none",
    },
  ],
  [
    "default",
    "solid",
    "dark",
    "neutral",
    {
      "--primary": "217 91% 60%",
      "--ring": "217 91% 60%",
      "--focus-ring": "213 97% 87%",
      "--primary-text": "217 91% 67%",
      "--muted-foreground": "215 16% 63%",
      "--content-gradient-overlay": "none",
    },
  ],
  [
    "default",
    "solid",
    "dark",
    "intense",
    {
      "--primary": "217 91% 60%",
      "--ring": "217 91% 60%",
      "--focus-ring": "213 97% 87%",
      "--primary-text": "217 91% 67%",
      "--muted-foreground": "215 16% 62%",
      "--content-gradient-overlay": "none",
    },
  ],
  [
    "glass",
    "gradient",
    "light",
    "neutral",
    {
      "--primary": "221 83% 53%",
      "--ring": "221 83% 53%",
      "--focus-ring": "212 96% 60%",
      "--primary-text": "221 83% 45%",
      "--muted-foreground": "215 16% 35%",
      "--content-gradient-overlay": "none",
    },
  ],
  [
    "glass",
    "gradient",
    "light",
    "intense",
    {
      "--primary": "221 83% 53%",
      "--ring": "221 83% 53%",
      "--focus-ring": "212 96% 59%",
      "--primary-text": "221 83% 45%",
      "--muted-foreground": "215 16% 35%",
      "--content-gradient-overlay": "none",
    },
  ],
  [
    "glass",
    "gradient",
    "dark",
    "neutral",
    {
      "--primary": "213 94% 68%",
      "--ring": "213 94% 68%",
      "--focus-ring": "213 97% 87%",
      "--primary-text": "213 94% 68%",
      "--muted-foreground": "215 16% 63%",
      "--content-gradient-overlay": "none",
    },
  ],
  [
    "glass",
    "gradient",
    "dark",
    "intense",
    {
      "--primary": "213 94% 68%",
      "--ring": "213 94% 68%",
      "--focus-ring": "213 97% 87%",
      "--primary-text": "213 94% 68%",
      "--muted-foreground": "215 16% 62%",
      "--content-gradient-overlay": "none",
    },
  ],
] as const

describe("the content strip", () => {
  it("is the canvas peak in light mode and 4% more surface hue in dark", () => {
    const background = "210 40% 98%"
    const hue = "215 16% 47%"
    expect(contentStripGround(background, hue, "light", "intense")).toBe(
      gradientCanvasPeak(background, hue, "light", "intense"),
    )
    expect(contentStripGround("222 47% 5%", hue, "dark", "intense")).toBe(
      composite(
        gradientCanvasPeak("222 47% 5%", hue, "dark", "intense"),
        hue,
        0.04,
      ),
    )
  })

  it("is painted exactly under the default preset with a gradient", () => {
    for (const preset of ["default", "glass"] as const) {
      for (const backgroundStyle of ["solid", "gradient"] as const) {
        const tokens = generateTokens({
          accentColor: "blue",
          surfaceColor: "slate",
          preset,
          backgroundStyle,
          mode: "light",
          accentIntensity: "balanced",
          backgroundIntensity: "balanced",
        })
        const paints = preset === "default" && backgroundStyle === "gradient"
        expect(
          tokens["--content-gradient-overlay"] !== "none",
          `${preset} ${backgroundStyle}`,
        ).toBe(paints)
      }
    }
  })

  it("leaves themes without a strip as they were", () => {
    for (const [
      preset,
      backgroundStyle,
      mode,
      backgroundIntensity,
      expected,
    ] of UNCHANGED) {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        preset,
        backgroundStyle,
        mode,
        accentIntensity: "balanced",
        backgroundIntensity,
      })
      const actual = Object.fromEntries(
        Object.keys(expected).map((name) => [name, tokens[name]]),
      )
      expect(
        actual,
        `${preset} ${backgroundStyle} ${mode} ${backgroundIntensity}`,
      ).toEqual(expected)
    }
  })

  it("solves marks, the field edge and text against it on every default gradient theme", () => {
    const failures: string[] = []
    for (const combo of reachableCombos()) {
      if (combo.preset !== "default") continue
      const tokens = generateTokens({ ...combo, backgroundStyle: "gradient" })
      const background = tokens["--background"] as string
      const strip = contentStripGround(
        background,
        tokens["--surface-tint"] as string,
        combo.mode,
        combo.backgroundIntensity,
      )
      for (const [name, floor] of STRIP_FLOORS) {
        const ratio = contrastRatio(tokens[name] as string, strip)
        if (ratio < floor) {
          failures.push(`${comboName(combo)} ${name}: ${ratio.toFixed(2)}`)
        }
      }
      const muted = contrastRatio(
        tokens["--muted-foreground"] as string,
        background,
      )
      if (muted < 7)
        failures.push(`${comboName(combo)} muted on page: ${muted.toFixed(2)}`)
    }
    expect(failures.slice(0, 20)).toEqual([])
  })
})
