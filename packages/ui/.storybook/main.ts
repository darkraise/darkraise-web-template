import type { StorybookConfig } from "@storybook/react-vite"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (config) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...config.resolve.alias,
      "@components": path.resolve(__dirname, "../src/components"),
      "@data-table": path.resolve(__dirname, "../src/data-table"),
      "@errors": path.resolve(__dirname, "../src/errors"),
      "@forms": path.resolve(__dirname, "../src/forms"),
      "@hooks": path.resolve(__dirname, "../src/hooks"),
      "@layout": path.resolve(__dirname, "../src/layout"),
      "@lib": path.resolve(__dirname, "../src/lib"),
      "@router": path.resolve(__dirname, "../src/router"),
      "@styles": path.resolve(__dirname, "../src/styles"),
      "@test": path.resolve(__dirname, "../src/test"),
      "@theme": path.resolve(__dirname, "../src/theme"),
    }
    return config
  },
}

export default config
