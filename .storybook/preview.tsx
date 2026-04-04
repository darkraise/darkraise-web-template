import type { Preview } from "@storybook/react"
import "../src/styles/globals.css"
import { generateTokens } from "../src/core/theme/engine/generate-tokens"
import { ACCENT_COLORS, SURFACE_STYLES } from "../src/core/theme/types"
import type {
  AccentColor,
  SurfaceStyle,
  ResolvedMode,
} from "../src/core/theme/types"

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    accentColor: {
      description: "Accent color",
      toolbar: {
        title: "Accent",
        icon: "paintbrush",
        items: [...ACCENT_COLORS],
        dynamicTitle: true,
      },
    },
    surfaceStyle: {
      description: "Surface style",
      toolbar: {
        title: "Style",
        icon: "component",
        items: [...SURFACE_STYLES],
        dynamicTitle: true,
      },
    },
    mode: {
      description: "Light or dark mode",
      toolbar: {
        title: "Mode",
        icon: "moon",
        items: ["light", "dark"],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    accentColor: "blue",
    surfaceStyle: "default",
    mode: "light",
  },
  decorators: [
    (Story, context) => {
      const accentColor = (context.globals.accentColor || "blue") as AccentColor
      const surfaceStyle = (context.globals.surfaceStyle ||
        "default") as SurfaceStyle
      const mode = (context.globals.mode || "light") as ResolvedMode

      document.documentElement.setAttribute("data-mode", mode)

      const tokens = generateTokens({
        accentColor,
        surfaceStyle,
        mode,
        backgroundStyle: "solid",
      })

      for (const [key, value] of Object.entries(tokens)) {
        document.documentElement.style.setProperty(key, value)
      }

      return <Story />
    },
  ],
}

export default preview
