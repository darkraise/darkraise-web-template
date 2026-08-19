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
  AccentVibrancy,
  CanvasTint,
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
    accentVibrancy: AccentVibrancy
    canvasTint: CanvasTint
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
      accentVibrancy: boolean
      canvasTint: boolean
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
    accentVibrancy: "balanced",
    canvasTint: "balanced",
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
      accentVibrancy: true,
      canvasTint: true,
      presetAxes: true,
    },
  },
}
