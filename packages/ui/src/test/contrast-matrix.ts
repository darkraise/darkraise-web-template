import {
  generateTokens,
  resolveAccentScale,
  resolveNeutralScale,
} from "@theme/engine/generateTokens"
import { presets, type PresetName } from "@theme/presets"
import {
  ACCENT_COLORS,
  ACCENT_INTENSITIES,
  BACKGROUND_INTENSITIES,
  SURFACE_COLORS,
  type AccentColor,
  type AccentIntensity,
  type BackgroundIntensity,
  type ResolvedMode,
  type SurfaceColor,
} from "@theme/types"

/**
 * Test support for the contrast checks: one theme configuration the provider
 * can actually paint.
 */
export interface ThemeCombo {
  accentColor: AccentColor
  surfaceColor: SurfaceColor
  mode: ResolvedMode
  accentIntensity: AccentIntensity
  backgroundIntensity: BackgroundIntensity
  preset: PresetName
}

/**
 * Every combination a user can reach. Glass hides accentIntensity and
 * neutralises it to the default, so iterating its other steps would test
 * states nothing paints.
 *
 * backgroundStyle stays solid: it moves the decorative --sf-hue tokens and
 * the page a field edge sits on, and field-edge.test.ts covers that case
 * against gradientCanvasPeak. backgroundIntensity caps the page's saturation,
 * so every step is included.
 */
export function reachableCombos(): ThemeCombo[] {
  const combos: Array<Omit<ThemeCombo, "backgroundIntensity">> = []
  for (const accentColor of ACCENT_COLORS) {
    for (const surfaceColor of SURFACE_COLORS) {
      for (const mode of ["light", "dark"] as const) {
        for (const accentIntensity of ACCENT_INTENSITIES) {
          combos.push({
            accentColor,
            surfaceColor,
            mode,
            accentIntensity,
            preset: "default",
          })
        }
        combos.push({
          accentColor,
          surfaceColor,
          mode,
          accentIntensity: "balanced",
          preset: "glass",
        })
      }
    }
  }
  return BACKGROUND_INTENSITIES.flatMap((backgroundIntensity) =>
    combos.map((combo) => ({ ...combo, backgroundIntensity })),
  )
}

const tokenCache = new Map<string, Record<string, string>>()

/**
 * Engine tokens with the preset's own tokens on top, as ThemeProvider merges
 * them. Built once per combination: the contrast suites read the same matrix
 * many times over.
 */
export function finalTokens(combo: ThemeCombo): Record<string, string> {
  const key = comboName(combo)
  const cached = tokenCache.get(key)
  if (cached) return cached
  const common = generateTokens({
    accentColor: combo.accentColor,
    surfaceColor: combo.surfaceColor,
    preset: combo.preset,
    backgroundStyle: "solid",
    mode: combo.mode,
    accentIntensity: combo.accentIntensity,
    backgroundIntensity: combo.backgroundIntensity,
  })
  const preset = presets[combo.preset]
  // The provider falls back to each preset axis's declared default when
  // nothing is stored (ThemeProvider.tsx:518); glass reads axes.opacity
  // unconditionally, so an empty object would throw.
  const axisDefaults = Object.fromEntries(
    Object.entries(preset.axes ?? {}).map(([key, axis]) => [
      key,
      (axis as { default: string }).default,
    ]),
  )
  const own = preset.generateTokens
    ? preset.generateTokens(
        {
          accentColor: combo.accentColor,
          surfaceColor: combo.surfaceColor,
          backgroundStyle: "solid",
          mode: combo.mode,
          accent: resolveAccentScale(combo.accentColor, combo.surfaceColor),
          surface: resolveNeutralScale(combo.surfaceColor),
          neutral: resolveNeutralScale(combo.surfaceColor),
          outerGlow: "none",
          innerGlow: "none",
        },
        axisDefaults as never,
      )
    : {}
  const tokens = { ...common, ...own }
  tokenCache.set(key, tokens)
  return tokens
}

/**
 * True for a plain triplet. A value with an alpha channel or a var() reference
 * is composited over something the engine does not know, so its contrast
 * cannot be computed here.
 */
export function isOpaque(value: string | undefined): value is string {
  return (
    typeof value === "string" && !value.includes("/") && !value.includes("var(")
  )
}

export function comboName(combo: ThemeCombo): string {
  return `${combo.preset}/${combo.mode}/${combo.accentIntensity}/${combo.backgroundIntensity}/${combo.accentColor}/${combo.surfaceColor}`
}
