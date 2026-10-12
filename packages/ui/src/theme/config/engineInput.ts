import type { AxisValues } from "@theme/axes/registry"
import type { GenerateTokensInput } from "@theme/engine/generateTokens"
import type { ResolvedMode } from "@theme/types"
import type { ThemeRegistry } from "./registry"

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
  }
}
