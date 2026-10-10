#!/usr/bin/env node

import { execFileSync } from "child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { resolve } from "path"
import * as p from "@clack/prompts"
import minimist from "minimist"
import {
  i18nTemplate,
  languageSwitcherTemplate,
  multilingualMain,
} from "./i18n-template.mjs"

async function latestVersion(pkg) {
  try {
    const res = await fetch(`https://registry.npmjs.org/${pkg}/latest`, {
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    return `^${data.version}`
  } catch {
    return "latest"
  }
}

// Generated from the kit's axis registry (pnpm --filter darkraise-ui
// write:scaffold-axes); a kit test fails when it drifts.
const AXES = JSON.parse(
  readFileSync(new URL("./axes.json", import.meta.url), "utf8"),
)
// A new app defines no presets, so the preset axis has nothing to offer and
// --preset keeps its 6.9.6 meaning in RETIRED_FLAGS.
const AXIS_KEYS = Object.keys(AXES).filter((key) => key !== "preset")
const LAYOUTS = ["sidebar", "stacked", "top-nav", "split-panel"]

// Two axes kept their 6.x flag names when the axis key changed.
const FLAG_ALIASES = { accentColor: "accent", backgroundStyle: "background" }

function flagOf(key) {
  return (
    FLAG_ALIASES[key] ?? key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
  )
}

const PROMPTED_KEYS = AXIS_KEYS.filter(
  (key) => AXES[key].layer === "brand" || key === "style",
)

// The 6.9.6 flags and --theme-axes names that 7.0 dropped. This is history,
// so the lists do not grow with the registry.
const RETIRED_FLAGS = {
  preset: "use --style",
  "surface-intensity": "use --contrast",
  "accent-intensity": "use --dark-accent-chroma",
  "shell-style": "set the layout's defaultShellStyle prop instead",
  "control-depth": "it has no replacement",
  "button-elevation": "it has no replacement",
}
const RETIRED_AXES = {
  preset: "use style",
  surfaceIntensity: "use contrast",
  borderIntensity: "use contrast",
  accentIntensity: "use darkAccentChroma",
  shellStyle: "set the layout's defaultShellStyle prop instead",
  controlDepth: "it has no replacement",
  buttonElevation: "it has no replacement",
  presetAxes: "use glassOpacity and glassBlur",
}

const argv = minimist(process.argv.slice(2), {
  boolean: ["y", "help"],
  string: [
    "layout",
    "theme-axes",
    "host",
    "port",
    "ui-version",
    ...AXIS_KEYS.map(flagOf),
  ],
  alias: { y: "yes", h: "help" },
})

function usage() {
  const option = (flag, text) => `  ${flag.padEnd(40)} ${text}`
  return [
    "Usage: create-darkraise-ui [project-name] [options]",
    "",
    "Options:",
    option(
      "-y, --yes",
      "skip every prompt; unanswered axes keep the kit defaults",
    ),
    option("--layout <name>", `${LAYOUTS.join(", ")} [default: sidebar]`),
    option(
      "--multilingual / --no-multilingual",
      "English and Vietnamese switching [default: off]",
    ),
    option(
      "--theme-switcher / --no-theme-switcher",
      "include the theme switcher [default: on]",
    ),
    option(
      "--theme-axes <keys>",
      "comma-separated axes the switcher shows [default: all]",
    ),
    option("--host <host>", "dev server host [default: localhost]"),
    option("--port <port>", "dev server port [default: 5173]"),
    option(
      "--ui-version <version>",
      "darkraise-ui version or tarball [default: latest]",
    ),
    option("--no-install", "skip npm install"),
    option("--no-git", "skip git init"),
    option("-h, --help", "show this help"),
    "",
    "Theme axes; those marked prompted are asked unless their flag is given:",
    ...AXIS_KEYS.map((key) =>
      option(
        `--${flagOf(key)} <value>`,
        `${AXES[key].values.join(", ")} [default: ${AXES[key].default}]` +
          (PROMPTED_KEYS.includes(key) ? " (prompted)" : ""),
      ),
    ),
    "",
    "A style's own defaults win over these flags for users with nothing stored,",
    "so --style glass --background solid still paints glass's gradient.",
  ].join("\n")
}

if (argv.help) {
  console.log(usage())
  process.exit(0)
}

for (const [flag, hint] of Object.entries(RETIRED_FLAGS)) {
  if (argv[flag] !== undefined) {
    console.error(
      `Error: --${flag} was removed in create-darkraise-ui 7.0; ${hint}.`,
    )
    process.exit(1)
  }
}

const skipPrompts = argv.y || argv.yes

function resolveBoolFlag(argv, name) {
  if (argv[name] === true || argv[name] === "true") return true
  if (argv[name] === false || argv[name] === "false") return false
  if (argv[`no-${name}`] === true || argv[`no-${name}`] === "true") return false
  return undefined
}

const themeSwitcherFlag = resolveBoolFlag(argv, "theme-switcher")
const multilingualFlag = resolveBoolFlag(argv, "multilingual")

function validate(value, allowed, label) {
  if (value !== undefined && !allowed.includes(value)) {
    console.error(
      `Error: invalid ${label} "${value}". Allowed: ${allowed.join(", ")}`,
    )
    process.exit(1)
  }
}

function isValidPort(value) {
  const n = Number(value)
  return Number.isInteger(n) && n >= 1 && n <= 65535
}

validate(argv.layout, LAYOUTS, "layout")
if (argv.port !== undefined && !isValidPort(argv.port)) {
  console.error(
    `Error: invalid --port "${argv.port}". Must be an integer from 1 to 65535`,
  )
  process.exit(1)
}
for (const key of AXIS_KEYS) {
  validate(argv[flagOf(key)], AXES[key].values, `--${flagOf(key)}`)
}

if (argv["theme-axes"] !== undefined) {
  for (const axis of argv["theme-axes"].split(",")) {
    if (Object.hasOwn(RETIRED_AXES, axis)) {
      console.error(
        `Error: theme axis "${axis}" was removed in create-darkraise-ui 7.0; ${RETIRED_AXES[axis]}.`,
      )
      process.exit(1)
    }
    if (!AXIS_KEYS.includes(axis)) {
      console.error(
        `Error: invalid theme axis "${axis}". Allowed: ${AXIS_KEYS.join(", ")}`,
      )
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
    p.cancel(
      "Project name is required. Pass it as the first argument or run without -y.",
    )
    process.exit(1)
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(projectName)) {
    p.cancel(
      "Project name must contain only letters, numbers, hyphens, and underscores.",
    )
    process.exit(1)
  }

  const targetDir = resolve(process.cwd(), projectName)
  if (existsSync(targetDir)) {
    p.cancel(`Directory "${projectName}" already exists.`)
    process.exit(1)
  }

  // --- Layout ---
  const multilingual =
    multilingualFlag ??
    (skipPrompts
      ? false
      : cancelled(
          await p.confirm({
            message:
              "Enable English and Vietnamese with shared multilingual support?",
            initialValue: false,
          }),
        ))
  const layout =
    argv.layout ||
    (skipPrompts
      ? "sidebar"
      : cancelled(
          await p.select({
            message: "Layout",
            options: LAYOUTS.map((l) => ({ value: l, label: l })),
            initialValue: "sidebar",
          }),
        ))

  // --- Theme defaults ---
  // Only flags given and prompts answered are written; every other axis keeps
  // the kit's default.
  const defaults = {}
  for (const key of AXIS_KEYS) {
    if (argv[flagOf(key)] !== undefined) defaults[key] = argv[flagOf(key)]
  }
  if (!skipPrompts) {
    for (const key of PROMPTED_KEYS) {
      if (key in defaults) continue
      // The kit hides tint under the neutral accent: there is no hue to mix in.
      const accent = defaults.accentColor ?? AXES.accentColor.default
      if (key === "tintWithAccent" && accent === "neutral") continue
      defaults[key] = cancelled(
        await p.select({
          message: AXES[key].label,
          options: AXES[key].values.map((v) => ({ value: v, label: v })),
          initialValue: AXES[key].default,
        }),
      )
    }
  }

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

  let themeAxes = AXIS_KEYS
  if (themeSwitcherEnabled) {
    if (argv["theme-axes"] !== undefined) {
      themeAxes = argv["theme-axes"].split(",")
    } else if (!skipPrompts) {
      const groups = {}
      for (const key of AXIS_KEYS) {
        const group = AXES[key].groupLabel
        groups[group] ??= []
        groups[group].push({ value: key, label: AXES[key].label })
      }
      themeAxes = cancelled(
        await p.groupMultiselect({
          message: "Configurable theme axes",
          options: groups,
          initialValues: AXIS_KEYS,
        }),
      )
    }
  }

  if (argv["theme-axes"] !== undefined && !themeSwitcherEnabled) {
    p.log.warn("--theme-axes is ignored when theme switcher is disabled.")
  }

  // --- Server ---
  const host =
    argv.host ||
    (skipPrompts
      ? "localhost"
      : cancelled(
          await p.text({
            message: "Dev server host",
            placeholder: "localhost",
            initialValue: "localhost",
          }),
        ))

  const port =
    argv.port !== undefined
      ? Number(argv.port)
      : skipPrompts
        ? 5173
        : Number(
            cancelled(
              await p.text({
                message: "Dev server port",
                placeholder: "5173",
                initialValue: "5173",
                validate: (v) => {
                  if (!isValidPort(v)) return "Must be a valid port (1-65535)"
                },
              }),
            ),
          )

  // --- Scaffold ---
  const config = {
    layout,
    theme: {
      // Registry order, so the generated file reads like the switcher.
      defaults: Object.fromEntries(
        AXIS_KEYS.filter((key) => key in defaults).map((key) => [
          key,
          defaults[key],
        ]),
      ),
      switcher: {
        enabled: themeSwitcherEnabled,
        hidden: themeSwitcherEnabled
          ? AXIS_KEYS.filter((key) => !themeAxes.includes(key))
          : [],
      },
    },
    server: { host, port },
  }

  p.log.step("Resolving latest package versions...")
  const [darkraiseUiVersion, reactVersion] = await Promise.all([
    argv["ui-version"]
      ? Promise.resolve(String(argv["ui-version"]))
      : latestVersion("darkraise-ui"),
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
      "@eslint/js": "^10.0.1",
      "@vitejs/plugin-react-swc": "^4.0.0",
      eslint: "^10.2.0",
      "eslint-plugin-react-hooks": "^7.0.1",
      "eslint-plugin-react-refresh": "^0.5.2",
      globals: "^17.4.0",
      tailwindcss: "^4.0.0",
      typescript: "~5.7.0",
      "typescript-eslint": "^8.58.0",
      vite: "^6.0.0",
    },
  }
  if (multilingual) {
    pkg.dependencies.i18next = "^26.4.2"
    pkg.dependencies["react-i18next"] = "^17.0.13"
    pkg.devDependencies.typescript = "~6.0.3"
    writeProjectFile(
      targetDir,
      "src/i18n.ts",
      i18nTemplate(`${projectName}.language`),
    )
    writeProjectFile(
      targetDir,
      "src/language-switcher.tsx",
      languageSwitcherTemplate,
    )
  }
  writeProjectFile(
    targetDir,
    "package.json",
    JSON.stringify(pkg, null, 2) + "\n",
  )

  // --- index.html ---
  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
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
import { darkraisePrerender } from "darkraise-ui/vite"
import { themeConfig } from "./src/theme.config"

export default defineConfig({
  plugins: [
    darkraisePrerender({ config: themeConfig }),
    react(),
    tailwindcss(),
  ],
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

  // --- eslint.config.js ---
  const eslintConfig = `import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
])
`
  writeProjectFile(targetDir, "eslint.config.js", eslintConfig)

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
  writeProjectFile(
    targetDir,
    "tsconfig.json",
    JSON.stringify(tsconfig, null, 2) + "\n",
  )

  // --- src/styles/globals.css ---
  writeProjectFile(
    targetDir,
    "src/styles/globals.css",
    '@import "darkraise-ui/styles.css";\n',
  )

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
  writeProjectFile(
    targetDir,
    "src/main.tsx",
    multilingual ? multilingualMain : mainTsx,
  )

  // --- src/theme.config.ts ---
  // The ThemeConfig type comes from the installed darkraise-ui, which keeps
  // the app checked against the kit it runs. It stays an `import type`:
  // vite.config.ts imports this file, and a value import would make Vite
  // load the kit in Node.
  const defaultEntries = Object.entries(config.theme.defaults).map(
    ([key, value]) => `    ${key}: "${value}",`,
  )
  const defaultsBlock =
    defaultEntries.length > 0 ? `{\n${defaultEntries.join("\n")}\n  }` : "{}"
  const axesBlock =
    config.theme.switcher.hidden.length > 0
      ? `\n    axes: {\n${config.theme.switcher.hidden
          .map((key) => `      ${key}: false,`)
          .join("\n")}\n    },`
      : ""
  const themeConfigContent = `import type { ThemeConfig } from "darkraise-ui/theme"

// The choices made at scaffold time. Every other axis keeps the kit's
// default, and an axis left out of switcher.axes stays in the switcher.
export const themeConfig: ThemeConfig = {
  defaults: ${defaultsBlock},
  switcher: {
    enabled: ${config.theme.switcher.enabled},${axesBlock}
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
  if (multilingual)
    imports.push(
      'import { useTranslation } from "react-i18next"',
      'import { AppLanguageSwitcher } from "./language-switcher"',
    )

  const appTsx = `${imports.join("\n")}

export function App() {
  ${multilingual ? "const { t } = useTranslation()" : ""}
  return (
    <ThemeProvider config={themeConfig}>
      <${layoutComponent}
        nav={[]}
        showThemeSwitcher={${showThemeSwitcher}}
        ${multilingual ? "headerSlot={<AppLanguageSwitcher />}" : ""}
      >
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <h1 className="text-4xl font-medium">${multilingual ? '{t("welcome")}' : "Welcome"}</h1>
          <p className="text-muted-foreground">
            ${multilingual ? '{t("ready")}' : "Your project is ready. Start building in src/app.tsx"}
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
  writeProjectFile(
    targetDir,
    "src/env.d.ts",
    '/// <reference types="vite/client" />\n',
  )

  p.log.step(
    `Generated ${Object.keys(pkg.dependencies).length + Object.keys(pkg.devDependencies).length} dependencies`,
  )

  if (argv.install !== false) {
    p.log.step("Installing dependencies...")
    execFileSync("npm", ["install"], {
      cwd: targetDir,
      stdio: "inherit",
      shell: true,
      timeout: 180000,
    })
  }

  if (argv.git !== false) {
    p.log.step("Initializing git repository...")
    execFileSync("git", ["init"], {
      cwd: targetDir,
      stdio: "inherit",
      timeout: 30000,
    })
    execFileSync("git", ["add", "-A"], {
      cwd: targetDir,
      stdio: "inherit",
      timeout: 30000,
    })
    execFileSync("git", ["commit", "-m", "chore: initialize project"], {
      cwd: targetDir,
      stdio: "inherit",
      timeout: 30000,
    })
  }

  p.outro(`Success! Created ${projectName} at ${targetDir}

  cd ${projectName}
  npm run dev        Start development server`)
}

main().catch((err) => {
  p.cancel(err.message)
  process.exit(1)
})
