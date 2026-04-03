import type { Preview } from "@storybook/react"
import "../src/styles/globals.css"

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
    theme: {
      description: "Color theme",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: ["default", "emerald", "rose", "amber", "violet"],
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
    theme: "default",
    mode: "light",
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || "default"
      const mode = context.globals.mode || "light"
      document.documentElement.setAttribute("data-theme", theme)
      document.documentElement.setAttribute("data-mode", mode)
      return <Story />
    },
  ],
}

export default preview
