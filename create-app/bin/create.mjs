#!/usr/bin/env node

import { execFileSync } from "child_process"
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { resolve } from "path"
import * as p from "@clack/prompts"
import minimist from "minimist"

async function latestVersion(pkg) {
  try {
    const res = await fetch(`https://registry.npmjs.org/${pkg}/latest`)
    const data = await res.json()
    return `^${data.version}`
  } catch {
    return "latest"
  }
}

const ACCENT_COLORS = [
  "red", "orange", "amber", "yellow", "lime", "green", "emerald",
  "teal", "cyan", "sky", "blue", "indigo", "violet", "purple",
  "fuchsia", "pink", "rose",
]
const SURFACE_COLORS = ["slate", ...ACCENT_COLORS]
const SURFACE_STYLES = ["default", "glassmorphism"]
const BACKGROUND_STYLES = ["solid", "gradient"]
const MODES = ["light", "dark", "system"]
const LAYOUTS = ["sidebar", "stacked", "top-nav", "split-panel"]
const THEME_AXIS_KEYS = [
  "mode", "accentColor", "surfaceColor", "surfaceStyle", "backgroundStyle",
]

const argv = minimist(process.argv.slice(2), {
  boolean: ["y"],
  string: [
    "layout", "accent", "surface-color", "surface-style",
    "background", "mode", "theme-axes",
    "host", "port",
  ],
  alias: { y: "yes" },
})

const skipPrompts = argv.y || argv.yes

function resolveBoolFlag(argv, name) {
  if (argv[name] === true || argv[name] === "true") return true
  if (argv[name] === false || argv[name] === "false") return false
  if (argv[`no-${name}`] === true || argv[`no-${name}`] === "true") return false
  return undefined
}

const themeSwitcherFlag = resolveBoolFlag(argv, "theme-switcher")

function validate(value, allowed, label) {
  if (value !== undefined && !allowed.includes(value)) {
    console.error(`Error: invalid ${label} "${value}". Allowed: ${allowed.join(", ")}`)
    process.exit(1)
  }
}

validate(argv.layout, LAYOUTS, "layout")
validate(argv.accent, ACCENT_COLORS, "accent color")
validate(argv["surface-color"], SURFACE_COLORS, "surface color")
validate(argv["surface-style"], SURFACE_STYLES, "surface style")
validate(argv.background, BACKGROUND_STYLES, "background")
validate(argv.mode, MODES, "mode")

if (argv["theme-axes"] !== undefined) {
  const axes = argv["theme-axes"].split(",")
  for (const axis of axes) {
    if (!THEME_AXIS_KEYS.includes(axis)) {
      console.error(`Error: invalid theme axis "${axis}". Allowed: ${THEME_AXIS_KEYS.join(", ")}`)
      process.exit(1)
    }
  }
}

function cancelled(value) {
  if (p.isCancel(value)) {
    p.cancel("Setup cancelled.")
    process.exit(0)
  }
  return value
}

function writeProjectFile(targetDir, relPath, content) {
  const fullPath = resolve(targetDir, relPath)
  mkdirSync(resolve(fullPath, ".."), { recursive: true })
  writeFileSync(fullPath, content)
}

async function main() {
  p.intro("create-darkraise-web-template")

  // --- Project name ---
  let projectName = argv._[0]
  if (!projectName && !skipPrompts) {
    projectName = cancelled(
      await p.text({
        message: "Project name",
        placeholder: "my-app",
        validate: (v) => {
          if (!v) return "Project name is required"
          if (!/^[a-zA-Z0-9_-]+$/.test(v))
            return "Only letters, numbers, hyphens, and underscores"
        },
      }),
    )
  }

  if (!projectName) {
    p.cancel("Project name is required. Pass it as the first argument or run without -y.")
    process.exit(1)
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(projectName)) {
    p.cancel("Project name must contain only letters, numbers, hyphens, and underscores.")
    process.exit(1)
  }

  const targetDir = resolve(process.cwd(), projectName)
  if (existsSync(targetDir)) {
    p.cancel(`Directory "${projectName}" already exists.`)
    process.exit(1)
  }

  // --- Layout ---
  const layout = argv.layout || (skipPrompts ? "sidebar" : cancelled(
    await p.select({
      message: "Layout",
      options: LAYOUTS.map((l) => ({ value: l, label: l })),
      initialValue: "sidebar",
    }),
  ))

  // --- Theme defaults ---
  const accent = argv.accent || (skipPrompts ? "blue" : cancelled(
    await p.select({
      message: "Accent color",
      options: ACCENT_COLORS.map((c) => ({ value: c, label: c })),
      initialValue: "blue",
    }),
  ))

  const surfaceColor = argv["surface-color"] || (skipPrompts ? "slate" : cancelled(
    await p.select({
      message: "Surface color",
      options: SURFACE_COLORS.map((c) => ({ value: c, label: c })),
      initialValue: "slate",
    }),
  ))

  const surfaceStyle = argv["surface-style"] || (skipPrompts ? "default" : cancelled(
    await p.select({
      message: "Surface style",
      options: SURFACE_STYLES.map((s) => ({ value: s, label: s })),
      initialValue: "default",
    }),
  ))

  const background = argv.background || (skipPrompts ? "solid" : cancelled(
    await p.select({
      message: "Background",
      options: BACKGROUND_STYLES.map((b) => ({ value: b, label: b })),
      initialValue: "solid",
    }),
  ))

  const mode = argv.mode || (skipPrompts ? "system" : cancelled(
    await p.select({
      message: "Mode",
      options: MODES.map((m) => ({ value: m, label: m })),
      initialValue: "system",
    }),
  ))

  // --- Theme switcher ---
  let themeSwitcherEnabled
  if (themeSwitcherFlag !== undefined) {
    themeSwitcherEnabled = themeSwitcherFlag
  } else if (skipPrompts) {
    themeSwitcherEnabled = true
  } else {
    themeSwitcherEnabled = cancelled(
      await p.confirm({
        message: "Include theme switcher?",
        initialValue: true,
      }),
    )
  }

  let themeAxes = THEME_AXIS_KEYS
  if (themeSwitcherEnabled) {
    if (argv["theme-axes"] !== undefined) {
      themeAxes = argv["theme-axes"].split(",")
    } else if (!skipPrompts) {
      themeAxes = cancelled(
        await p.multiselect({
          message: "Configurable theme axes",
          options: [
            { value: "mode", label: "Mode (light/dark/system)" },
            { value: "accentColor", label: "Accent color" },
            { value: "surfaceColor", label: "Surface color" },
            { value: "surfaceStyle", label: "Surface style" },
            { value: "backgroundStyle", label: "Background" },
          ],
          initialValues: THEME_AXIS_KEYS,
        }),
      )
    }
  }

  if (argv["theme-axes"] !== undefined && !themeSwitcherEnabled) {
    p.log.warn("--theme-axes is ignored when theme switcher is disabled.")
  }

  // --- Server ---
  const host = argv.host || (skipPrompts ? "localhost" : cancelled(
    await p.text({
      message: "Dev server host",
      placeholder: "localhost",
      initialValue: "localhost",
    }),
  ))

  const port = argv.port
    ? Number(argv.port)
    : skipPrompts
      ? 5173
      : Number(cancelled(
          await p.text({
            message: "Dev server port",
            placeholder: "5173",
            initialValue: "5173",
            validate: (v) => {
              const n = Number(v)
              if (!Number.isInteger(n) || n < 1 || n > 65535) return "Must be a valid port (1-65535)"
            },
          }),
        ))

  // --- Scaffold ---
  const config = {
    layout,
    theme: {
      defaults: {
        accentColor: accent,
        surfaceColor: surfaceColor,
        surfaceStyle: surfaceStyle,
        backgroundStyle: background,
        mode: mode,
      },
      switcher: {
        enabled: themeSwitcherEnabled,
        axes: Object.fromEntries(
          THEME_AXIS_KEYS.map((key) => [key, themeSwitcherEnabled && themeAxes.includes(key)]),
        ),
      },
    },
    server: { host, port },
  }

  p.log.step("Resolving latest package versions...")
  const [darkraiseUiVersion, reactVersion] = await Promise.all([
    latestVersion("darkraise-ui"),
    latestVersion("react"),
  ])

  p.log.step("Scaffolding project...")
  mkdirSync(targetDir, { recursive: true })

  // --- package.json ---
  const pkg = {
    name: projectName,
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: {
      dev: "vite",
      build: "tsc --noEmit && vite build",
      preview: "vite preview",
      typecheck: "tsc --noEmit",
      lint: "eslint src/",
    },
    dependencies: {
      "darkraise-ui": darkraiseUiVersion,
      react: reactVersion,
      "react-dom": reactVersion,
    },
    devDependencies: {
      "@tailwindcss/vite": "^4.0.0",
      "@types/node": "^22.0.0",
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
      "@vitejs/plugin-react-swc": "^4.0.0",
      eslint: "^9.0.0",
      tailwindcss: "^4.0.0",
      typescript: "~5.7.0",
      vite: "^6.0.0",
    },
  }
  writeProjectFile(targetDir, "package.json", JSON.stringify(pkg, null, 2) + "\n")

  // --- index.html ---
  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
    <script>
      ;(function () {
        var mode = localStorage.getItem("mode") || "system"
        var resolved =
          mode === "system"
            ? window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "dark"
              : "light"
            : mode
        document.documentElement.setAttribute("data-mode", resolved)
      })()
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
  writeProjectFile(targetDir, "index.html", indexHtml)

  // --- vite.config.ts ---
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
  writeProjectFile(targetDir, "vite.config.ts", viteConfig)

  // --- tsconfig.json ---
  const tsconfig = {
    compilerOptions: {
      target: "ES2020",
      useDefineForClassFields: true,
      lib: ["ES2020", "DOM", "DOM.Iterable"],
      module: "ESNext",
      skipLibCheck: true,
      moduleResolution: "bundler",
      allowImportingTsExtensions: true,
      isolatedModules: true,
      moduleDetection: "force",
      noEmit: true,
      jsx: "react-jsx",
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
      noUncheckedIndexedAccess: true,
      paths: { "@/*": ["./src/*"] },
    },
    include: ["src"],
  }
  writeProjectFile(targetDir, "tsconfig.json", JSON.stringify(tsconfig, null, 2) + "\n")

  // --- src/styles/globals.css ---
  writeProjectFile(targetDir, "src/styles/globals.css", '@import "darkraise-ui/styles.css";\n')

  // --- src/main.tsx ---
  const mainTsx = `import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./app"
import "./styles/globals.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`
  writeProjectFile(targetDir, "src/main.tsx", mainTsx)

  // --- src/theme.config.ts ---
  const themeConfigContent = `import type { ThemeConfig } from "darkraise-ui/theme"

export const themeConfig: ThemeConfig = {
  defaults: {
    accentColor: "${config.theme.defaults.accentColor}",
    surfaceColor: "${config.theme.defaults.surfaceColor}",
    surfaceStyle: "${config.theme.defaults.surfaceStyle}",
    backgroundStyle: "${config.theme.defaults.backgroundStyle}",
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
    },
  },
}
`
  writeProjectFile(targetDir, "src/theme.config.ts", themeConfigContent)

  // --- src/app.tsx ---
  const layoutMap = {
    sidebar: "SidebarLayout",
    stacked: "StackedLayout",
    "top-nav": "TopNavLayout",
    "split-panel": "SplitPanelLayout",
  }
  const layoutComponent = layoutMap[config.layout] || layoutMap.sidebar

  const imports = [
    `import { ThemeProvider } from "darkraise-ui/theme"`,
    `import { ${layoutComponent} } from "darkraise-ui/layout"`,
    `import { themeConfig } from "./theme.config"`,
  ]

  const showThemeSwitcher = config.theme.switcher.enabled

  const appTsx = `${imports.join("\n")}

export function App() {
  return (
    <ThemeProvider config={themeConfig}>
      <${layoutComponent}
        nav={[]}
        showThemeSwitcher={${showThemeSwitcher}}
      >
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <h1 className="text-4xl font-medium">Welcome</h1>
          <p className="text-muted-foreground">
            Your project is ready. Start building in src/app.tsx
          </p>
        </div>
      </${layoutComponent}>
    </ThemeProvider>
  )
}
`
  writeProjectFile(targetDir, "src/app.tsx", appTsx)

  // --- .gitignore ---
  const gitignore = `node_modules
dist
*.local
.env
.env.*
!.env.example
`
  writeProjectFile(targetDir, ".gitignore", gitignore)

  // --- env.d.ts ---
  writeProjectFile(targetDir, "src/env.d.ts", '/// <reference types="vite/client" />\n')

  p.log.step(`Generated ${Object.keys(pkg.dependencies).length + Object.keys(pkg.devDependencies).length} dependencies`)

  p.log.step("Installing dependencies...")
  execFileSync("npm", ["install"], { cwd: targetDir, stdio: "inherit", shell: true })

  p.log.step("Initializing git repository...")
  execFileSync("git", ["init"], { cwd: targetDir, stdio: "inherit" })
  execFileSync("git", ["add", "-A"], { cwd: targetDir, stdio: "inherit" })
  execFileSync("git", ["commit", "-m", "chore: initialize project"], {
    cwd: targetDir,
    stdio: "inherit",
  })

  p.outro(`Success! Created ${projectName} at ${targetDir}

  cd ${projectName}
  npm run dev        Start development server`)
}

main().catch((err) => {
  p.cancel(err.message)
  process.exit(1)
})
