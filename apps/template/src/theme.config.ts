import {
  definePreset,
  defineStyle,
  defineThemeConfig,
} from "darkraise-ui/theme-config"

// List only what differs from the kit's defaults; every other axis keeps its
// registry default and stays in the theme switcher.
export const themeConfig = defineThemeConfig({
  defaults: {},
  switcher: { enabled: true },
  // An example app style and preset. Glass ink inherits Glass whole (its
  // frosted chrome, opacity and blur rules and contrast fallback) and inks
  // the chrome edges with the accent; Ink night is its preset for dark rooms.
  styles: {
    "glass-ink": defineStyle({
      label: "Glass ink",
      extends: "glass",
      vars: {
        shared: {
          "--glass-ink-line":
            "color-mix(in oklab, hsl(var(--primary-8)) 55%, transparent)",
        },
        dark: {
          "--glass-ink-line":
            "color-mix(in oklab, hsl(var(--primary-5)) 70%, transparent)",
        },
      },
      tokens: { shared: { chromeEdge: "var(--glass-ink-line)" } },
      forcedFallback: { tokens: { chromeEdge: "hsl(var(--primary-8))" } },
    }),
  },
  presets: {
    "ink-night": definePreset({
      label: "Ink night",
      style: "glass-ink",
      axes: {
        accentColor: "indigo",
        glassTransparency: "high",
        radius: "sharp",
      },
      tokens: { dark: { cardEdge: "0 0 0 1px var(--glass-ink-line)" } },
    }),
  },
})
