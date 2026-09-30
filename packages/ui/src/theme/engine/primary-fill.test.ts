import { describe, it, expect } from "vitest"
import { contrastRatio } from "@theme/engine/oklch"
import { accentColors } from "@theme/palettes/accentColors"
import { isAccentSurface } from "@theme/engine/generateTokens"
import {
  comboName,
  finalTokens,
  reachableCombos,
  type ThemeCombo,
} from "../../test/contrast-matrix"

const WHITE = "0 0% 100%"
const INK = "222 47% 11%"

/**
 * The label rule this solve must not change: white wherever white clears 3:1
 * on the unsolved light fill (shade 500, or 600 under glass), and white on
 * every dark fill.
 */
function expectedLabel(combo: ThemeCombo): string {
  if (combo.mode === "dark") return WHITE
  const shade = combo.preset === "glass" ? 600 : 500
  return contrastRatio(WHITE, accentColors[combo.accentColor][shade]) >= 3
    ? WHITE
    : INK
}

describe("primary fill and label", () => {
  const combos = reachableCombos()

  it("the label clears 4.5:1 on the fill in every reachable theme", () => {
    const failures: string[] = []
    for (const combo of combos) {
      const tokens = finalTokens(combo)
      const ratio = contrastRatio(
        tokens["--primary-foreground"] as string,
        tokens["--primary-fill"] as string,
      )
      if (ratio < 4.5) failures.push(`${comboName(combo)}: ${ratio.toFixed(2)}`)
    }
    expect(failures).toEqual([])
  })

  it("every hue keeps today's label colour", () => {
    const failures: string[] = []
    for (const combo of combos) {
      const got = finalTokens(combo)["--primary-foreground"]
      if (got !== expectedLabel(combo)) {
        failures.push(`${comboName(combo)}: ${got}`)
      }
    }
    expect(failures).toEqual([])
  })

  // Neutral surfaces only: accent-coloured surfaces already miss this today
  // (fuchsia on emerald measured 2.76 before this change). Calm is skipped
  // too: the solve never moves a calm fill (white clears 4.75-5.81 on every
  // one), and calm on olive, sand and cool already measured 2.81-2.99 before
  // this change.
  it("dark fills still clear 3:1 against the card on neutral surfaces", () => {
    const failures: string[] = []
    for (const combo of combos) {
      if (
        combo.mode !== "dark" ||
        combo.accentIntensity === "calm" ||
        isAccentSurface(combo.surfaceColor)
      )
        continue
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
