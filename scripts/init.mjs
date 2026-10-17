#!/usr/bin/env node

/**
 * Standalone initializer for projects that already have darkraise-ui installed.
 * Generates theme.config.ts and app.tsx from a config JSON argument.
 *
 * Usage:
 *   node scripts/init.mjs <project-name> [config-json]
 */

import { existsSync, mkdirSync, writeFileSync } from "fs"
import { basename, resolve } from "path"

const projectDir = resolve(import.meta.dirname, "..")

// Run from this monorepo, the directory above the script is the workspace
// root, which the generated src/ and vite.config.ts would overwrite.
if (existsSync(resolve(projectDir, "pnpm-workspace.yaml"))) {
  console.error(
    "Error: init.mjs initializes a project that copied it into its scripts/ folder; it does not run in a workspace root. Use create-darkraise-ui for a new app.",
  )
  process.exit(1)
}
const args = process.argv.slice(2)
const projectName = args[0] || basename(projectDir)

function deepMerge(target, source) {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      typeof target[key] === "object" &&
      target[key] !== null
    ) {
      result[key] = deepMerge(target[key], source[key])
    } else {
      result[key] = source[key]
    }
  }
  return result
}

const defaultConfig = {
  layout: "sidebar",
  theme: {
    defaults: {
      accentColor: "blue",
      surfaceColor: "zinc",
      style: "quiet",
      preset: "base",
      glassTransparency: "medium",
      glassBlur: "medium",
      font: "hanken-grotesk",
      headingFont: "body",
      backgroundStyle: "solid",
      backgroundIntensity: "vivid",
      gradientPattern: "blobs",
      mode: "system",
      density: "cozy",
      elevation: "standard",
      radius: "rounded",
      fontSize: "medium",
      outerGlow: "none",
      innerGlow: "none",
      sidebarSelection: "auto",
      contrast: "standard",
      darkAccentChroma: "standard",
      tintWithAccent: "off",
      signalColor: "none",
    },
    switcher: {
      enabled: true,
      axes: {
        mode: true,
        accentColor: true,
        surfaceColor: true,
        style: true,
        preset: true,
        glassTransparency: true,
        glassBlur: true,
        font: true,
        headingFont: true,
        backgroundStyle: true,
        backgroundIntensity: true,
        gradientPattern: true,
        density: true,
        elevation: true,
        radius: true,
        fontSize: true,
        outerGlow: true,
        innerGlow: true,
        sidebarSelection: true,
        contrast: true,
        darkAccentChroma: true,
        tintWithAccent: true,
        signalColor: true,
      },
    },
  },
  auth: true,
  server: { host: "localhost", port: 5173 },
}

let config = defaultConfig
if (args[1]) {
  try {
    config = deepMerge(defaultConfig, JSON.parse(args[1]))
  } catch {
    console.error("Warning: could not parse config JSON, using defaults.")
  }
}

console.log(`\nInitializing project: ${projectName}\n`)

// 1. Generate theme.config.ts
// Imports the type rather than restating its shape, so this script can't
// drift out of sync with packages/ui/src/theme/themeConfig.ts again.
const themeConfigContent = `import type { ThemeConfig } from "darkraise-ui/theme"

export const themeConfig: ThemeConfig = {
  defaults: {
    accentColor: "${config.theme.defaults.accentColor}",
    surfaceColor: "${config.theme.defaults.surfaceColor}",
    style: "${config.theme.defaults.style}",
    preset: "${config.theme.defaults.preset}",
    glassTransparency: "${config.theme.defaults.glassTransparency}",
    glassBlur: "${config.theme.defaults.glassBlur}",
    font: "${config.theme.defaults.font}",
    headingFont: "${config.theme.defaults.headingFont}",
    backgroundStyle: "${config.theme.defaults.backgroundStyle}",
    backgroundIntensity: "${config.theme.defaults.backgroundIntensity}",
    gradientPattern: "${config.theme.defaults.gradientPattern}",
    mode: "${config.theme.defaults.mode}",
    density: "${config.theme.defaults.density}",
    elevation: "${config.theme.defaults.elevation}",
    radius: "${config.theme.defaults.radius}",
    fontSize: "${config.theme.defaults.fontSize}",
    outerGlow: "${config.theme.defaults.outerGlow}",
    innerGlow: "${config.theme.defaults.innerGlow}",
    sidebarSelection: "${config.theme.defaults.sidebarSelection}",
    contrast: "${config.theme.defaults.contrast}",
    darkAccentChroma: "${config.theme.defaults.darkAccentChroma}",
    tintWithAccent: "${config.theme.defaults.tintWithAccent}",
    signalColor: "${config.theme.defaults.signalColor}",
  },
  switcher: {
    enabled: ${config.theme.switcher.enabled},
    axes: {
      mode: ${config.theme.switcher.axes.mode},
      accentColor: ${config.theme.switcher.axes.accentColor},
      surfaceColor: ${config.theme.switcher.axes.surfaceColor},
      style: ${config.theme.switcher.axes.style},
      preset: ${config.theme.switcher.axes.preset},
      glassTransparency: ${config.theme.switcher.axes.glassTransparency},
      glassBlur: ${config.theme.switcher.axes.glassBlur},
      font: ${config.theme.switcher.axes.font},
      headingFont: ${config.theme.switcher.axes.headingFont},
      backgroundStyle: ${config.theme.switcher.axes.backgroundStyle},
      backgroundIntensity: ${config.theme.switcher.axes.backgroundIntensity},
      gradientPattern: ${config.theme.switcher.axes.gradientPattern},
      density: ${config.theme.switcher.axes.density},
      elevation: ${config.theme.switcher.axes.elevation},
      radius: ${config.theme.switcher.axes.radius},
      fontSize: ${config.theme.switcher.axes.fontSize},
      outerGlow: ${config.theme.switcher.axes.outerGlow},
      innerGlow: ${config.theme.switcher.axes.innerGlow},
      sidebarSelection: ${config.theme.switcher.axes.sidebarSelection},
      contrast: ${config.theme.switcher.axes.contrast},
      darkAccentChroma: ${config.theme.switcher.axes.darkAccentChroma},
      tintWithAccent: ${config.theme.switcher.axes.tintWithAccent},
      signalColor: ${config.theme.switcher.axes.signalColor},
    },
  },
}
`
mkdirSync(resolve(projectDir, "src"), { recursive: true })
writeFileSync(resolve(projectDir, "src/theme.config.ts"), themeConfigContent)
console.log("  Generated src/theme.config.ts")

// 2. Generate app.tsx with chosen layout
const layoutMap = {
  sidebar: "SidebarLayout",
  stacked: "StackedLayout",
  "top-nav": "TopNavLayout",
  "split-panel": "SplitPanelLayout",
}

const layoutComponent = layoutMap[config.layout] || layoutMap.sidebar

const imports = [`import { ThemeProvider } from "darkraise-ui/theme"`]
if (config.theme.switcher.enabled) {
  imports.push(`import { ThemeSwitcher } from "darkraise-ui/theme"`)
}
imports.push(`import { ${layoutComponent} } from "darkraise-ui/layout"`)

const themeSwitcherJsx = config.theme.switcher.enabled
  ? "\n          <ThemeSwitcher />"
  : ""

const appTsx = `${imports.join("\n")}

export function App() {
  return (
    <ThemeProvider>
      <${layoutComponent} nav={[]}>
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <h1 className="text-4xl font-medium">Welcome</h1>
          <p className="text-muted-foreground">
            Your project is ready. Start building in src/app.tsx
          </p>${themeSwitcherJsx}
        </div>
      </${layoutComponent}>
    </ThemeProvider>
  )
}
`
writeFileSync(resolve(projectDir, "src/app.tsx"), appTsx)
console.log("  Created src/app.tsx")

// 3. Generate globals.css
mkdirSync(resolve(projectDir, "src/styles"), { recursive: true })
writeFileSync(
  resolve(projectDir, "src/styles/globals.css"),
  '@import "darkraise-ui/styles.css";\n',
)
console.log("  Created src/styles/globals.css")

// 4. Generate vite.config.ts
const viteConfig = `import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "${config.server.host}",
    port: ${config.server.port},
  },
})
`
writeFileSync(resolve(projectDir, "vite.config.ts"), viteConfig)
console.log("  Generated vite.config.ts")

console.log(`
Done! Next steps:

  npm install
  npm run dev

The project uses darkraise-ui which includes:
  - 90+ UI components (import from "darkraise-ui")
  - 60+ hooks (import from "darkraise-ui/hooks")
  - 23-axis theming system (import from "darkraise-ui/theme")
  - 4 layout variants (import from "darkraise-ui/layout")
  - Error pages (import from "darkraise-ui/errors")
  - Form helpers (import from "darkraise-ui/forms")
  - Data table (import from "darkraise-ui/data-table")
`)
