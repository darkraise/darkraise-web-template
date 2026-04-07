import type { ThemeConfig } from "darkraise-ui/theme"

export const themeConfig: ThemeConfig = {
  defaults: {
    accentColor: "blue",
    surfaceColor: "slate",
    surfaceStyle: "default",
    backgroundStyle: "solid",
    fontFamily: "default",
    mode: "system",
  },
  switcher: {
    enabled: true,
    axes: {
      mode: true,
      accentColor: true,
      surfaceColor: true,
      surfaceStyle: true,
      backgroundStyle: true,
      fontFamily: true,
    },
  },
}
