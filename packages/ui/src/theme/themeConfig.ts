import type { AxisKey, AxisValues } from "./axes/registry"

export interface ThemeConfig {
  defaults: AxisValues
  switcher: {
    enabled: boolean
    axes: Record<AxisKey, boolean> & {
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
    backgroundIntensity: "vivid",
    gradientPattern: "blobs",
    mode: "system",
    density: "cozy",
    elevation: "medium",
    buttonElevation: "flat",
    surfaceIntensity: "balanced",
    borderIntensity: "balanced",
    radius: "rounded",
    fontSize: "medium",
    accentIntensity: "balanced",
    controlDepth: "recessed",
    outerGlow: "none",
    innerGlow: "none",
    shellStyle: "classic",
    sidebarActiveBar: "default",
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
      borderIntensity: true,
      radius: true,
      fontSize: true,
      accentIntensity: true,
      controlDepth: true,
      outerGlow: true,
      innerGlow: true,
      shellStyle: true,
      sidebarActiveBar: true,
      presetAxes: true,
    },
  },
}
