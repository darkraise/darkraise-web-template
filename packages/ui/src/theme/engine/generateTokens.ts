import type {
  AccentColor,
  BackgroundStyle,
  SurfaceColor,
  SurfaceStyle,
  ResolvedMode,
  ColorScale,
} from "@theme/types"
import { accentColors } from "@theme/palettes/accentColors"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import { surfaceStyles } from "@theme/styles/surfaceStyles"
import { ACCENT_COLORS } from "@theme/types"

export interface GenerateTokensInput {
  accentColor: AccentColor
  surfaceColor: SurfaceColor
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
    return `hsl(${accentColors[colorName][shade]})`
  })
}

function resolveSfHueTokens(
  surfaceColor: SurfaceColor,
  backgroundStyle: BackgroundStyle,
): { "--sf-hue": string; "--sf-hue-2": string; "--sf-hue-3": string } {
  if (backgroundStyle !== "gradient") {
    return {
      "--sf-hue": "transparent",
      "--sf-hue-2": "transparent",
      "--sf-hue-3": "transparent",
    }
  }

  if (surfaceColor === "slate") {
    const slate = surfaceColors.slate as ColorScale
    return {
      "--sf-hue": `hsl(${slate[500]})`,
      "--sf-hue-2": `hsl(${slate[400]})`,
      "--sf-hue-3": `hsl(${slate[300]})`,
    }
  }

  const color = accentColors[surfaceColor]
  const index = ACCENT_COLORS.indexOf(surfaceColor)
  const neighborIndex = (index + 3) % ACCENT_COLORS.length
  const neighborName = ACCENT_COLORS[neighborIndex] as AccentColor
  const neighbor = accentColors[neighborName]

  return {
    "--sf-hue": `hsl(${color[500]})`,
    "--sf-hue-2": `hsl(${neighbor[500]})`,
    "--sf-hue-3": `hsl(${color[300]})`,
  }
}

export const GLASS_ONLY_TOKEN_KEYS = [
  "--fog-05",
  "--fog-10",
  "--fog-15",
  "--fog-20",
  "--fog-30",
  "--fog-50",
  "--inset-hi",
  "--inset-hi-strong",
  "--inset-hi-button",
  "--backdrop-blur",
  "--backdrop-filter",
  "--surface-opacity",
] as const

function resolveGlassOpacity(
  bgStyle: BackgroundStyle,
  mode: ResolvedMode,
): string {
  if (bgStyle === "gradient") {
    return mode === "light" ? "0.3" : "0.4"
  }
  return "0.5"
}

function tintScale(
  scale: ColorScale,
  neutral: ColorScale,
  satFactor: number,
  useNeutralLightness: boolean,
): ColorScale {
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
  const result = {} as Record<number, string>
  for (const step of steps) {
    const parts = scale[step].split(" ")
    const h = parts[0] ?? "0"
    const s = parseFloat(parts[1] ?? "0")
    const l = useNeutralLightness
      ? (neutral[step].split(" ")[2] ?? "0%")
      : (parts[2] ?? "0%")
    result[step] = `${h} ${(s * satFactor).toFixed(0)}% ${l}`
  }
  return result as ColorScale
}

function isSidebarDark(_style: SurfaceStyle, mode: ResolvedMode): boolean {
  return mode === "dark"
}

export function generateTokens(
  input: GenerateTokensInput,
): Record<string, string> {
  const { accentColor, surfaceColor, surfaceStyle, backgroundStyle, mode } =
    input

  const sfHueTokens = resolveSfHueTokens(surfaceColor, backgroundStyle)

  const accent: ColorScale = accentColors[accentColor]
  const neutral: ColorScale = surfaceColors.slate as ColorScale
  const surface: ColorScale =
    surfaceColor === "slate"
      ? neutral
      : tintScale(
          accentColors[surfaceColor],
          neutral,
          mode === "light" ? 0.4 : 0.35,
          mode === "dark",
        )
  const recipe = surfaceStyles[surfaceStyle]

  const isRedishAccent =
    accentColor === "red" || accentColor === "rose" || accentColor === "pink"

  const isLightGlass = mode === "light" && surfaceStyle === "glassmorphism"
  const isDarkGlass = surfaceStyle === "glassmorphism" && mode === "dark"
  const primaryShade = isLightGlass ? 600 : mode === "light" ? 500 : 400
  const primaryForeground = "0 0% 100%"
  const ringValue = accent[primaryShade]
  const focusRingShade = mode === "light" ? 300 : 200
  const focusRingValue = accent[focusRingShade]

  const chartColors = getChartColors(accentColor, mode)

  const foreground = recipe.overrides.foreground
    ? recipe.overrides.foreground(neutral, mode)
    : mode === "light"
      ? neutral[900]
      : neutral[50]

  let border = recipe.overrides.border
    ? recipe.overrides.border(surface, mode)
    : mode === "light"
      ? surface[200]
      : surface[800]

  if (surfaceStyle === "glassmorphism" && mode === "dark") {
    border = backgroundStyle === "gradient" ? "0 0% 100% / 0.1" : surface[800]
  }

  const inputValue = recipe.overrides.input
    ? recipe.overrides.input(surface, mode)
    : border

  const tokens: Record<string, string> = {
    "--primary": accent[primaryShade],
    "--primary-foreground": primaryForeground,
    "--ring": ringValue,
    "--focus-ring": focusRingValue,

    "--chart-1": chartColors[0] ?? "",
    "--chart-2": chartColors[1] ?? "",
    "--chart-3": chartColors[2] ?? "",
    "--chart-4": chartColors[3] ?? "",
    "--chart-5": chartColors[4] ?? "",

    "--background": mode === "light" ? surface[50] : surface[950],
    "--foreground": foreground,

    "--card": mode === "light" ? "0 0% 100%" : surface[900],
    "--card-foreground": mode === "light" ? neutral[900] : neutral[50],

    "--popover": mode === "light" ? "0 0% 100%" : surface[900],
    "--popover-foreground": mode === "light" ? neutral[900] : neutral[50],

    "--secondary": mode === "light" ? surface[100] : surface[800],
    "--secondary-foreground": mode === "light" ? neutral[900] : neutral[50],

    "--muted": mode === "light" ? surface[100] : surface[800],
    "--muted-foreground": mode === "light" ? neutral[500] : neutral[400],

    "--accent": mode === "light" ? surface[100] : surface[800],
    "--accent-foreground": mode === "light" ? neutral[900] : neutral[50],

    "--destructive": isRedishAccent
      ? mode === "light"
        ? "25 95% 53%"
        : "21 90% 48%"
      : mode === "light"
        ? "0 84% 60%"
        : "0 72% 51%",
    "--destructive-foreground": "0 0% 100%",

    "--success":
      mode === "light" ? accentColors.emerald[500] : accentColors.emerald[400],
    "--success-foreground": "0 0% 100%",

    "--warning":
      mode === "light" ? accentColors.amber[500] : accentColors.amber[400],
    "--warning-foreground": "222 47% 11%",

    "--border": border,
    "--input": inputValue,

    "--surface-base": mode === "light" ? surface[50] : surface[950],
    "--surface-raised": recipe.tokens.surfaceRaised(surface, mode),
    "--surface-overlay": recipe.tokens.surfaceOverlay(surface, mode),
    "--surface-sunken": recipe.tokens.surfaceSunken(surface, mode),
    "--surface-sidebar": recipe.tokens.surfaceSidebar(surface, mode),
    "--sidebar-foreground": isSidebarDark(surfaceStyle, mode)
      ? neutral[300]
      : neutral[600],
    "--sidebar-foreground-hover": isSidebarDark(surfaceStyle, mode)
      ? "0 0% 100%"
      : neutral[900],
    "--sidebar-foreground-muted": isSidebarDark(surfaceStyle, mode)
      ? neutral[500]
      : neutral[400],
    "--sidebar-border": isSidebarDark(surfaceStyle, mode)
      ? "0 0% 100% / 0.1"
      : surface[200],
    "--sidebar-hover-bg": isSidebarDark(surfaceStyle, mode)
      ? `${accent[500]} / 0.15`
      : accent[100],
    "--surface-header": recipe.tokens.surfaceHeader(surface, mode),

    "--border-subtle": recipe.tokens.borderSubtle(surface, mode),
    "--border-default": recipe.tokens.borderDefault(surface, mode),

    "--shadow-card": isLightGlass
      ? recipe.overrides.shadowCard.replace(/rgb\(0 0 0 \//g, "rgb(16 24 40 /")
      : recipe.overrides.shadowCard,
    "--shadow-dropdown": isLightGlass
      ? recipe.overrides.shadowDropdown.replace(
          /rgb\(0 0 0 \//g,
          "rgb(16 24 40 /",
        )
      : recipe.overrides.shadowDropdown,

    "--bg-style": backgroundStyle,
    "--noise-opacity":
      backgroundStyle === "gradient" ? (mode === "light" ? "0.6" : "0.5") : "0",

    "--content-gradient-overlay":
      backgroundStyle === "gradient" && surfaceStyle !== "glassmorphism"
        ? `var(--canvas-blob-a), var(--canvas-blob-b), var(--canvas-blob-c), var(--canvas-blob-d), var(--canvas-ink)`
        : surfaceStyle === "glassmorphism" && backgroundStyle === "solid"
          ? `linear-gradient(135deg, hsl(${accent[mode === "light" ? 200 : 800]} / 0.2) 0%, transparent 70%)`
          : "none",

    ...sfHueTokens,
  }

  if (surfaceStyle === "glassmorphism") {
    tokens["--backdrop-blur"] = recipe.overrides.backdropBlur
    tokens["--backdrop-filter"] =
      `blur(${recipe.overrides.backdropBlur}) saturate(140%)`
    tokens["--surface-opacity"] = resolveGlassOpacity(backgroundStyle, mode)

    tokens["--fog-05"] = isDarkGlass
      ? "rgba(255, 255, 255, 0.04)"
      : "rgba(255, 255, 255, 0.55)"
    tokens["--fog-10"] = isDarkGlass
      ? "rgba(255, 255, 255, 0.07)"
      : "rgba(255, 255, 255, 0.65)"
    tokens["--fog-15"] = isDarkGlass
      ? "rgba(255, 255, 255, 0.10)"
      : "rgba(255, 255, 255, 0.72)"
    tokens["--fog-20"] = isDarkGlass
      ? "rgba(255, 255, 255, 0.14)"
      : "rgba(255, 255, 255, 0.82)"
    tokens["--fog-30"] = isDarkGlass
      ? "rgba(255, 255, 255, 0.20)"
      : "rgba(255, 255, 255, 0.90)"
    tokens["--fog-50"] = isDarkGlass
      ? "rgba(255, 255, 255, 0.38)"
      : "rgba(255, 255, 255, 0.96)"

    tokens["--inset-hi"] = isDarkGlass
      ? "inset 0 1px 0 rgba(255,255,255,0.14)"
      : "inset 0 1px 0 rgba(255,255,255,0.6)"
    tokens["--inset-hi-strong"] = isDarkGlass
      ? "inset 0 1px 0 rgba(255,255,255,0.22)"
      : "inset 0 1px 0 rgba(255,255,255,0.75)"
    tokens["--inset-hi-button"] = isDarkGlass
      ? "inset 0 1px 0 rgba(255,255,255,0.28)"
      : "inset 0 1px 0 rgba(255,255,255,0.6)"
  }

  return tokens
}
