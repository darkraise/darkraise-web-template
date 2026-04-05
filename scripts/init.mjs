#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs"
import { basename, resolve } from "path"

const projectDir = resolve(import.meta.dirname, "..")
const args = process.argv.slice(2)
const projectName = args[0] || basename(projectDir)

console.log(`\nInitializing project: ${projectName}\n`)

// 1. Remove demo-specific code
const removeDirs = [
  "src/demo",
  "src/routes",
  "src/features/auth",
  "src/features/charts",
  "src/features/dashboard",
  "src/features/data-table",
  "src/features/products",
  "e2e",
  "playwright-report",
  "test-results",
  "dist",
]

for (const dir of removeDirs) {
  const fullPath = resolve(projectDir, dir)
  if (existsSync(fullPath)) {
    rmSync(fullPath, { recursive: true })
    console.log(`  Removed ${dir}/`)
  }
}

// 2. Create minimal app entry point
const appTsx = `import { ThemeProvider, ThemeSwitcher } from "@/core/theme"

export function App() {
  return (
    <ThemeProvider>
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <h1 className="text-4xl font-medium">Welcome</h1>
        <p className="text-muted-foreground">
          Your project is ready. Start building in src/App.tsx
        </p>
        <ThemeSwitcher />
      </div>
    </ThemeProvider>
  )
}
`
writeFileSync(resolve(projectDir, "src/app.tsx"), appTsx)
console.log("  Created src/app.tsx")

// 3. Create minimal routes directory with placeholder
mkdirSync(resolve(projectDir, "src/routes"), { recursive: true })
console.log("  Created src/routes/")

// 4. Update package.json
const pkgPath = resolve(projectDir, "package.json")
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"))
pkg.name = projectName
pkg.version = "0.1.0"
delete pkg.repository
delete pkg.bugs
delete pkg.homepage

// Remove demo-only dependencies
const demoDeps = [
  "@tanstack/react-form",
  "@tanstack/react-query",
  "@tanstack/react-router",
  "@tanstack/react-table",
  "recharts",
  "cmdk",
  "next-themes",
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

// Remove demo-only scripts
delete pkg.scripts["test:e2e"]
delete pkg.scripts["build:analyze"]

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n")
console.log("  Updated package.json")

// 5. Update index.html title
const htmlPath = resolve(projectDir, "index.html")
let html = readFileSync(htmlPath, "utf-8")
html = html.replace("<title>Web Template</title>", `<title>${projectName}</title>`)
writeFileSync(htmlPath, html)
console.log("  Updated index.html title")

// 6. Clean up init script and scripts dir
rmSync(resolve(projectDir, "scripts"), { recursive: true })
console.log("  Removed scripts/")

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
`)
