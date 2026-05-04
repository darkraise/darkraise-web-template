#!/usr/bin/env node

/**
 * Standalone initializer for projects that already have darkraise-ui installed.
 * Generates theme.config.ts and app.tsx from a config JSON argument.
 *
 * Usage:
 *   node scripts/init.mjs <project-name> [config-json]
 */

import { mkdirSync, writeFileSync } from "fs"
import { basename, resolve } from "path"

const projectDir = resolve(import.meta.dirname, "..")
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
      surfaceColor: "slate",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      mode: "system",
      density: "cozy",
      elevation: "medium",
      buttonElevation: "flat",
    },
    switcher: {
      enabled: true,
      axes: {
        mode: true,
        accentColor: true,
        surfaceColor: true,
        surfaceStyle: true,
        backgroundStyle: true,
        density: true,
        elevation: true,
        buttonElevation: true,
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
const themeConfigContent = `import type {
  AccentColor,
  SurfaceColor,
  SurfaceStyle,
  BackgroundStyle,
  Density,
  Elevation,
  Mode,
} from "darkraise-ui/theme"

export interface ThemeConfig {
  defaults: {
    accentColor: AccentColor
    surfaceColor: SurfaceColor
    surfaceStyle: SurfaceStyle
    backgroundStyle: BackgroundStyle
    mode: Mode
    density: Density
    elevation: Elevation
    buttonElevation: Elevation
  }
  switcher: {
    enabled: boolean
    axes: {
      mode: boolean
      accentColor: boolean
      surfaceColor: boolean
      surfaceStyle: boolean
      backgroundStyle: boolean
      density: boolean
      elevation: boolean
      buttonElevation: boolean
    }
  }
}

export const themeConfig: ThemeConfig = {
  defaults: {
    accentColor: "${config.theme.defaults.accentColor}",
    surfaceColor: "${config.theme.defaults.surfaceColor}",
    surfaceStyle: "${config.theme.defaults.surfaceStyle}",
    backgroundStyle: "${config.theme.defaults.backgroundStyle}",
    mode: "${config.theme.defaults.mode}",
    density: "${config.theme.defaults.density}",
    elevation: "${config.theme.defaults.elevation}",
    buttonElevation: "${config.theme.defaults.buttonElevation}",
  },
  switcher: {
    enabled: ${config.theme.switcher.enabled},
    axes: {
      mode: ${config.theme.switcher.axes.mode},
      accentColor: ${config.theme.switcher.axes.accentColor},
      surfaceColor: ${config.theme.switcher.axes.surfaceColor},
      surfaceStyle: ${config.theme.switcher.axes.surfaceStyle},
      backgroundStyle: ${config.theme.switcher.axes.backgroundStyle},
      density: ${config.theme.switcher.axes.density},
      elevation: ${config.theme.switcher.axes.elevation},
      buttonElevation: ${config.theme.switcher.axes.buttonElevation},
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
writeFileSync(resolve(projectDir, "src/styles/globals.css"), '@import "darkraise-ui/styles.css";\n')
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
  - 47 UI components (import from "darkraise-ui/components/*")
  - 38 hooks (import from "darkraise-ui/hooks")
  - 6-axis theming system (import from "darkraise-ui/theme")
  - 4 layout variants (import from "darkraise-ui/layout")
  - Error pages (import from "darkraise-ui/errors")
  - Form helpers (import from "darkraise-ui/forms")
  - Data table (import from "darkraise-ui/data-table")
`)
