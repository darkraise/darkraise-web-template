import { effectiveSettings } from "@theme/axes/resolve"
import { AXES, AXIS_KEYS, type AxisValues } from "@theme/axes/registry"
import { resolveRegistry } from "@theme/config/registry"
import { generateTokens, type ChromeTone } from "@theme/engine/generateTokens"
import {
  ACCENT_COLORS,
  BACKGROUND_INTENSITIES,
  CONTRASTS,
  DARK_ACCENT_CHROMAS,
  SURFACE_COLORS,
  type AccentColor,
  type BackgroundIntensity,
  type BackgroundStyle,
  type Contrast,
  type DarkAccentChroma,
  type ResolvedMode,
  type SignalColor,
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
  /** The only engine input a style sets: true under Glass. */
  frosted: boolean
  /** Off unless set; the reachable matrix leaves it off. */
  tintWithAccent?: boolean
  /** The built-in preset a combination paints; the reachable matrix has none. */
  preset?: string
  /** Solid unless set. */
  backgroundStyle?: BackgroundStyle
  hairlines?: "opaque" | "alpha"
  signalColor?: SignalColor
  railTone?: ChromeTone
  barTone?: ChromeTone
}

/**
 * Every combination a user can reach. A style reaches the engine only through
 * `frosted`, so Flat, Quiet and Tactile share the unfrosted half and Glass is
 * the frosted half, at every contrast and chroma step. Light mode ignores
 * darkAccentChroma, so it runs at the standard step.
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
            for (const frosted of [false, true]) {
              combos.push({
                accentColor,
                surfaceColor,
                mode,
                contrast,
                darkAccentChroma,
                frosted,
              })
            }
          }
        }
      }
    }
  }
  return BACKGROUND_INTENSITIES.flatMap((backgroundIntensity) =>
    combos.map((combo) => ({ ...combo, backgroundIntensity })),
  )
}

/**
 * Every built-in preset in both modes, as ThemeProvider paints it for a user
 * who chose the preset and nothing else: the preset's axes over its style's
 * defaults over the registry's, the style's frosting and hairlines, and the
 * chrome tones the preset's signatures resolve to. A preset reaches inputs
 * the reachable matrix holds still: the tint, the signal colour, the canvas
 * and the tones.
 */
export function presetCombos(): ThemeCombo[] {
  const registry = resolveRegistry()
  const defaults = Object.fromEntries(
    AXIS_KEYS.map((key) => [key, AXES[key].default]),
  ) as AxisValues
  return Object.values(registry.presets)
    .filter((preset) => preset.builtIn)
    .flatMap((preset) => {
      const style = registry.styles[preset.style]
      const axes = effectiveSettings(
        { style: preset.style, preset: preset.name },
        defaults,
        registry,
      )
      const { railTone, barTone } = registry.signaturesFor(
        preset.style,
        preset.name,
      )
      return (["light", "dark"] as const).map((mode) => ({
        preset: preset.name,
        mode,
        accentColor: axes.accentColor,
        surfaceColor: axes.surfaceColor,
        tintWithAccent: axes.tintWithAccent === "on",
        signalColor: axes.signalColor,
        contrast: axes.contrast,
        darkAccentChroma: axes.darkAccentChroma,
        backgroundStyle: axes.backgroundStyle,
        backgroundIntensity: axes.backgroundIntensity,
        frosted: style?.frosted ?? false,
        hairlines: style?.hairlines ?? "opaque",
        railTone,
        barTone,
      }))
    })
}

const tokenCache = new Map<string, Record<string, string>>()

/**
 * Engine tokens, as ThemeProvider paints them. Built once per combination:
 * the contrast suites read the same matrix many times over.
 */
export function finalTokens(combo: ThemeCombo): Record<string, string> {
  const key = comboName(combo)
  const cached = tokenCache.get(key)
  if (cached) return cached
  const tokens = generateTokens({
    accentColor: combo.accentColor,
    surfaceColor: combo.surfaceColor,
    frosted: combo.frosted,
    backgroundStyle: combo.backgroundStyle ?? "solid",
    mode: combo.mode,
    contrast: combo.contrast,
    darkAccentChroma: combo.darkAccentChroma,
    tintWithAccent: combo.tintWithAccent ?? false,
    backgroundIntensity: combo.backgroundIntensity,
    hairlines: combo.hairlines,
    signalColor: combo.signalColor,
    railTone: combo.railTone,
    barTone: combo.barTone,
  })
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
  const chrome = combo.frosted ? "frosted" : "plain"
  const name = `${chrome}/${combo.mode}/${combo.contrast}/${combo.darkAccentChroma}/${combo.backgroundIntensity}/${combo.accentColor}/${combo.surfaceColor}${tint}`
  // The token cache is keyed by this name, so it spells out every input the
  // reachable matrix holds still.
  const beyond = [
    combo.backgroundStyle === "gradient" ? "gradient" : "",
    combo.hairlines === "alpha" ? "alpha hairlines" : "",
    (combo.signalColor ?? "none") === "none"
      ? ""
      : `signal ${combo.signalColor}`,
    (combo.railTone ?? "page") === "page" ? "" : `rail ${combo.railTone}`,
    (combo.barTone ?? "page") === "page" ? "" : `bar ${combo.barTone}`,
  ]
    .filter(Boolean)
    .map((part) => `/${part}`)
    .join("")
  return `${combo.preset ? `${combo.preset}: ` : ""}${name}${beyond}`
}
