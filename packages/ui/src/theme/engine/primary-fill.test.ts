import { describe, it, expect } from "vitest"
import { contrastRatio } from "@theme/engine/oklch"
import {
  ACCENT_COLORS,
  DARK_ACCENT_CHROMAS,
  SURFACE_COLORS,
} from "@theme/types"
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
        for (const darkAccentChroma of DARK_ACCENT_CHROMAS)
          for (const tintWithAccent of [false, true])
            for (const frosted of [false, true])
              combos.push({
                accentColor,
                surfaceColor,
                mode,
                contrast: "standard",
                darkAccentChroma,
                tintWithAccent,
                frosted,
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
  dark: ["amber", "lime", "neutral", "yellow"],
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
      const ink = finalTokens(combo)["--primary-foreground"] === INK
      const expected = (INK_LABELLED[combo.mode] as readonly string[]).includes(
        combo.accentColor,
      )
      if (ink !== expected) failures.push(`${comboName(combo)}: ink ${ink}`)
    }
    expect(failures).toEqual([])
  })

  // The matrix above holds contrast and background intensity at their
  // defaults. The white-label solve darkens calm fills too, and their
  // narrowest margin over the card is at high contrast.
  it("dark fills still clear 3:1 against the card on neutral surfaces", () => {
    const failures: string[] = []
    for (const combo of combos) {
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
})
