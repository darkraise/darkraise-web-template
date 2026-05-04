import type { Preview } from "@storybook/react"
import { MockRouterAdapterProvider } from "../src/test/mock-router-adapter"
import "../src/styles/theme.css"
import { generateTokens } from "../src/theme/engine/generate-tokens"
import { ACCENT_COLORS, SURFACE_STYLES } from "../src/theme/types"
import type {
  AccentColor,
  SurfaceStyle,
  ResolvedMode,
} from "../src/theme/types"

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
        surfaceColor: "slate",
        surfaceStyle,
        backgroundStyle: "solid",
        mode,
      })

      for (const [key, value] of Object.entries(tokens)) {
        document.documentElement.style.setProperty(key, value)
      }

      return <Story />
    },
    (Story) => (
      <MockRouterAdapterProvider>
        <Story />
      </MockRouterAdapterProvider>
    ),
  ],
}

export default preview
