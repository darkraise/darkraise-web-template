import { describe, expect, it } from "vitest"
import { composite, contrastRatio } from "@theme/engine/oklch"
import {
  contentStripGround,
  generateTokens,
  gradientCanvasPeak,
} from "@theme/engine/generateTokens"
import { comboName, reachableCombos } from "../../test/contrast-matrix"
import { surfaceColors } from "@theme/palettes/surfaceColors"

const STRIP_FLOORS = [
  ["--field-edge-color", 3],
  ["--primary", 3],
  ["--ring", 3],
  ["--focus-ring", 3],
  ["--primary-text", 4.5],
  ["--muted-foreground", 4.5],
] as const

// Recorded from the step engine on 2026-10-02. Solid themes paint no content
// strip and must not move.
const UNCHANGED = [
  [
    false,
    "solid",
    "light",
    "neutral",
    {
      "--primary": "217 91% 60%",
      "--ring": "217 91% 60%",
      "--focus-ring": "212 96% 60%",
      "--primary-text": "217 91% 42%",
      "--muted-foreground": "215 16% 35%",
      "--content-gradient-overlay": "none",
    },
  ],
  [
    false,
    "solid",
    "light",
    "intense",
    {
      "--primary": "217 91% 60%",
      "--ring": "217 91% 60%",
      "--focus-ring": "212 96% 59%",
      "--primary-text": "217 91% 42%",
      "--muted-foreground": "215 16% 35%",
      "--content-gradient-overlay": "none",
    },
  ],
  [
    false,
    "solid",
    "dark",
    "neutral",
    {
      "--primary": "217 91% 60%",
      "--ring": "217 91% 60%",
      "--focus-ring": "213 97% 87%",
      "--primary-text": "217 91% 73%",
      "--muted-foreground": "215 16% 63%",
      "--content-gradient-overlay": "none",
    },
  ],
  [
    false,
    "solid",
    "dark",
    "intense",
    {
      "--primary": "217 91% 60%",
      "--ring": "217 91% 60%",
      "--focus-ring": "213 97% 87%",
      "--primary-text": "217 91% 73%",
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

  it("leaves themes without a strip as they were", () => {
    for (const [
      frosted,
      backgroundStyle,
      mode,
      backgroundIntensity,
      expected,
    ] of UNCHANGED) {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        frosted,
        backgroundStyle,
        mode,
        contrast: "standard",
        darkAccentChroma: "standard",
        tintWithAccent: false,
        backgroundIntensity,
      })
      const actual = Object.fromEntries(
        Object.keys(expected).map((name) => [name, tokens[name]]),
      )
      expect(
        actual,
        `${frosted ? "frosted" : "plain"} ${backgroundStyle} ${mode} ${backgroundIntensity}`,
      ).toEqual(expected)
    }
  })

  it("solves marks, the field edge and text against it on every unfrosted gradient theme", () => {
    const failures: string[] = []
    for (const combo of reachableCombos()) {
      if (combo.frosted) continue
      const tokens = generateTokens({
        ...combo,
        tintWithAccent: false,
        backgroundStyle: "gradient",
      })
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
  }, 30_000)

  it("solves marks and the field edge against the canvas peak on every frosted gradient theme", () => {
    const failures: string[] = []
    for (const combo of reachableCombos()) {
      if (!combo.frosted) continue
      const tokens = generateTokens({
        ...combo,
        tintWithAccent: false,
        backgroundStyle: "gradient",
      })
      expect(tokens["--content-gradient-overlay"]).toBe("none")
      const peak = gradientCanvasPeak(
        tokens["--background"] as string,
        surfaceColors[combo.surfaceColor][500],
        combo.mode,
        combo.backgroundIntensity,
      )
      for (const name of ["--field-edge-color", "--primary", "--ring"]) {
        const ratio = contrastRatio(tokens[name] as string, peak)
        if (ratio < 3)
          failures.push(`${comboName(combo)} ${name}: ${ratio.toFixed(2)}`)
      }
    }
    expect(failures.slice(0, 20)).toEqual([])
  }, 30_000)
})
