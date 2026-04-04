import type {
  AccentColor,
  BackgroundStyle,
  SurfaceStyle,
  ResolvedMode,
  ColorScale,
} from "../types"
import { accentColors, LIGHT_ACCENT_COLORS } from "../palettes/accent-colors"
import { surfaceColors } from "../palettes/surface-colors"
import { surfaceStyles } from "../styles/surface-styles"
import { ACCENT_COLORS } from "../types"

export interface GenerateTokensInput {
  accentColor: AccentColor
  surfaceStyle: SurfaceStyle
  backgroundStyle: BackgroundStyle
  mode: ResolvedMode
}

function getChartColors(
  accentColor: AccentColor,
  mode: ResolvedMode,
): string[] {
  const index = ACCENT_COLORS.indexOf(accentColor)
  const count = ACCENT_COLORS.length
  const step = Math.floor(count / 5)
  const shade = mode === "light" ? 500 : 400

  return Array.from({ length: 5 }, (_, i) => {
    const colorIndex = (index + i * step) % count
    const colorName = ACCENT_COLORS[colorIndex] ?? accentColor
    return accentColors[colorName][shade]
  })
}

function generateGradient(
  accentColor: AccentColor,
  mode: ResolvedMode,
): string {
  const accent = accentColors[accentColor]
  const index = ACCENT_COLORS.indexOf(accentColor)
  const nextIndex = (index + 2) % ACCENT_COLORS.length
  const thirdIndex = (index + 4) % ACCENT_COLORS.length
  const nextName = ACCENT_COLORS[nextIndex] ?? accentColor
  const thirdName = ACCENT_COLORS[thirdIndex] ?? accentColor
  const next = accentColors[nextName]
  const third = accentColors[thirdName]

  if (mode === "light") {
    return `linear-gradient(135deg, hsl(${accent[200]}) 0%, hsl(${next[200]}) 50%, hsl(${third[100]}) 100%)`
  }
  return `linear-gradient(135deg, hsl(${accent[900]}) 0%, hsl(${next[900]}) 50%, hsl(${third[950]}) 100%)`
}

function resolveOpacity(
  style: SurfaceStyle,
  bgStyle: BackgroundStyle,
  mode: ResolvedMode,
  defaultOpacity: string,
): string {
  if (style === "glassmorphism") {
    if (bgStyle === "gradient") {
      return mode === "light" ? "0.3" : "0.4"
    }
    return mode === "light" ? "0.5" : "0.5"
  }
  return defaultOpacity
}

export function generateTokens(
  input: GenerateTokensInput,
): Record<string, string> {
  const { accentColor, surfaceStyle, backgroundStyle, mode } = input

  const accent: ColorScale = accentColors[accentColor]
  const surface: ColorScale = surfaceColors.slate as ColorScale
  const recipe = surfaceStyles[surfaceStyle]

  const isLightAccent = LIGHT_ACCENT_COLORS.has(accentColor)

  const primaryShade = mode === "light" ? 500 : 400
  const primaryForeground = isLightAccent ? accent[950] : "0 0% 100%"
  const ringValue = accent[primaryShade]

  const chartColors = getChartColors(accentColor, mode)

  const foreground = recipe.overrides.foreground
    ? recipe.overrides.foreground(surface, mode)
    : mode === "light"
      ? surface[900]
      : surface[50]

  let border = recipe.overrides.border
    ? recipe.overrides.border(surface, mode)
    : mode === "light"
      ? surface[200]
      : surface[800]

  if (surfaceStyle === "glassmorphism" && mode === "dark") {
    border = backgroundStyle === "gradient" ? surface[500] : surface[600]
  }

  const inputValue = recipe.overrides.input
    ? recipe.overrides.input(surface, mode)
    : border

  const accentToken = recipe.overrides.accent
    ? recipe.overrides.accent(surface, mode, accent)
    : mode === "light"
      ? surface[100]
      : surface[800]

  const accentForeground = recipe.overrides.accentForeground
    ? recipe.overrides.accentForeground(surface, mode, accent)
    : mode === "light"
      ? surface[900]
      : surface[50]

  const tokens: Record<string, string> = {
    "--primary": accent[primaryShade],
    "--primary-foreground": primaryForeground,
    "--ring": ringValue,

    "--chart-1": chartColors[0] ?? "",
    "--chart-2": chartColors[1] ?? "",
    "--chart-3": chartColors[2] ?? "",
    "--chart-4": chartColors[3] ?? "",
    "--chart-5": chartColors[4] ?? "",

    "--background": mode === "light" ? surface[50] : surface[950],
    "--foreground": foreground,

    "--card": mode === "light" ? "0 0% 100%" : surface[900],
    "--card-foreground": mode === "light" ? surface[900] : surface[50],

    "--popover": mode === "light" ? "0 0% 100%" : surface[900],
    "--popover-foreground": mode === "light" ? surface[900] : surface[50],

    "--secondary": mode === "light" ? surface[100] : surface[800],
    "--secondary-foreground": mode === "light" ? surface[900] : surface[50],

    "--muted": mode === "light" ? surface[100] : surface[800],
    "--muted-foreground": mode === "light" ? surface[500] : surface[400],

    "--accent": accentToken,
    "--accent-foreground": accentForeground,

    "--destructive": mode === "light" ? "0 84% 60%" : "0 72% 51%",
    "--destructive-foreground": "0 0% 100%",

    "--border": border,
    "--input": inputValue,

    "--surface-base": mode === "light" ? surface[50] : surface[950],
    "--surface-raised": recipe.tokens.surfaceRaised(surface, mode, accent),
    "--surface-overlay": recipe.tokens.surfaceOverlay(surface, mode),
    "--surface-sunken": recipe.tokens.surfaceSunken(surface, mode),
    "--surface-sidebar": recipe.tokens.surfaceSidebar(surface, mode),
    "--surface-header": recipe.tokens.surfaceHeader(surface, mode, accent),

    "--border-subtle": recipe.tokens.borderSubtle(surface, mode),
    "--border-default": recipe.tokens.borderDefault(surface, mode),

    "--radius": recipe.overrides.radius,
    "--shadow-card": recipe.overrides.shadowCard,
    "--shadow-dropdown": recipe.overrides.shadowDropdown,
    "--backdrop-blur": recipe.overrides.backdropBlur,
    "--backdrop-filter":
      recipe.overrides.backdropBlur === "none"
        ? "none"
        : `blur(${recipe.overrides.backdropBlur})`,
    "--surface-opacity": resolveOpacity(
      surfaceStyle,
      backgroundStyle,
      mode,
      recipe.overrides.surfaceOpacity,
    ),

    "--bg-style": backgroundStyle,
    "--bg-gradient":
      backgroundStyle === "gradient"
        ? generateGradient(accentColor, mode)
        : "none",
  }

  return tokens
}
