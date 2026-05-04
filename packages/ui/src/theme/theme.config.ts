import type {
  AccentColor,
  SurfaceColor,
  SurfaceStyle,
  BackgroundStyle,
  Density,
  Elevation,
  Mode,
} from "./types"

export interface ThemeConfig {
  defaults: {
    accentColor: AccentColor
    surfaceColor: SurfaceColor
    surfaceStyle: SurfaceStyle
    backgroundStyle: BackgroundStyle
    mode: Mode
    density: Density
    elevation: Elevation
    buttonElevation: Elevation
  }
  switcher: {
    enabled: boolean
    axes: {
      mode: boolean
      accentColor: boolean
      surfaceColor: boolean
      surfaceStyle: boolean
      backgroundStyle: boolean
      density: boolean
      elevation: boolean
      buttonElevation: boolean
    }
  }
}

export const themeConfig: ThemeConfig = {
  defaults: {
    accentColor: "blue",
    surfaceColor: "slate",
    surfaceStyle: "default",
    backgroundStyle: "solid",
    mode: "system",
    density: "cozy",
    elevation: "medium",
    buttonElevation: "flat",
  },
  switcher: {
    enabled: true,
    axes: {
      mode: true,
      accentColor: true,
      surfaceColor: true,
      surfaceStyle: true,
      backgroundStyle: true,
      density: true,
      elevation: true,
      buttonElevation: true,
    },
  },
}
