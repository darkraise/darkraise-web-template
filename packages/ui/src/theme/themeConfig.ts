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
    elevation: "standard",
    radius: "rounded",
    fontSize: "medium",
    outerGlow: "none",
    innerGlow: "none",
    sidebarActiveBar: "default",
    contrast: "standard",
    darkAccentChroma: "standard",
    tintWithAccent: "off",
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
      radius: true,
      fontSize: true,
      outerGlow: true,
      innerGlow: true,
      sidebarActiveBar: true,
      contrast: true,
      darkAccentChroma: true,
      tintWithAccent: true,
      presetAxes: true,
    },
  },
}
