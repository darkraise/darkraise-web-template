#!/usr/bin/env node

import { execFileSync } from "child_process"
import { existsSync } from "fs"
import { resolve } from "path"
import * as p from "@clack/prompts"
import minimist from "minimist"

const REPO = "https://github.com/darkraise/darkraise-web-template.git"
const BRANCH = "master"

const ACCENT_COLORS = [
  "red", "orange", "amber", "yellow", "lime", "green", "emerald",
  "teal", "cyan", "sky", "blue", "indigo", "violet", "purple",
  "fuchsia", "pink", "rose",
]
const SURFACE_COLORS = ["slate", ...ACCENT_COLORS]
const SURFACE_STYLES = ["default", "glassmorphism"]
const BACKGROUND_STYLES = ["solid", "gradient"]
const FONT_FAMILIES = ["default", "editorial", "modern", "humanist", "technical"]
const MODES = ["light", "dark", "system"]
const LAYOUTS = ["sidebar", "stacked", "top-nav", "split-panel"]
const THEME_AXIS_KEYS = [
  "mode", "accentColor", "surfaceColor", "surfaceStyle", "backgroundStyle", "fontFamily",
]

const argv = minimist(process.argv.slice(2), {
  boolean: ["y", "theme-switcher", "auth"],
  string: [
    "layout", "accent", "surface-color", "surface-style",
    "background", "font", "mode", "theme-axes",
  ],
  default: {
    "theme-switcher": undefined,
    auth: undefined,
  },
  alias: { y: "yes" },
})

const skipPrompts = argv.y || argv.yes

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
validate(argv.font, FONT_FAMILIES, "font")
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

  const font = argv.font || (skipPrompts ? "default" : cancelled(
    await p.select({
      message: "Font",
      options: FONT_FAMILIES.map((f) => ({ value: f, label: f })),
      initialValue: "default",
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
  if (argv["theme-switcher"] !== undefined) {
    themeSwitcherEnabled = argv["theme-switcher"]
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
            { value: "fontFamily", label: "Font" },
          ],
          initialValues: THEME_AXIS_KEYS,
        }),
      )
    }
  }

  // --- Auth ---
  let includeAuth
  if (argv.auth !== undefined) {
    includeAuth = argv.auth
  } else if (skipPrompts) {
    includeAuth = true
  } else {
    includeAuth = cancelled(
      await p.confirm({
        message: "Include auth flow?",
        initialValue: true,
      }),
    )
  }

  // --- Scaffold ---
  const config = {
    layout,
    theme: {
      defaults: {
        accentColor: accent,
        surfaceColor: surfaceColor,
        surfaceStyle: surfaceStyle,
        backgroundStyle: background,
        fontFamily: font,
        mode: mode,
      },
      switcher: {
        enabled: themeSwitcherEnabled,
        axes: Object.fromEntries(
          THEME_AXIS_KEYS.map((key) => [key, themeSwitcherEnabled && themeAxes.includes(key)]),
        ),
      },
    },
    auth: includeAuth,
  }

  p.log.step("Cloning template...")
  execFileSync("npx", ["--yes", "degit", `${REPO}#${BRANCH}`, projectName], {
    stdio: "inherit",
    cwd: process.cwd(),
    shell: true,
  })

  p.log.step("Configuring project...")
  execFileSync("node", ["scripts/init.mjs", projectName, JSON.stringify(config)], {
    cwd: targetDir,
    stdio: "inherit",
    shell: true,
  })

  p.log.step("Installing dependencies...")
  execFileSync("npm", ["install"], { cwd: targetDir, stdio: "inherit", shell: true })

  p.log.step("Initializing git repository...")
  execFileSync("git", ["init"], { cwd: targetDir, stdio: "inherit", shell: true })
  execFileSync("git", ["add", "-A"], { cwd: targetDir, stdio: "inherit", shell: true })
  execFileSync("git", ["commit", "-m", "chore: scaffold from web-template"], {
    cwd: targetDir,
    stdio: "inherit",
    shell: true,
  })

  p.outro(`Success! Created ${projectName} at ${targetDir}

  cd ${projectName}
  npm run dev        Start development server
  npm run storybook  Browse component library
  npm run test       Run tests`)
}

main().catch((err) => {
  p.cancel(err.message)
  process.exit(1)
})
