import type { Preview } from "@storybook/react"
import { useEffect, useGlobals } from "storybook/preview-api"
import { MockRouterAdapterProvider } from "../src/test/mock-router-adapter"
import "../src/styles/theme.css"
import { ACCENT_COLORS } from "../src/theme/types"
import { resolveRegistry } from "../src/theme/config/registry"
import type { AccentColor, ResolvedMode } from "../src/theme/types"
import {
  applyStoryTheme,
  presetToolbarItems,
  settleStoryToolbars,
} from "./storyTheme"

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
        // Unset, the accent is the preset's, else the style's, else the kit's.
        items: [{ type: "reset", title: "Preset default" }, ...ACCENT_COLORS],
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
    preset: {
      description: "Preset",
      toolbar: {
        title: "Preset",
        icon: "bookmark",
        items: presetToolbarItems(),
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
    style: "quiet",
    preset: "base",
    mode: "light",
  },
  decorators: [
    (Story, context) => {
      const [, updateGlobals] = useGlobals()
      const picked = {
        style: String(context.globals.style || "quiet"),
        preset: String(context.globals.preset || "base"),
      }
      const pinned =
        "preset" in context.storyGlobals
          ? "preset"
          : "style" in context.storyGlobals
            ? "style"
            : undefined
      const { style, preset } = settleStoryToolbars(picked, pinned)
      const moved =
        !pinned && (style !== picked.style || preset !== picked.preset)
      useEffect(() => {
        if (moved) updateGlobals({ style, preset })
      }, [moved, style, preset, updateGlobals])
      applyStoryTheme({
        accentColor: (context.globals.accentColor || undefined) as
          | AccentColor
          | undefined,
        style,
        preset,
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
