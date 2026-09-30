import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { contrastRatio } from "@theme/engine/oklch"
import {
  comboName,
  finalTokens,
  isOpaque,
  reachableCombos,
} from "../../test/contrast-matrix"

describe("primary text", () => {
  const combos = reachableCombos()

  it("clears 4.5:1 against the page and the card", () => {
    const failures: string[] = []
    for (const combo of combos) {
      const tokens = finalTokens(combo)
      const text = tokens["--primary-text"]
      if (!isOpaque(text)) {
        failures.push(`${comboName(combo)}: --primary-text is ${text}`)
        continue
      }
      for (const surface of ["--background", "--card"]) {
        const ground = tokens[surface]
        if (!isOpaque(ground)) continue
        const ratio = contrastRatio(text, ground)
        if (ratio < 4.5) {
          failures.push(`${comboName(combo)} on ${surface}: ${ratio.toFixed(2)}`)
        }
      }
    }
    expect(failures).toEqual([])
  })

  it("leaves --primary on its 3:1 mark floor", () => {
    for (const combo of combos) {
      const tokens = finalTokens(combo)
      expect(
        contrastRatio(
          tokens["--primary"] as string,
          tokens["--background"] as string,
        ),
        comboName(combo),
      ).toBeGreaterThanOrEqual(3)
    }
  })

  it("is registered as a Tailwind colour", () => {
    const theme = readFileSync("src/styles/theme.css", "utf8")
    expect(theme).toContain("--color-primary-text: hsl(var(--primary-text));")
  })
})
