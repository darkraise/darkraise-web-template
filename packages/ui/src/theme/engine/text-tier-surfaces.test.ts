import { describe, it, expect } from "vitest"
import { contrastRatio } from "@theme/engine/oklch"
import {
  comboName,
  finalTokens,
  isOpaque,
  reachableCombos,
} from "../../test/contrast-matrix"

function failuresFor(token: string, surfaces: readonly string[]): string[] {
  const failures: string[] = []
  for (const combo of reachableCombos()) {
    const tokens = finalTokens(combo)
    const text = tokens[token] as string
    for (const surface of surfaces) {
      const ground = tokens[surface]
      if (!isOpaque(ground)) continue
      const ratio = contrastRatio(text, ground)
      if (ratio < 4.5) {
        failures.push(
          `${comboName(combo)} ${token} on ${surface}: ${ratio.toFixed(2)}`,
        )
      }
    }
  }
  return failures
}

describe("text tiers on every surface they sit on", () => {
  const ALL = ["--background", "--card", "--popover", "--muted"] as const

  it("--foreground clears 4.5:1 on every opaque surface", () => {
    expect(failuresFor("--foreground", ALL)).toEqual([])
  }, 30_000)

  it("--muted-foreground clears 4.5:1 on every opaque surface", () => {
    expect(failuresFor("--muted-foreground", ALL)).toEqual([])
  })

  // Not on --muted: solving against it made --legend nearly equal to
  // --muted-foreground in dark mode. Its one consumer sits in a popover.
  it("--legend clears 4.5:1 on page, card and popover", () => {
    expect(
      failuresFor("--legend", ["--background", "--card", "--popover"]),
    ).toEqual([])
  })

  it("--muted-foreground stays stronger than --legend against the page", () => {
    for (const combo of reachableCombos()) {
      const tokens = finalTokens(combo)
      const page = tokens["--background"] as string
      expect(
        contrastRatio(tokens["--muted-foreground"] as string, page),
        comboName(combo),
      ).toBeGreaterThan(contrastRatio(tokens["--legend"] as string, page))
    }
  })
})
