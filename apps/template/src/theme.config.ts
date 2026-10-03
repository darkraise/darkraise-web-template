import type { ThemeConfig } from "darkraise-ui/theme"

// List only what differs from the kit's defaults; every other axis keeps its
// registry default and stays in the theme switcher.
export const themeConfig: ThemeConfig = {
  defaults: {},
  switcher: { enabled: true },
}
