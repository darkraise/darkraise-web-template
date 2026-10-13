import { describe, expect, it } from "vitest"
import { resolveRegistry } from "@theme/config/registry"
import {
  OVERLAY_ALPHA_FLOOR,
  SURFACE_ALPHA_FLOOR,
  TRANSPARENCY_SCALE,
  effectiveAlpha,
} from "@theme/config/transparency"
import { groundColours } from "@theme/engine/groundBlobs"
import { composite, contrastRatio, mixedContrast } from "@theme/engine/oklch"
import { ACCENT_COLORS, GLASS_TRANSPARENCIES } from "@theme/types"
import { finalTokens, presetCombos } from "@test/contrast-matrix"
import { resolvedTokens } from "@test/preset-tokens"

const TEXT = 4.5

const registry = resolveRegistry()
const preset = registry.presets["soft-glass"]
const style = registry.styles[preset?.style ?? ""]
if (!preset || !style) throw new Error("no Soft Glass preset")

/** `hsl(var(--card) / max(floor, calc(var(--surface-alpha) * factor - offset)))`. */
const CHROME =
  /^hsl\(var\(--card\) \/ max\(([\d.]+), calc\(var\(--surface-alpha\) \* ([\d.]+) - ([\d.]+)\)\)\)$/

/** The chrome alpha the preset derives from the effective card alpha. */
function chromeAlpha(fill: string | undefined, card: number): number {
  const match = CHROME.exec(fill ?? "")
  if (!match) throw new Error(`unexpected chrome fill ${fill}`)
  const [floor, factor, offset] = match.slice(1).map(Number) as [
    number,
    number,
    number,
  ]
  return Math.max(floor, card * factor - offset)
}

// The preset in each mode as the provider paints it, under every accent a
// user can pick, at every transparency step.
const CASES = presetCombos()
  .filter((combo) => combo.preset === preset.name)
  .flatMap((combo) =>
    ACCENT_COLORS.flatMap((accentColor) =>
      GLASS_TRANSPARENCIES.map(
        (step) =>
          [
            `${combo.mode} ${accentColor} ${step}`,
            { ...combo, accentColor },
            step,
          ] as const,
      ),
    ),
  )

describe("Soft Glass over its blobs", () => {
  it("covers both modes, every accent and every transparency step", () => {
    expect(CASES).toHaveLength(
      2 * ACCENT_COLORS.length * GLASS_TRANSPARENCIES.length,
    )
  })

  it.each(CASES)("holds text at 4.5:1 · %s", (_name, combo, step) => {
    const tokens = finalTokens(combo)
    const at = (key: string): string => {
      const value = tokens[key]
      if (value === undefined) throw new Error(`no ${key}`)
      return value
    }
    const declared = resolvedTokens(style.tokens, preset.tokens, combo.mode)
    const scale = TRANSPARENCY_SCALE[step]
    const card = effectiveAlpha(
      Number(declared.surfaceFillAlpha),
      scale,
      SURFACE_ALPHA_FLOOR,
    )
    const overlay = effectiveAlpha(
      Number(declared.overlayFillAlpha),
      scale,
      OVERLAY_ALPHA_FLOOR,
    )
    expect(declared.chromeBarFill).toBe(declared.chromeRailFill)
    const chrome = chromeAlpha(declared.chromeRailFill, card)

    const { blobs, tint } = groundColours(at("--primary"), combo.mode)
    const grounds = [...blobs, tint, at("--background")]
    const failures: string[] = []
    const hold = (
      surface: string,
      texts: readonly string[],
      fill: string,
      alpha: number,
      under: readonly string[] = grounds,
    ) => {
      for (const text of texts) {
        for (const ground of under) {
          const ratio = mixedContrast(at(text), ground, at(fill), alpha)
          if (ratio < TEXT) {
            failures.push(
              `${surface} ${text} over ${ground}: ${ratio.toFixed(2)}`,
            )
          }
        }
      }
    }
    hold("card", ["--foreground", "--muted-foreground"], "--card", card)
    hold(
      "chrome",
      [
        "--foreground",
        "--muted-foreground",
        "--sidebar-foreground",
        "--sidebar-foreground-muted",
      ],
      "--card",
      chrome,
    )
    // A popover or dialog can open over a card, the muted plane or the
    // translucent chrome as well as the bare ground.
    const chromeFaces = grounds.map((ground) =>
      composite(ground, at("--card"), chrome),
    )
    hold(
      "overlay",
      ["--popover-foreground", "--muted-foreground"],
      "--popover",
      overlay,
      [...grounds, at("--card"), at("--muted"), ...chromeFaces],
    )
    // The current nav row is Soft Glass's chip: the rail's own ink at a low
    // alpha over the rail, as the kit lifts a chip on a toned rail. It must
    // stay 1.2:1 apart from the rail behind it, the floor every selection
    // look clears (glass.ts, the docked rail comment), and keep the row's
    // text, --sidebar-active-text's default, at 4.5:1 on the chip.
    const lift = /^hsl\(var\((--[\w-]+)\) \/ ([\d.]+)\)$/.exec(
      declared.navSelectionFill ?? "",
    )
    if (!lift) {
      throw new Error(`unexpected nav chip ${declared.navSelectionFill}`)
    }
    const [, ink = "", inkAlpha = ""] = lift
    for (const face of chromeFaces) {
      const chip = composite(face, at(ink), Number(inkAlpha))
      const ratio = contrastRatio(chip, face)
      if (ratio < 1.2) {
        failures.push(`nav chip over the rail at ${face}: ${ratio.toFixed(2)}`)
      }
      const text = contrastRatio(at("--sidebar-foreground-hover"), chip)
      if (text < TEXT) {
        failures.push(`nav chip text at ${face}: ${text.toFixed(2)}`)
      }
    }
    expect(failures).toEqual([])
  })
})
