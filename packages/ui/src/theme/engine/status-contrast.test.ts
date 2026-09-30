import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { contrastRatio } from "@theme/engine/oklch"
import { isAccentSurface } from "@theme/engine/generateTokens"
import {
  comboName,
  finalTokens,
  isOpaque,
  reachableCombos,
} from "../../test/contrast-matrix"

const STATUSES = ["destructive", "success", "warning", "info"] as const

describe("status colours", () => {
  const combos = reachableCombos()

  it("clear 4.5:1 against page and card, with labels at 4.5:1 on them", () => {
    const failures: string[] = []
    for (const combo of combos) {
      const tokens = finalTokens(combo)
      for (const status of STATUSES) {
        const value = tokens[`--${status}`] as string
        for (const surface of ["--background", "--card"]) {
          const ground = tokens[surface]
          if (!isOpaque(ground)) continue
          const ratio = contrastRatio(value, ground)
          if (ratio < 4.5) {
            failures.push(`${comboName(combo)} ${status} on ${surface}: ${ratio.toFixed(2)}`)
          }
        }
        const label = contrastRatio(
          tokens[`--${status}-foreground`] as string,
          value,
        )
        if (label < 4.5) {
          failures.push(`${comboName(combo)} ${status} label: ${label.toFixed(2)}`)
        }
      }
    }
    expect(failures).toEqual([])
  })

  it("the destructive solid carries a white label at 4.5:1", () => {
    const failures: string[] = []
    for (const combo of combos) {
      const tokens = finalTokens(combo)
      expect(tokens["--destructive-solid-foreground"]).toBe("0 0% 100%")
      const ratio = contrastRatio(
        "0 0% 100%",
        tokens["--destructive-solid"] as string,
      )
      if (ratio < 4.5) failures.push(`${comboName(combo)}: ${ratio.toFixed(2)}`)
    }
    expect(failures).toEqual([])
  })

  // If this fails, stop and report: the spec requires a decision before the
  // solve changes. Neutral surfaces only, as for the primary fill.
  it("the dark destructive solid clears 3:1 against the card on neutral surfaces", () => {
    const failures: string[] = []
    for (const combo of combos) {
      if (combo.mode !== "dark" || isAccentSurface(combo.surfaceColor)) continue
      const tokens = finalTokens(combo)
      const ratio = contrastRatio(
        tokens["--destructive-solid"] as string,
        tokens["--card"] as string,
      )
      if (ratio < 3) failures.push(`${comboName(combo)}: ${ratio.toFixed(2)}`)
    }
    expect(failures).toEqual([])
  })

  it("both focus rings clear 3:1 against the page", () => {
    const failures: string[] = []
    for (const combo of combos) {
      const tokens = finalTokens(combo)
      for (const ring of ["--ring", "--focus-ring"]) {
        const ratio = contrastRatio(
          tokens[ring] as string,
          tokens["--background"] as string,
        )
        if (ratio < 3) failures.push(`${comboName(combo)} ${ring}: ${ratio.toFixed(2)}`)
      }
    }
    expect(failures).toEqual([])
  })

  it("registers the destructive solid pair as Tailwind colours", () => {
    const theme = readFileSync("src/styles/theme.css", "utf8")
    expect(theme).toContain(
      "--color-destructive-solid: hsl(var(--destructive-solid));",
    )
    expect(theme).toContain(
      "--color-destructive-solid-foreground: hsl(var(--destructive-solid-foreground));",
    )
  })
})
