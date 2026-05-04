import type { ThemeConfig } from "darkraise-ui/theme"

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
    radius: "rounded",
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
      radius: true,
    },
  },
}
