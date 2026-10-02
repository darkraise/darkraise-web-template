import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { composite, contrastRatio } from "@theme/engine/oklch"
import {
  comboName,
  finalTokens,
  isOpaque,
  reachableCombos,
} from "../../test/contrast-matrix"

const STATUSES = ["destructive", "success", "warning", "info"] as const

describe("status colours", () => {
  const combos = reachableCombos()

  it("status text clears 4.5:1 on its subtle fill, page and card", () => {
    const failures: string[] = []
    for (const combo of combos) {
      const tokens = finalTokens(combo)
      for (const status of STATUSES) {
        const value = tokens[`--${status}-text`] as string
        for (const surface of [
          `--${status}-subtle`,
          "--background",
          "--card",
        ]) {
          const ground = tokens[surface]
          if (!isOpaque(ground)) continue
          const ratio = contrastRatio(value, ground)
          if (ratio < 4.5) {
            failures.push(
              `${comboName(combo)} ${status} on ${surface}: ${ratio.toFixed(2)}`,
            )
          }
        }
      }
    }
    expect(failures).toEqual([])
  }, 30_000)

  it("body text and muted text clear 4.5:1 on every subtle fill", () => {
    const failures: string[] = []
    for (const combo of combos) {
      const tokens = finalTokens(combo)
      for (const status of STATUSES) {
        const ground = tokens[`--${status}-subtle`]
        if (!isOpaque(ground)) continue
        for (const token of ["--foreground", "--muted-foreground"]) {
          const ratio = contrastRatio(tokens[token] as string, ground)
          if (ratio < 4.5) {
            failures.push(
              `${comboName(combo)} ${status} ${token} on subtle: ${ratio.toFixed(2)}`,
            )
          }
        }
      }
    }
    expect(failures).toEqual([])
  })

  it("status edges clear 3:1 on page, card and their subtle fill", () => {
    const failures: string[] = []
    for (const combo of combos) {
      const tokens = finalTokens(combo)
      for (const status of STATUSES) {
        const edge = tokens[`--${status}-edge`] as string
        for (const surface of [
          "--background",
          "--card",
          `--${status}-subtle`,
        ]) {
          const ground = tokens[surface]
          if (!isOpaque(ground)) continue
          const ratio = contrastRatio(edge, ground)
          if (ratio < 3) {
            failures.push(
              `${comboName(combo)} ${status} edge on ${surface}: ${ratio.toFixed(2)}`,
            )
          }
        }
      }
    }
    expect(failures).toEqual([])
  })

  it("the toast countdown bar clears 3:1 on its track and the toast fill", () => {
    const css = readFileSync("src/components/sonner/sonner.css", "utf8")
    expect(css).toMatch(
      /\.dr-toast-progress-fill \{[^}]*background-color: hsl\(var\(--toast-text, var\(--muted-foreground\)\)\);/,
    )
    const track =
      /\.dr-toast-progress \{[^}]*background-color: hsl\(var\(--toast-accent, var\(--muted-foreground\)\) \/ ([\d.]+)\);/.exec(
        css,
      )
    expect(track).not.toBeNull()
    const trackAlpha = Number(track?.[1])
    const failures: string[] = []
    for (const combo of reachableCombos()) {
      const tokens = finalTokens(combo)
      const kinds: [string, string, string, string][] = STATUSES.map(
        (status) => [
          status,
          tokens[`--${status}-text`] as string,
          tokens[`--${status}-edge`] as string,
          tokens[`--${status}-subtle`] as string,
        ],
      )
      const muted = tokens["--muted-foreground"] as string
      kinds.push(["plain", muted, muted, tokens["--popover"] as string])
      for (const [kind, bar, accent, ground] of kinds) {
        if (!isOpaque(ground)) continue
        for (const [name, under] of [
          ["fill", ground],
          ["track", composite(ground, accent, trackAlpha)],
        ] as const) {
          const ratio = contrastRatio(bar, under)
          if (ratio < 3)
            failures.push(
              `${comboName(combo)} ${kind} bar on ${name}: ${ratio.toFixed(2)}`,
            )
        }
      }
    }
    expect(failures).toEqual([])
  }, 30_000)

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
  // solve changes.
  it("the dark destructive solid clears 3:1 against the card on neutral surfaces", () => {
    const failures: string[] = []
    for (const combo of combos) {
      if (combo.mode !== "dark") continue
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
        if (ratio < 3)
          failures.push(`${comboName(combo)} ${ring}: ${ratio.toFixed(2)}`)
      }
    }
    expect(failures).toEqual([])
  })

  it("registers the destructive solid pair as Tailwind colours", () => {
    const theme = readFileSync("src/styles/theme.css", "utf8")
    expect(theme).toContain(
      "--color-destructive-solid: hsl(var(--destructive-solid));",
    )
    expect(theme).toMatch(
      /--color-destructive-solid-foreground:\s*hsl\(\s*var\(--destructive-solid-foreground\)\s*\);/,
    )
  })
})
