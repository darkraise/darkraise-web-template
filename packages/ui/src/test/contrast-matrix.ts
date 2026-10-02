import {
  generateTokens,
  resolveAccentScale,
  resolveNeutralScale,
} from "@theme/engine/generateTokens"
import { presets, type PresetName } from "@theme/presets"
import {
  ACCENT_COLORS,
  BACKGROUND_INTENSITIES,
  CONTRASTS,
  DARK_ACCENT_CHROMAS,
  SURFACE_COLORS,
  type AccentColor,
  type BackgroundIntensity,
  type Contrast,
  type DarkAccentChroma,
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
  contrast: Contrast
  darkAccentChroma: DarkAccentChroma
  backgroundIntensity: BackgroundIntensity
  preset: PresetName
  /** Off unless set; the reachable matrix leaves it off. */
  tintWithAccent?: boolean
}

/**
 * Every combination a user can reach, with glass checked at the standard
 * contrast and chroma steps only. Light mode ignores darkAccentChroma, so it
 * runs at the standard step.
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
        const chromas =
          mode === "dark" ? DARK_ACCENT_CHROMAS : (["standard"] as const)
        for (const contrast of CONTRASTS) {
          for (const darkAccentChroma of chromas) {
            combos.push({
              accentColor,
              surfaceColor,
              mode,
              contrast,
              darkAccentChroma,
              preset: "default",
            })
          }
        }
        combos.push({
          accentColor,
          surfaceColor,
          mode,
          contrast: "standard",
          darkAccentChroma: "standard",
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
    contrast: combo.contrast,
    darkAccentChroma: combo.darkAccentChroma,
    tintWithAccent: combo.tintWithAccent ?? false,
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
  const tint = combo.tintWithAccent ? "/tint" : ""
  return `${combo.preset}/${combo.mode}/${combo.contrast}/${combo.darkAccentChroma}/${combo.backgroundIntensity}/${combo.accentColor}/${combo.surfaceColor}${tint}`
}
