import type {
  AccentColor,
  SurfaceColor,
  BackgroundStyle,
  Density,
  Elevation,
  Radius,
  Mode,
  SurfaceStyle,
} from "./types"
import type { PresetName } from "./presets"

export interface ThemeConfig {
  defaults: {
    accentColor: AccentColor
    surfaceColor: SurfaceColor
    preset: PresetName
    /** @deprecated use `preset`. Read by the migration shim. */
    surfaceStyle?: SurfaceStyle
    backgroundStyle: BackgroundStyle
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
      /** @deprecated use `preset`. */
      surfaceStyle?: boolean
      backgroundStyle: boolean
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
      density: true,
      elevation: true,
      buttonElevation: true,
      radius: true,
      presetAxes: true,
    },
  },
}
