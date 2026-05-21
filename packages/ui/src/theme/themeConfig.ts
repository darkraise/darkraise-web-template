import type {
  AccentColor,
  SurfaceColor,
  BackgroundStyle,
  BackgroundIntensity,
  GradientPattern,
  Density,
  Elevation,
  Radius,
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
    radius: Radius
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
      radius: boolean
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
    radius: "rounded",
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
      radius: true,
      presetAxes: true,
    },
  },
}
