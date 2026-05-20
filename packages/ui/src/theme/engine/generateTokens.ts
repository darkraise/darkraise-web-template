import type {
  AccentColor,
  BackgroundStyle,
  SurfaceColor,
  ResolvedMode,
  ColorScale,
} from "@theme/types"
import { accentColors } from "@theme/palettes/accentColors"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import { presets, type PresetName } from "@theme/presets"
import { ACCENT_COLORS } from "@theme/types"

export interface GenerateTokensInput {
  accentColor: AccentColor
  surfaceColor: SurfaceColor
  preset: PresetName
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

function isSidebarDark(_preset: PresetName, mode: ResolvedMode): boolean {
  return mode === "dark"
}

export function generateTokens(
  input: GenerateTokensInput,
): Record<string, string> {
  const { accentColor, surfaceColor, preset, backgroundStyle, mode } = input

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
  const recipe = presets[preset].surfaceRecipe

  const isRedishAccent =
    accentColor === "red" || accentColor === "rose" || accentColor === "pink"

  // Cast: "glassmorphism" isn't yet in the PresetName union (Phase 1 only
  // registers `default`). Phase 3 adds it, after which this cast is redundant
  // but harmless. The string comparison is intentional forward-compat.
  const presetName = preset as string
  const isLightGlass = mode === "light" && presetName === "glassmorphism"
  const isDarkGlass = presetName === "glassmorphism" && mode === "dark"
  // Dark non-glass picks shade 500 (same as light) rather than the brighter
  // shade 400 it used previously. The earlier `accent[400]` value sat at
  // L:68u201376% S:92u201395% for high-saturation pastels (blue/violet/rose),
  // which read as glaring on every `bg-primary` surface in dark mode
  // (default Button fill, Checkbox/Switch checked, Calendar selected day,
  // Tabs underline, Progress track, etc.). Shade 500 keeps WCAG-fine
  // contrast against the dark background while toning down the brightness.
  // Glass branches stay on their original shades because translucent
  // surfaces need the extra weight to read at all.
  const primaryShade = isLightGlass ? 600 : isDarkGlass ? 400 : 500
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

  const border = recipe.overrides.border
    ? recipe.overrides.border(surface, mode)
    : mode === "light"
      ? surface[200]
      : surface[700]

  // Dark `--border` deliberately lighter than `--muted`/`--secondary`/
  // `--accent` (all `surface[800]`) and `--border-subtle` (also 800). The
  // earlier value of `surface[800]` collapsed the standard border into the
  // subtle tier, so any outline drawn next to a muted surface (e.g. the
  // FloatingPanel header sitting on its own popover body) became invisible
  // in dark mode. Surface[700] also matches the `borderDefault` recipe step
  // already published as `--border-default`, keeping the two tokens
  // semantically aligned.

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

    "--info":
      mode === "light" ? accentColors.blue[500] : accentColors.blue[400],
    "--info-foreground": "0 0% 100%",

    "--border": border,
    "--input": inputValue,

    "--surface-base": mode === "light" ? surface[50] : surface[950],
    "--surface-raised": recipe.surfaceRaised(surface, mode),
    "--surface-overlay": recipe.surfaceOverlay(surface, mode),
    "--surface-sunken": recipe.surfaceSunken(surface, mode),
    "--surface-sidebar": recipe.surfaceSidebar(surface, mode),
    "--sidebar-foreground": isSidebarDark(preset, mode)
      ? neutral[300]
      : neutral[600],
    "--sidebar-foreground-hover": isSidebarDark(preset, mode)
      ? "0 0% 100%"
      : neutral[900],
    "--sidebar-foreground-muted": isSidebarDark(preset, mode)
      ? neutral[500]
      : neutral[400],
    "--sidebar-border": isSidebarDark(preset, mode)
      ? "0 0% 100% / 0.1"
      : surface[200],
    "--sidebar-hover-bg": isSidebarDark(preset, mode)
      ? `${accent[500]} / 0.15`
      : accent[100],
    "--surface-header": recipe.surfaceHeader(surface, mode),

    "--border-subtle": recipe.borderSubtle(surface, mode),
    "--border-default": recipe.borderDefault(surface, mode),

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
      backgroundStyle === "gradient" && presetName !== "glassmorphism"
        ? `var(--canvas-blob-a), var(--canvas-blob-b), var(--canvas-blob-c), var(--canvas-blob-d), var(--canvas-ink)`
        : presetName === "glassmorphism" && backgroundStyle === "solid"
          ? `linear-gradient(135deg, hsl(${accent[mode === "light" ? 200 : 800]} / 0.2) 0%, transparent 70%)`
          : "none",

    ...sfHueTokens,
  }

  return tokens
}

/**
 * @deprecated Replaced by per-preset `ownedTokenKeys`. Kept as an empty
 * array so existing imports compile; remove in Phase 5.
 */
export const GLASS_ONLY_TOKEN_KEYS: readonly string[] = []
