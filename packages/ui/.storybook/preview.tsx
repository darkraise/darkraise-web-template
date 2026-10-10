import type { Preview } from "@storybook/react"
import { MockRouterAdapterProvider } from "../src/test/mock-router-adapter"
import "../src/styles/theme.css"
import { ACCENT_COLORS } from "../src/theme/types"
import { resolveRegistry } from "../src/theme/config/registry"
import type { AccentColor, ResolvedMode } from "../src/theme/types"
import { applyStoryTheme } from "./storyTheme"

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
    style: {
      description: "Style",
      toolbar: {
        title: "Style",
        icon: "component",
        items: [...resolveRegistry().values("style")],
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
    style: "quiet",
    mode: "light",
  },
  decorators: [
    (Story, context) => {
      applyStoryTheme({
        accentColor: (context.globals.accentColor || "blue") as AccentColor,
        style: String(context.globals.style || "quiet"),
        mode: (context.globals.mode || "light") as ResolvedMode,
      })
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
