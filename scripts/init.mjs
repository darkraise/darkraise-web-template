#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs"
import { basename, resolve } from "path"

const projectDir = resolve(import.meta.dirname, "..")
const args = process.argv.slice(2)
const projectName = args[0] || basename(projectDir)

const defaultConfig = {
  layout: "sidebar",
  theme: {
    defaults: {
      accentColor: "blue",
      surfaceColor: "slate",
      surfaceStyle: "default",
      backgroundStyle: "solid",
      fontFamily: "default",
      mode: "system",
    },
    switcher: {
      enabled: true,
      axes: {
        mode: true,
        accentColor: true,
        surfaceColor: true,
        surfaceStyle: true,
        backgroundStyle: true,
        fontFamily: true,
      },
    },
  },
  auth: true,
}

let config = defaultConfig
if (args[1]) {
  try {
    config = { ...defaultConfig, ...JSON.parse(args[1]) }
  } catch {
    console.error("Warning: could not parse config JSON, using defaults.")
  }
}

console.log(`\nInitializing project: ${projectName}\n`)

// 1. Remove demo-specific code
const removeDirs = [
  "src/demo",
  "src/routes",
  "src/features/charts",
  "src/features/dashboard",
  "src/features/data-table",
  "src/features/products",
  "create-app",
  "e2e",
  "playwright-report",
  "test-results",
  "dist",
]

if (!config.auth) {
  removeDirs.push("src/features/auth")
}

for (const dir of removeDirs) {
  const fullPath = resolve(projectDir, dir)
  if (existsSync(fullPath)) {
    rmSync(fullPath, { recursive: true })
    console.log(`  Removed ${dir}/`)
  }
}

// 2. Generate theme.config.ts
const themeConfigContent = `import type {
  AccentColor,
  SurfaceColor,
  SurfaceStyle,
  BackgroundStyle,
  FontFamily,
  Mode,
} from "./types"

export interface ThemeConfig {
  defaults: {
    accentColor: AccentColor
    surfaceColor: SurfaceColor
    surfaceStyle: SurfaceStyle
    backgroundStyle: BackgroundStyle
    fontFamily: FontFamily
    mode: Mode
  }
  switcher: {
    enabled: boolean
    axes: {
      mode: boolean
      accentColor: boolean
      surfaceColor: boolean
      surfaceStyle: boolean
      backgroundStyle: boolean
      fontFamily: boolean
    }
  }
}

export const themeConfig: ThemeConfig = {
  defaults: {
    accentColor: "${config.theme.defaults.accentColor}",
    surfaceColor: "${config.theme.defaults.surfaceColor}",
    surfaceStyle: "${config.theme.defaults.surfaceStyle}",
    backgroundStyle: "${config.theme.defaults.backgroundStyle}",
    fontFamily: "${config.theme.defaults.fontFamily}",
    mode: "${config.theme.defaults.mode}",
  },
  switcher: {
    enabled: ${config.theme.switcher.enabled},
    axes: {
      mode: ${config.theme.switcher.axes.mode},
      accentColor: ${config.theme.switcher.axes.accentColor},
      surfaceColor: ${config.theme.switcher.axes.surfaceColor},
      surfaceStyle: ${config.theme.switcher.axes.surfaceStyle},
      backgroundStyle: ${config.theme.switcher.axes.backgroundStyle},
      fontFamily: ${config.theme.switcher.axes.fontFamily},
    },
  },
}
`
writeFileSync(resolve(projectDir, "src/core/theme/theme.config.ts"), themeConfigContent)
console.log("  Generated src/core/theme/theme.config.ts")

// 3. Generate app.tsx with chosen layout
const layoutMap = {
  sidebar: { component: "SidebarLayout", import: "SidebarLayout" },
  stacked: { component: "StackedLayout", import: "StackedLayout" },
  "top-nav": { component: "TopNavLayout", import: "TopNavLayout" },
  "split-panel": { component: "SplitPanelLayout", import: "SplitPanelLayout" },
}

const layoutInfo = layoutMap[config.layout] || layoutMap.sidebar
const themeSwitcherImport = config.theme.switcher.enabled
  ? `import { ThemeSwitcher } from "@/core/theme"\n`
  : ""
const themeSwitcherJsx = config.theme.switcher.enabled
  ? "\n          <ThemeSwitcher />"
  : ""

const appTsx = `import { ThemeProvider } from "@/core/theme"
${themeSwitcherImport}import { ${layoutInfo.import} } from "@/core/layout"

export function App() {
  return (
    <ThemeProvider>
      <${layoutInfo.component} nav={[]}>
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <h1 className="text-4xl font-medium">Welcome</h1>
          <p className="text-muted-foreground">
            Your project is ready. Start building in src/App.tsx
          </p>${themeSwitcherJsx}
        </div>
      </${layoutInfo.component}>
    </ThemeProvider>
  )
}
`
writeFileSync(resolve(projectDir, "src/app.tsx"), appTsx)
console.log("  Created src/app.tsx")

// 4. Create minimal routes directory with placeholder
mkdirSync(resolve(projectDir, "src/routes"), { recursive: true })
console.log("  Created src/routes/")

// 5. Update package.json
const pkgPath = resolve(projectDir, "package.json")
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"))
pkg.name = projectName
pkg.version = "0.1.0"
delete pkg.repository
delete pkg.bugs
delete pkg.homepage

const demoDeps = [
  "@tanstack/react-form",
  "@tanstack/react-query",
  "@tanstack/react-router",
  "@tanstack/react-table",
  "recharts",
  "zustand",
]
for (const dep of demoDeps) {
  delete pkg.dependencies[dep]
}

const demoDevDeps = [
  "@tanstack/router-plugin",
  "@playwright/test",
  "@vitest/browser-playwright",
  "playwright",
]
for (const dep of demoDevDeps) {
  delete pkg.devDependencies[dep]
}

delete pkg.scripts["test:e2e"]
delete pkg.scripts["build:analyze"]

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n")
console.log("  Updated package.json")

// 6. Update index.html title
const htmlPath = resolve(projectDir, "index.html")
let html = readFileSync(htmlPath, "utf-8")
html = html.replace("<title>Web Template</title>", `<title>${projectName}</title>`)
writeFileSync(htmlPath, html)
console.log("  Updated index.html title")

// 7. Clean up init script and scripts dir
rmSync(resolve(projectDir, "scripts"), { recursive: true })
console.log("  Removed scripts/")

const authNote = config.auth
  ? "  - Auth flow in src/features/auth/"
  : ""

console.log(`
Done! Next steps:

  npm install
  npm run dev

The template includes:
  - 24 UI primitives in src/core/components/ui/
  - 6-axis theming system (accent, surface, style, background, font, mode)
  - 4 layout variants (sidebar, stacked, top-nav, split-panel)
  - Storybook with theme-aware decorators
  - TypeScript strict mode, ESLint, Prettier, Husky hooks
${authNote}`)
