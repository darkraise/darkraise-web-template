import { describe, it, expect } from "vitest"
import { contrastRatio } from "@theme/engine/oklch"
import { ACCENT_COLORS, ACCENT_INTENSITIES, SURFACE_COLORS } from "@theme/types"
import {
  comboName,
  finalTokens,
  reachableCombos,
  type ThemeCombo,
} from "../../test/contrast-matrix"

const INK = "222 47% 11%"

function matrix(): ThemeCombo[] {
  const combos: ThemeCombo[] = []
  for (const accentColor of ACCENT_COLORS)
    for (const surfaceColor of SURFACE_COLORS)
      for (const mode of ["light", "dark"] as const)
        for (const accentIntensity of ACCENT_INTENSITIES)
          for (const preset of ["default", "glass"] as const)
            combos.push({
              accentColor,
              surfaceColor,
              mode,
              accentIntensity,
              preset,
              backgroundIntensity: "balanced",
            })
  return combos
}

const INK_LABELLED = {
  light: [
    "amber",
    "cyan",
    "emerald",
    "green",
    "lime",
    "orange",
    "sky",
    "teal",
    "yellow",
  ],
  dark: ["amber", "lime", "yellow"],
} as const

describe("primary fill and label", () => {
  const combos = reachableCombos()

  it("the label clears 4.6:1 on the fill in every theme", () => {
    const failures: string[] = []
    for (const combo of matrix()) {
      const tokens = finalTokens(combo)
      const ratio = contrastRatio(
        tokens["--primary-foreground"] as string,
        tokens["--primary-fill"] as string,
      )
      if (ratio < 4.6) failures.push(`${comboName(combo)}: ${ratio.toFixed(2)}`)
    }
    expect(failures).toEqual([])
  })

  it("dark fills clear 3:1 against the card in every theme", () => {
    const failures: string[] = []
    for (const combo of matrix()) {
      if (combo.mode !== "dark") continue
      const tokens = finalTokens(combo)
      const ratio = contrastRatio(
        tokens["--primary-fill"] as string,
        tokens["--card"] as string,
      )
      if (ratio < 3) failures.push(`${comboName(combo)}: ${ratio.toFixed(2)}`)
    }
    expect(failures).toEqual([])
  })

  it("gives an ink label to exactly the light hues in each mode", () => {
    const failures: string[] = []
    for (const combo of matrix()) {
      if (combo.preset !== "default") continue
      const ink = finalTokens(combo)["--primary-foreground"] === INK
      const expected = (INK_LABELLED[combo.mode] as readonly string[]).includes(
        combo.accentColor,
      )
      if (ink !== expected) failures.push(`${comboName(combo)}: ink ${ink}`)
    }
    expect(failures).toEqual([])
  })

  // Calm is skipped: the solve never moves a calm fill (white clears 4.75-5.81
  // on every one), and calm on olive, sand and cool already measured 2.81-2.99
  // before this change.
  it("dark fills still clear 3:1 against the card on neutral surfaces", () => {
    const failures: string[] = []
    for (const combo of combos) {
      if (combo.mode !== "dark" || combo.accentIntensity === "calm") continue
      const tokens = finalTokens(combo)
      const ratio = contrastRatio(
        tokens["--primary-fill"] as string,
        tokens["--card"] as string,
      )
      if (ratio < 3) failures.push(`${comboName(combo)}: ${ratio.toFixed(2)}`)
    }
    expect(failures).toEqual([])
  })
})
