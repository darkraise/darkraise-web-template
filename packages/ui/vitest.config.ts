import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "node:path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@components": path.resolve(__dirname, "src/components"),
      "@data-table": path.resolve(__dirname, "src/data-table"),
      "@errors": path.resolve(__dirname, "src/errors"),
      "@forms": path.resolve(__dirname, "src/forms"),
      "@hooks": path.resolve(__dirname, "src/hooks"),
      "@layout": path.resolve(__dirname, "src/layout"),
      "@lib": path.resolve(__dirname, "src/lib"),
      "@router": path.resolve(__dirname, "src/router"),
      "@styles": path.resolve(__dirname, "src/styles"),
      "@test": path.resolve(__dirname, "src/test"),
      "@theme": path.resolve(__dirname, "src/theme"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost/",
      },
    },
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/test/**", "src/**/*.stories.tsx"],
    },
  },
})
