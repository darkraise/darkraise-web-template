import { accentColors } from "@theme/palettes/accentColors"
import {
  generateTokens,
  resolveNeutralScale,
  resolveSurfaceScale,
} from "@theme/engine/generateTokens"
import { presets, type PresetName } from "@theme/presets"
import {
  ACCENT_COLORS,
  ACCENT_INTENSITIES,
  SURFACE_COLORS,
  type AccentColor,
  type AccentIntensity,
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
  preset: PresetName
}

/**
 * Every combination a user can reach. Glass and sci-fi hide accentIntensity
 * and neutralise it to the default, and sci-fi is dark-only, so iterating
 * their other steps would test states nothing paints.
 */
export function reachableCombos(): ThemeCombo[] {
  const combos: ThemeCombo[] = []
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
      combos.push({
        accentColor,
        surfaceColor,
        mode: "dark",
        accentIntensity: "balanced",
        preset: "scifi",
      })
    }
  }
  return combos
}

/** Engine tokens with the preset's own tokens on top, as ThemeProvider merges them. */
export function finalTokens(combo: ThemeCombo): Record<string, string> {
  const common = generateTokens({
    accentColor: combo.accentColor,
    surfaceColor: combo.surfaceColor,
    preset: combo.preset,
    backgroundStyle: "solid",
    mode: combo.mode,
    accentIntensity: combo.accentIntensity,
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
          accent: accentColors[combo.accentColor],
          surface: resolveSurfaceScale(combo.surfaceColor, combo.mode),
          neutral: resolveNeutralScale(combo.surfaceColor),
          outerGlow: "none",
          innerGlow: "none",
        },
        axisDefaults as never,
      )
    : {}
  return { ...common, ...own }
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
  return `${combo.preset}/${combo.mode}/${combo.accentIntensity}/${combo.accentColor}/${combo.surfaceColor}`
}
