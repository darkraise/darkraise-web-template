import { describe, expect, it } from "vitest"
import { AXES, AXIS_KEYS, type AxisValues } from "@theme/axes/registry"
import { effectiveSettings } from "@theme/axes/resolve"
import { engineInput } from "@theme/config/engineInput"
import { resolveRegistry } from "@theme/config/registry"
import {
  SURFACE_ALPHA_FLOOR,
  TRANSPARENCY_SCALE,
  effectiveAlpha,
} from "@theme/config/transparency"
import {
  canvasHueScale,
  gradientCanvasPeak,
} from "@theme/engine/generateTokens"
import { groundColours } from "@theme/engine/groundBlobs"
import { composite, contrastRatio } from "@theme/engine/oklch"
import { finalTokens } from "@test/contrast-matrix"
import { FROST, chipEdgeColour, resolvedTokens } from "@test/preset-tokens"

/** WCAG 1.4.11: the selected chip is a state mark, so it reaches 3:1. */
const MARK = 3

const WHITE = "0 0% 100%"

/** An engine colour a ground layer names, with the alpha it paints at. */
const LAYER = /hsl\(var\((--[\w-]+)\)(?:\s*\/\s*([\d.]+))?\)/g

const registry = resolveRegistry()

const LOOKS = [
  "base",
  ...Object.values(registry.presets)
    .filter(
      (preset) =>
        preset.builtIn &&
        registry.styles[preset.style]?.lineage.includes("glass"),
    )
    .map((preset) => preset.name),
]

const DEFAULTS = Object.fromEntries(
  AXIS_KEYS.map((key) => [key, AXES[key].default]),
) as AxisValues

/**
 * The lowest contrast between the selected chip's edge and the frosted well
 * it sits in, for a user who chose the look and nothing else. The well is
 * white at the look's alpha over a card, at every Transparency step, or
 * over the bare page; beneath either is the page, the muted plane, every
 * engine colour the look's ground art paints over the page at its alpha,
 * the gradient canvas at its most saturated, and for Soft Glass the blobs
 * and tint its stylesheet paints.
 */
function lowestEdge(preset: string, mode: "light" | "dark") {
  const axes = effectiveSettings({ style: "glass", preset }, DEFAULTS, registry)
  const combo = engineInput(registry, axes, mode)
  const tokens = finalTokens(combo)
  const at = (key: string): string => {
    const value = tokens[key]
    if (value === undefined) throw new Error(`no ${key} for ${preset}`)
    return value
  }
  const paint = resolvedTokens(
    registry.styles.glass?.tokens,
    registry.presets[preset]?.tokens,
    mode,
  )
  const well = FROST.exec(paint.wellFill ?? "")
  if (!well) throw new Error(`${preset} ${mode}: well ${paint.wellFill}`)
  const edgeColour = chipEdgeColour(paint.selectedViewShadow, at)

  const page = at("--background")
  const grounds: [string, string][] = [
    ["--background", page],
    ["--muted", at("--muted")],
  ]
  // Soft Glass's ground art names colours its stylesheet computes; the
  // blobs and tint below are what it paints.
  const art =
    preset === "soft-glass"
      ? ""
      : Object.entries(paint)
          .filter(([token]) => token.startsWith("shellGround"))
          .map(([, value]) => value)
          .join(", ")
  for (const [, name, alpha] of art.matchAll(LAYER)) {
    const colour = at(name as string)
    grounds.push([
      alpha ? `${name} at ${alpha}` : (name as string),
      alpha ? composite(page, colour, Number(alpha)) : colour,
    ])
  }
  if (combo.backgroundStyle === "gradient") {
    grounds.push([
      "the canvas peak",
      gradientCanvasPeak(
        page,
        canvasHueScale(combo.accentColor, combo.surfaceColor, true)[500],
        mode,
        combo.backgroundIntensity,
      ),
    ])
  }
  if (preset === "soft-glass") {
    const { blobs, tint } = groundColours(at("--primary"), mode)
    for (const [i, blob] of blobs.entries()) grounds.push([`blob ${i}`, blob])
    grounds.push(["the tint", tint])
  }

  const planes: [string, number][] = [["the bare page", 0]]
  for (const [step, scale] of Object.entries(TRANSPARENCY_SCALE)) {
    planes.push([
      `a card at ${step}`,
      effectiveAlpha(
        Number(paint.surfaceFillAlpha ?? "1"),
        scale,
        SURFACE_ALPHA_FLOOR,
      ),
    ])
  }

  let lowest = { ratio: Infinity, where: "" }
  for (const [plane, alpha] of planes) {
    for (const [ground, colour] of grounds) {
      const under = composite(colour, at("--card"), alpha)
      const frosted = composite(under, WHITE, Number(well[1]))
      const ratio = contrastRatio(edgeColour, frosted)
      if (ratio < lowest.ratio) {
        lowest = { ratio, where: `on ${plane} over ${ground}` }
      }
    }
  }
  return lowest
}

describe("the selected chip on a frosted glass well", () => {
  it("covers base Glass and every built-in Glass preset", () => {
    expect(LOOKS).toEqual([
      "base",
      "mica-desk",
      "smoked-obsidian",
      "milk-glass",
      "aurora-night",
      "coral-space",
      "dusk-haze",
      "soft-glass",
    ])
  })

  it.each(["light", "dark"] as const)(
    "frosts the well and the neutral button and fills the chip in white, in %s",
    (mode) => {
      for (const look of LOOKS) {
        const paint = resolvedTokens(
          registry.styles.glass?.tokens,
          registry.presets[look]?.tokens,
          mode,
        )
        expect(paint.wellFill, look).toBe(
          mode === "light"
            ? "rgb(255 255 255 / 0.35)"
            : "rgb(255 255 255 / 0.06)",
        )
        expect(paint.selectedViewFill, look).toBe(
          mode === "light"
            ? "rgb(255 255 255 / 0.75)"
            : "rgb(255 255 255 / 0.14)",
        )
        // The card at the card plane's alpha, so the kit's more-contrast
        // fallback makes it opaque with the cards.
        expect(paint.buttonNeutralFill, look).toBe(
          "hsl(var(--card) / var(--surface-alpha))",
        )
      }
    },
  )

  it.each(
    LOOKS.flatMap((look) =>
      (["light", "dark"] as const).map((mode) => [look, mode] as const),
    ),
  )("edges a %s %s chip at 3:1 against the well", (look, mode) => {
    const { ratio, where } = lowestEdge(look, mode)
    expect(ratio, `${look} ${mode} ${where}`).toBeGreaterThanOrEqual(MARK)
  })
})
