import type {
  AccentColor,
  SurfaceColor,
  BackgroundStyle,
  BackgroundIntensity,
  GradientPattern,
  Density,
  Elevation,
  SurfaceIntensity,
  Radius,
  FontSize,
  AccentIntensity,
  GlowLevel,
  Mode,
} from "./types"
import type { PresetName } from "./presets"

export interface ThemeConfig {
  defaults: {
    accentColor: AccentColor
    surfaceColor: SurfaceColor
    preset: PresetName
    backgroundStyle: BackgroundStyle
    backgroundIntensity: BackgroundIntensity
    gradientPattern: GradientPattern
    mode: Mode
    density: Density
    elevation: Elevation
    buttonElevation: Elevation
    surfaceIntensity: SurfaceIntensity
    radius: Radius
    fontSize: FontSize
    accentIntensity: AccentIntensity
    outerGlow: GlowLevel
    innerGlow: GlowLevel
  }
  switcher: {
    enabled: boolean
    axes: {
      mode: boolean
      accentColor: boolean
      surfaceColor: boolean
      preset: boolean
      backgroundStyle: boolean
      backgroundIntensity: boolean
      gradientPattern: boolean
      density: boolean
      elevation: boolean
      buttonElevation: boolean
      surfaceIntensity: boolean
      radius: boolean
      fontSize: boolean
      accentIntensity: boolean
      outerGlow: boolean
      innerGlow: boolean
      /** Master toggle for all preset-specific axis controls. */
      presetAxes: boolean
    }
  }
}

export const themeConfig: ThemeConfig = {
  defaults: {
    accentColor: "blue",
    surfaceColor: "slate",
    preset: "default",
    backgroundStyle: "solid",
    backgroundIntensity: "balanced",
    gradientPattern: "blobs",
    mode: "system",
    density: "cozy",
    elevation: "medium",
    buttonElevation: "flat",
    surfaceIntensity: "balanced",
    radius: "rounded",
    fontSize: "medium",
    accentIntensity: "balanced",
    outerGlow: "none",
    innerGlow: "none",
  },
  switcher: {
    enabled: true,
    axes: {
      mode: true,
      accentColor: true,
      surfaceColor: true,
      preset: true,
      backgroundStyle: true,
      backgroundIntensity: true,
      gradientPattern: true,
      density: true,
      elevation: true,
      buttonElevation: true,
      surfaceIntensity: true,
      radius: true,
      fontSize: true,
      accentIntensity: true,
      outerGlow: true,
      innerGlow: true,
      presetAxes: true,
    },
  },
}
