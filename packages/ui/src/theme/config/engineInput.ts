import type { AxisValues } from "@theme/axes/registry"
import { NO_GROUND_ART, type GenerateTokensInput, type GroundArt } from "@theme/engine/generateTokens"
import type { ResolvedMode } from "@theme/types"
import type { ThemeRegistry } from "./registry"

/** An engine colour a ground layer names, with the alpha it paints at. */
const LAYER = /hsl\(var\((--[\w-]+)\)(?:\s*\/\s*([\d.]+))?\)/g

/**
 * The engine colours a look's `shellGround*` paint lays over the page. Soft
 * Glass's art names the blob and tint colours its stylesheet computes from
 * the primary, so it reads as `blobs` alone.
 */
function groundArt(
  registry: ThemeRegistry,
  current: AxisValues,
  mode: ResolvedMode,
): GroundArt {
  const style = registry.styles[current.style]?.tokens
  const preset = current.preset
    ? registry.presets[current.preset]?.tokens
    : undefined
  const paint: Record<string, string | undefined> = {
    ...style?.shared,
    ...style?.[mode],
    ...preset?.shared,
    ...preset?.[mode],
  }
  const art = Object.entries(paint)
    .filter(([token]) => token.startsWith("shellGround"))
    .map(([, value]) => value ?? "")
    .join(", ")
  if (art.includes("var(--ground-blob")) return { layers: [], blobs: true }
  if (!art) return NO_GROUND_ART
  return {
    layers: [...art.matchAll(LAYER)].map(([, token, alpha]) => ({
      token: token as string,
      alpha: alpha === undefined ? 1 : Number(alpha),
    })),
    blobs: false,
  }
}

/**
 * What the colour engine paints `current` from in `mode`: the axes, the
 * style's frosting and hairlines, and the chrome tones the style and preset
 * signatures resolve to. ThemeProvider, Storybook and the contrast suites all
 * build their input here, so none can drift from what the app paints.
 */
export function engineInput(
  registry: ThemeRegistry,
  current: AxisValues,
  mode: ResolvedMode,
): Required<GenerateTokensInput> {
  const style = registry.styles[current.style]
  const { railTone, barTone } = registry.signaturesFor(
    current.style,
    current.preset,
  )
  return {
    accentColor: current.accentColor,
    surfaceColor: current.surfaceColor,
    frosted: style?.frosted ?? false,
    backgroundStyle: current.backgroundStyle,
    mode,
    contrast: current.contrast,
    darkAccentChroma: current.darkAccentChroma,
    tintWithAccent: current.tintWithAccent === "on",
    backgroundIntensity: current.backgroundIntensity,
    hairlines: style?.hairlines ?? "opaque",
    signalColor: current.signalColor,
    railTone,
    barTone,
    groundArt: groundArt(registry, current, mode),
  }
}
