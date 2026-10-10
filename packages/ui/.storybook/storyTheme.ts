import {
  AXES,
  AXIS_KEYS,
  type AxisKey,
  type AxisValues,
} from "../src/theme/axes/registry"
import { resolveRegistry } from "../src/theme/config/registry"
import { generateTokens } from "../src/theme/engine/generateTokens"
import type { AccentColor, ResolvedMode } from "../src/theme/types"

const registry = resolveRegistry()

/**
 * Paints <html> for the toolbar's choices the way ThemeProvider would with
 * nothing stored: every other axis takes the style's default, else the
 * registry's. Storybook skips the provider so the toolbar alone decides.
 */
export function applyStoryTheme(choice: {
  accentColor: AccentColor
  style: string
  mode: ResolvedMode
}): void {
  const style = registry.styles[choice.style]
  const styleDefaults: Partial<Record<AxisKey, string>> = style?.defaults ?? {}
  const values = {} as Record<AxisKey, string>
  for (const key of AXIS_KEYS) {
    values[key] = styleDefaults[key] ?? AXES[key].default
  }
  const current = { ...values, ...choice } as AxisValues

  const root = document.documentElement
  for (const key of AXIS_KEYS) {
    const attribute = AXES[key].attribute
    if (attribute) root.setAttribute(attribute, current[key])
  }

  const tokens = generateTokens({
    accentColor: current.accentColor,
    surfaceColor: current.surfaceColor,
    frosted: style?.frosted ?? false,
    backgroundStyle: current.backgroundStyle,
    mode: choice.mode,
    contrast: current.contrast,
    darkAccentChroma: current.darkAccentChroma,
    tintWithAccent: current.tintWithAccent === "on",
    backgroundIntensity: current.backgroundIntensity,
  })
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value)
  }
}
