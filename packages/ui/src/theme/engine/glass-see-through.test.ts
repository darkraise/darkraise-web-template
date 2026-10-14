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
import { composite, hslStringToOklch } from "@theme/engine/oklch"
import { finalTokens } from "@test/contrast-matrix"
import { resolvedTokens } from "@test/preset-tokens"

/**
 * A glass card shows the ground behind it: at Medium Transparency the card
 * over the page and the card over the look's strongest ground lie at least
 * this far apart in OKLab. The owner confirms the threshold against the
 * Theme Review Board; it changes only on the owner's word.
 */
const SEE_THROUGH = 0.06

/** An engine colour a ground layer names, with the alpha it paints at. */
const LAYER = /hsl\(var\((--[\w-]+)\)(?:\s*\/\s*([\d.]+))?\)/g

const registry = resolveRegistry()

// Soft Glass's ground is too faint for this measure by design (0.043 light,
// 0.054 dark with nothing covering it), and soft-glass-contrast.test.ts
// covers its contrast.
const LOOKS = [
  "base",
  ...Object.values(registry.presets)
    .filter(
      (preset) =>
        preset.builtIn &&
        preset.name !== "soft-glass" &&
        registry.styles[preset.style]?.lineage.includes("glass"),
    )
    .map((preset) => preset.name),
]

const DEFAULTS = Object.fromEntries(
  AXIS_KEYS.map((key) => [key, AXES[key].default]),
) as AxisValues

/** OKLab coordinates of an HSL triplet. */
function oklab(hsl: string): [number, number, number] {
  const { L, C, h } = hslStringToOklch(hsl)
  return [L, C * Math.cos(h), C * Math.sin(h)]
}

function distance(a: string, b: string): number {
  const [l1, a1, b1] = oklab(a)
  const [l2, a2, b2] = oklab(b)
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2)
}

/**
 * How far the card over the look's strongest ground lies from the card over
 * the page, for a user who chose the look and nothing else. The grounds are
 * the gradient canvas at its most saturated and every engine colour the
 * look's ground art paints, each composited over the page at its alpha; the
 * strongest is the one that shows through the card most.
 */
function seeThrough(preset: string, mode: "light" | "dark") {
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
  const page = at("--background")
  const grounds: [string, string][] = []
  const art = Object.entries(paint)
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
  const alpha = effectiveAlpha(
    Number(paint.surfaceFillAlpha ?? "1"),
    TRANSPARENCY_SCALE.medium,
    SURFACE_ALPHA_FLOOR,
  )
  const overPage = composite(page, at("--card"), alpha)
  return grounds
    .map(([ground, colour]) => ({
      ground,
      distance: distance(overPage, composite(colour, at("--card"), alpha)),
    }))
    .reduce((a, b) => (b.distance > a.distance ? b : a), {
      ground: "the page",
      distance: 0,
    })
}

describe("glass see-through", () => {
  it("covers base Glass and every built-in Glass preset but Soft Glass", () => {
    expect(LOOKS).toEqual([
      "base",
      "mica-desk",
      "smoked-obsidian",
      "milk-glass",
      "aurora-night",
      "coral-space",
      "dusk-haze",
    ])
  })

  it.each(
    LOOKS.flatMap((look) =>
      (["light", "dark"] as const).map((mode) => [look, mode] as const),
    ),
  )("lets the ground show through a %s %s card", (look, mode) => {
    const { ground, distance } = seeThrough(look, mode)
    expect(
      distance,
      `${look} ${mode}: the card over ${ground} against the card over the page`,
    ).toBeGreaterThanOrEqual(SEE_THROUGH)
  })
})
