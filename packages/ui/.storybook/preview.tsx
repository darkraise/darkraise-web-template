import type { Preview } from "@storybook/react"
import { MockRouterAdapterProvider } from "../src/test/mock-router-adapter"
import "../src/styles/theme.css"
import { generateTokens } from "../src/theme/engine/generateTokens"
import { ACCENT_COLORS } from "../src/theme/types"
import { PRESET_NAMES } from "../src/theme/presets"
import type { AccentColor, ResolvedMode } from "../src/theme/types"
import type { PresetName } from "../src/theme/presets"

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
        items: [...PRESET_NAMES],
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
      const preset = (context.globals.surfaceStyle || "default") as PresetName
      const mode = (context.globals.mode || "light") as ResolvedMode

      document.documentElement.setAttribute("data-mode", mode)

      const tokens = generateTokens({
        accentColor,
        surfaceColor: "slate",
        preset,
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
