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
const PRESETS = ["default", "glass", "scifi"]
const BACKGROUND_STYLES = ["solid", "gradient"]
const BACKGROUND_INTENSITIES = [
  "neutral",
  "subtle",
  "balanced",
  "vivid",
  "intense",
]
const GRADIENT_PATTERNS = ["blobs", "aurora", "spotlight", "mesh"]
const DENSITIES = ["compact", "cozy", "comfortable", "spacious"]
const ELEVATIONS = ["flat", "low", "medium", "high"]
const RADII = ["sharp", "subtle", "rounded", "pill"]
const CONTROL_DEPTHS = ["flush", "subtle", "recessed", "deep"]
const SHELL_STYLES = ["classic", "inset", "island", "floating", "framed", "flat"]
const FONT_SIZES = ["small", "medium", "large", "extra-large"]
const ACCENT_INTENSITIES = ["calm", "balanced", "vivid", "intense"]
const GLOW_LEVELS = ["none", "subtle", "balanced", "vivid"]
const SURFACE_INTENSITIES = ["flat", "subtle", "balanced", "bold"]
const MODES = ["light", "dark", "system"]
const LAYOUTS = ["sidebar", "stacked", "top-nav", "split-panel"]
// Mirrors `ThemeConfig.switcher.axes` in
// packages/ui/src/theme/themeConfig.ts. `presetAxes` is a master
// toggle for whether the per-preset axis controls (e.g. glass blur,
// scifi frame) appear in the switcher panel.
const THEME_AXIS_KEYS = [
  "mode", "accentColor", "surfaceColor", "preset",
  "backgroundStyle", "backgroundIntensity", "gradientPattern",
  "density", "elevation", "buttonElevation", "surfaceIntensity", "radius", "fontSize",
  "accentIntensity", "controlDepth", "shellStyle", "outerGlow", "innerGlow", "presetAxes",
]

const argv = minimist(process.argv.slice(2), {
  boolean: ["y"],
  string: [
    "layout", "accent", "surface-color", "preset",
    "background", "background-intensity", "gradient-pattern",
    "mode", "theme-axes",
    "density", "elevation", "button-elevation", "surface-intensity", "radius", "font-size",
    "accent-intensity", "control-depth", "shell-style", "outer-glow", "inner-glow",
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
validate(argv.preset, PRESETS, "preset")
validate(argv.background, BACKGROUND_STYLES, "background")
validate(argv["background-intensity"], BACKGROUND_INTENSITIES, "background-intensity")
validate(argv["gradient-pattern"], GRADIENT_PATTERNS, "gradient-pattern")
validate(argv.mode, MODES, "mode")
validate(argv.density, DENSITIES, "density")
validate(argv.elevation, ELEVATIONS, "elevation")
validate(argv["button-elevation"], ELEVATIONS, "button-elevation")
validate(argv["surface-intensity"], SURFACE_INTENSITIES, "surface-intensity")
validate(argv.radius, RADII, "radius")
validate(argv["control-depth"], CONTROL_DEPTHS, "control-depth")
validate(argv["shell-style"], SHELL_STYLES, "shell-style")
validate(argv["font-size"], FONT_SIZES, "font-size")
validate(argv["accent-intensity"], ACCENT_INTENSITIES, "accent-intensity")
validate(argv["outer-glow"], GLOW_LEVELS, "outer-glow")
validate(argv["inner-glow"], GLOW_LEVELS, "inner-glow")

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
  p.intro("create-darkraise-ui")

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

  const preset = argv.preset || (skipPrompts ? "default" : cancelled(
    await p.select({
      message: "Preset",
      options: PRESETS.map((s) => ({ value: s, label: s })),
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

  const backgroundIntensity = argv["background-intensity"] || (skipPrompts ? "balanced" : cancelled(
    await p.select({
      message: "Background intensity",
      options: BACKGROUND_INTENSITIES.map((i) => ({ value: i, label: i })),
      initialValue: "balanced",
    }),
  ))

  const gradientPattern = argv["gradient-pattern"] || (skipPrompts ? "blobs" : cancelled(
    await p.select({
      message: "Gradient pattern",
      options: GRADIENT_PATTERNS.map((g) => ({ value: g, label: g })),
      initialValue: "blobs",
    }),
  ))

  const mode = argv.mode || (skipPrompts ? "system" : cancelled(
    await p.select({
      message: "Mode",
      options: MODES.map((m) => ({ value: m, label: m })),
      initialValue: "system",
    }),
  ))

  const density = argv.density || (skipPrompts ? "cozy" : cancelled(
    await p.select({
      message: "Density",
      options: DENSITIES.map((d) => ({ value: d, label: d })),
      initialValue: "cozy",
    }),
  ))

  const elevation = argv.elevation || (skipPrompts ? "medium" : cancelled(
    await p.select({
      message: "Elevation",
      options: ELEVATIONS.map((e) => ({ value: e, label: e })),
      initialValue: "medium",
    }),
  ))

  const buttonElevation = argv["button-elevation"] || (skipPrompts ? "flat" : cancelled(
    await p.select({
      message: "Button elevation",
      options: ELEVATIONS.map((e) => ({ value: e, label: e })),
      initialValue: "flat",
    }),
  ))

  const surfaceIntensity = argv["surface-intensity"] || (skipPrompts ? "balanced" : cancelled(
    await p.select({
      message: "Surface intensity",
      options: SURFACE_INTENSITIES.map((s) => ({ value: s, label: s })),
      initialValue: "balanced",
    }),
  ))

  const radius = argv.radius || (skipPrompts ? "rounded" : cancelled(
    await p.select({
      message: "Radius",
      options: RADII.map((r) => ({ value: r, label: r })),
      initialValue: "rounded",
    }),
  ))

  const controlDepth = argv["control-depth"] || (skipPrompts ? "recessed" : cancelled(
    await p.select({
      message: "Control depth",
      options: CONTROL_DEPTHS.map((d) => ({ value: d, label: d })),
      initialValue: "recessed",
    }),
  ))

  const shellStyle = argv["shell-style"] || (skipPrompts ? "classic" : cancelled(
    await p.select({
      message: "Shell style",
      options: SHELL_STYLES.map((v) => ({ value: v, label: v })),
      initialValue: "classic",
    }),
  ))

  const fontSize = argv["font-size"] || (skipPrompts ? "medium" : cancelled(
    await p.select({
      message: "Font size",
      options: FONT_SIZES.map((f) => ({ value: f, label: f })),
      initialValue: "medium",
    }),
  ))

  const accentIntensity = argv["accent-intensity"] || (skipPrompts ? "balanced" : cancelled(
    await p.select({
      message: "Accent intensity",
      options: ACCENT_INTENSITIES.map((v) => ({ value: v, label: v })),
      initialValue: "balanced",
    }),
  ))

  // Glow ships at "none" so a new project looks the same as before the axes
  // existed; presets that own a glow supply their own default at runtime.
  // Flag-only rather than prompted, to keep the interactive flow short.
  const outerGlow = argv["outer-glow"] || "none"
  const innerGlow = argv["inner-glow"] || "none"


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
            { value: "preset", label: "Preset (default/glass/scifi)" },
            { value: "backgroundStyle", label: "Background style" },
            { value: "backgroundIntensity", label: "Background intensity" },
            { value: "gradientPattern", label: "Gradient pattern" },
            { value: "density", label: "Density" },
            { value: "elevation", label: "Elevation" },
            { value: "buttonElevation", label: "Button elevation" },
            { value: "surfaceIntensity", label: "Surface intensity" },
            { value: "radius", label: "Radius" },
            { value: "fontSize", label: "Font size" },
            { value: "accentIntensity", label: "Accent intensity" },
            { value: "controlDepth", label: "Control depth" },
            { value: "shellStyle", label: "Shell style" },
            { value: "outerGlow", label: "Outer glow" },
            { value: "innerGlow", label: "Inner glow" },
            { value: "presetAxes", label: "Preset-specific axes (e.g. glass blur, scifi frame)" },
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
        preset: preset,
        backgroundStyle: background,
        backgroundIntensity: backgroundIntensity,
        gradientPattern: gradientPattern,
        mode: mode,
        density: density,
        elevation: elevation,
        buttonElevation: buttonElevation,
        surfaceIntensity: surfaceIntensity,
        radius: radius,
        controlDepth: controlDepth,
        shellStyle: shellStyle,
        fontSize: fontSize,
        accentIntensity: accentIntensity,
        outerGlow: outerGlow,
        innerGlow: innerGlow,
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
      build: "vite build && tsc --noEmit",
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

        // Restore every attribute-driven theme axis before React mounts
        // so the first paint matches the persisted theme. The
        // attribute-name to localStorage-key map mirrors
        // packages/ui/src/theme/theme-provider/ThemeProvider.tsx —
        // note "theme-bg-style" / "theme-bg-intensity" are NOT just
        // kebab-cased "background-*" keys.
        var AXIS_LS_KEYS = {
          "preset": "theme-preset",
          "background-style": "theme-bg-style",
          "background-intensity": "theme-bg-intensity",
          "gradient-pattern": "theme-gradient-pattern",
          "density": "theme-density",
          "elevation": "theme-elevation",
          "button-elevation": "theme-button-elevation",
          "surface-intensity": "theme-surface-intensity",
          "radius": "theme-radius",
          "control-depth": "theme-control-depth",
          "shell-style": "theme-shell-style",
          "font-size": "theme-font-size",
          "outer-glow": "theme-outer-glow",
          "inner-glow": "theme-inner-glow",
        }
        // Presets that reinterpret an axis neutralise it rather than merely
        // hiding its control, so restoring a stored value here would flash the
        // wrong surface treatment before hydration corrects it. Mirrors
        // NEUTRALISED_WHEN_HIDDEN + hiddenCommonAxes in the library.
        var NEUTRALISED_BY_PRESET = {
          glass: ["surface-intensity"],
          scifi: ["surface-intensity"],
        }
        var activePreset = localStorage.getItem("theme-preset") || ""
        var neutralised = NEUTRALISED_BY_PRESET[activePreset] || []
        Object.keys(AXIS_LS_KEYS).forEach(function (axis) {
          if (neutralised.indexOf(axis) !== -1) return
          var v = localStorage.getItem(AXIS_LS_KEYS[axis])
          if (v) document.documentElement.setAttribute("data-" + axis, v)
        })
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
  // Matches ThemeConfig in packages/ui/src/theme/themeConfig.ts.
  // The full type is re-exported by `darkraise-ui/theme` so consumers
  // import it directly rather than restating it here — that keeps the
  // scaffolded app schema-locked to whichever UI package version is
  // installed (the create script's defaults are just initial values).
  const themeConfigContent = `import type { ThemeConfig } from "darkraise-ui/theme"

export const themeConfig: ThemeConfig = {
  defaults: {
    accentColor: "${config.theme.defaults.accentColor}",
    surfaceColor: "${config.theme.defaults.surfaceColor}",
    preset: "${config.theme.defaults.preset}",
    backgroundStyle: "${config.theme.defaults.backgroundStyle}",
    backgroundIntensity: "${config.theme.defaults.backgroundIntensity}",
    gradientPattern: "${config.theme.defaults.gradientPattern}",
    mode: "${config.theme.defaults.mode}",
    density: "${config.theme.defaults.density}",
    elevation: "${config.theme.defaults.elevation}",
    buttonElevation: "${config.theme.defaults.buttonElevation}",
    surfaceIntensity: "${config.theme.defaults.surfaceIntensity}",
    radius: "${config.theme.defaults.radius}",
    controlDepth: "${config.theme.defaults.controlDepth}",
    shellStyle: "${config.theme.defaults.shellStyle}",
    fontSize: "${config.theme.defaults.fontSize}",
    accentIntensity: "${config.theme.defaults.accentIntensity}",
    outerGlow: "${config.theme.defaults.outerGlow}",
    innerGlow: "${config.theme.defaults.innerGlow}",
  },
  switcher: {
    enabled: ${config.theme.switcher.enabled},
    axes: {
      mode: ${config.theme.switcher.axes.mode},
      accentColor: ${config.theme.switcher.axes.accentColor},
      surfaceColor: ${config.theme.switcher.axes.surfaceColor},
      preset: ${config.theme.switcher.axes.preset},
      backgroundStyle: ${config.theme.switcher.axes.backgroundStyle},
      backgroundIntensity: ${config.theme.switcher.axes.backgroundIntensity},
      gradientPattern: ${config.theme.switcher.axes.gradientPattern},
      density: ${config.theme.switcher.axes.density},
      elevation: ${config.theme.switcher.axes.elevation},
      buttonElevation: ${config.theme.switcher.axes.buttonElevation},
      surfaceIntensity: ${config.theme.switcher.axes.surfaceIntensity},
      radius: ${config.theme.switcher.axes.radius},
      controlDepth: ${config.theme.switcher.axes.controlDepth},
      shellStyle: ${config.theme.switcher.axes.shellStyle},
      fontSize: ${config.theme.switcher.axes.fontSize},
      accentIntensity: ${config.theme.switcher.axes.accentIntensity},
      outerGlow: ${config.theme.switcher.axes.outerGlow},
      innerGlow: ${config.theme.switcher.axes.innerGlow},
      presetAxes: ${config.theme.switcher.axes.presetAxes},
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
