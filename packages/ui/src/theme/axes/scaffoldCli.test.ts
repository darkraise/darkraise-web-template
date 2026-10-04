import { execFile } from "node:child_process"
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { AXES, AXIS_KEYS } from "./registry"

// Vitest runs from packages/ui.
const CLI = resolve("../../create-app/bin/create.mjs")
// Stands in for the npm registry lookups, so no case touches the network.
const FETCH_STUB = `data:text/javascript,${encodeURIComponent(
  'globalThis.fetch = async () => ({ json: async () => ({ version: "19.0.0" }) })',
)}`
const TIMEOUT = 30_000

// The CLI's flag names: the axis key in kebab case, but for two 6.x names.
const FLAG_ALIASES: Record<string, string> = {
  accentColor: "accent",
  backgroundStyle: "background",
}
const flagOf = (key: string) =>
  FLAG_ALIASES[key] ?? key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

const PROMPTED = AXIS_KEYS.filter(
  (key) => AXES[key].layer === "brand" || key === "style",
)

interface Run {
  code: number
  stdout: string
  stderr: string
}

let cwd = ""

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "scaffold-cli-"))
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

function run(...args: string[]): Promise<Run> {
  return new Promise((done) => {
    execFile(
      process.execPath,
      ["--import", FETCH_STUB, CLI, ...args],
      { cwd, timeout: TIMEOUT },
      (error, stdout, stderr) => {
        const code =
          error === null ? 0 : typeof error.code === "number" ? error.code : -1
        done({ code, stdout, stderr })
      },
    )
  })
}

/** Scaffolds `app` with every prompt skipped, nothing installed or committed. */
function scaffold(...flags: string[]): Promise<Run> {
  return run("app", "-y", "--no-install", "--no-git", ...flags)
}

interface Generated {
  source: string
  defaults: Record<string, string>
  switcher: { enabled: boolean; axes?: Record<string, boolean> }
}

function generated(): Generated {
  const source = readFileSync(join(cwd, "app/src/theme.config.ts"), "utf8")
  const defaultsBody = /defaults: \{([^}]*)\}/.exec(source)?.[1]
  const switcherBody = /switcher: \{([\s\S]*)\n {2}\},\n\}/.exec(source)?.[1]
  const enabled =
    switcherBody && /enabled: (true|false),/.exec(switcherBody)?.[1]
  if (defaultsBody === undefined || !enabled) {
    throw new Error(`unexpected theme.config.ts:\n${source}`)
  }
  const axesBody = /axes: \{([^}]*)\}/.exec(switcherBody)?.[1]
  const switcher: Generated["switcher"] = { enabled: enabled === "true" }
  if (axesBody !== undefined) {
    switcher.axes = Object.fromEntries(
      [...axesBody.matchAll(/(\w+): (true|false)/g)].map((m) => [
        m[1],
        m[2] === "true",
      ]),
    )
  }
  return {
    source,
    defaults: Object.fromEntries(
      [...defaultsBody.matchAll(/(\w+): "([^"]*)"/g)].map((m) => [m[1], m[2]]),
    ),
    switcher,
  }
}

describe("create-darkraise-ui --help", () => {
  it.each(["--help", "-h"])(
    "%s prints a flag for every axis and exits 0",
    async (flag) => {
      const { code, stdout } = await run(flag)
      expect(code).toBe(0)
      for (const key of AXIS_KEYS) expect(stdout).toContain(`--${flagOf(key)} `)
      expect(readdirSync(cwd)).toEqual([])
    },
    TIMEOUT,
  )

  it(
    "marks exactly the prompted axes",
    async () => {
      const { stdout } = await run("--help")
      const marked = [
        ...stdout.matchAll(/^\s+--([a-z-]+) .*\(prompted\)$/gm),
      ].map((m) => m[1])
      expect(marked).toEqual(PROMPTED.map(flagOf))
    },
    TIMEOUT,
  )

  it(
    "-h before a project name prints usage and scaffolds nothing",
    async () => {
      const { code, stdout } = await run("-h", "app")
      expect(code).toBe(0)
      expect(stdout).toContain("Usage: create-darkraise-ui")
      expect(readdirSync(cwd)).toEqual([])
    },
    TIMEOUT,
  )

  it.each([
    ["--preset", "glass"],
    ["--accent", "bogus"],
  ])(
    "wins over %s %s",
    async (flag, value) => {
      const { code, stdout } = await run("--help", flag, value)
      expect(code).toBe(0)
      expect(stdout).toContain("Usage: create-darkraise-ui")
    },
    TIMEOUT,
  )
})

describe("rejected input", () => {
  it.each([
    ["--preset", "glass", "--style"],
    ["--surface-intensity", "bold", "--contrast"],
    ["--accent-intensity", "vivid", "--dark-accent-chroma"],
    ["--shell-style", "island", "defaultShellStyle"],
    ["--control-depth", "raised", "no replacement"],
    ["--button-elevation", "high", "no replacement"],
  ])(
    "%s %s exits 1 naming its replacement",
    async (flag, value, replacement) => {
      const { code, stderr } = await scaffold(flag, value)
      expect(code).toBe(1)
      expect(stderr).toContain(`${flag} was removed`)
      expect(stderr).toContain(replacement)
      expect(readdirSync(cwd)).toEqual([])
    },
    TIMEOUT,
  )

  it(
    "rejects a retired flag given without a value",
    async () => {
      const { code, stderr } = await scaffold("--control-depth")
      expect(code).toBe(1)
      expect(stderr).toContain("--control-depth was removed")
      expect(stderr).toContain("no replacement")
      expect(readdirSync(cwd)).toEqual([])
    },
    TIMEOUT,
  )

  it(
    "names the replacement for a retired --theme-axes name",
    async () => {
      const { code, stderr } = await scaffold("--theme-axes", "mode,preset")
      expect(code).toBe(1)
      expect(stderr).toContain('theme axis "preset" was removed')
      expect(stderr).toContain("use style")
      expect(readdirSync(cwd)).toEqual([])
    },
    TIMEOUT,
  )

  it(
    "rejects an invalid value for a new axis flag",
    async () => {
      const { code, stderr } = await scaffold("--font", "comic")
      expect(code).toBe(1)
      expect(stderr).toContain(AXES.font.values.join(", "))
    },
    TIMEOUT,
  )
})

describe("generated project", () => {
  it(
    "writes no defaults when nothing is chosen",
    async () => {
      expect((await scaffold()).code).toBe(0)
      const config = generated()
      expect(config.defaults).toEqual({})
      expect(config.switcher).toEqual({ enabled: true })
      expect(config.source).toContain(
        'import type { ThemeConfig } from "darkraise-ui/theme"',
      )
    },
    TIMEOUT,
  )

  it(
    "passes the config defaults to the pre-render plugin",
    async () => {
      expect((await scaffold()).code).toBe(0)
      const vite = readFileSync(join(cwd, "app/vite.config.ts"), "utf8")
      expect(vite).toContain('import { themeConfig } from "./src/theme.config"')
      expect(vite).toContain(
        "darkraisePrerender({ defaults: themeConfig.defaults })",
      )
    },
    TIMEOUT,
  )

  it(
    "writes every axis given by flag",
    async () => {
      const last = (key: (typeof AXIS_KEYS)[number]) => {
        const values = AXES[key].values
        return values[values.length - 1] as string
      }
      const flags = AXIS_KEYS.flatMap((key) => [`--${flagOf(key)}`, last(key)])
      expect((await scaffold(...flags)).code).toBe(0)
      expect(generated().defaults).toEqual(
        Object.fromEntries(AXIS_KEYS.map((key) => [key, last(key)])),
      )
    },
    TIMEOUT,
  )

  it(
    "writes only the chosen axes and hides the rest",
    async () => {
      const flags = ["--font", "geist", "--contrast", "high"]
      expect((await scaffold(...flags, "--theme-axes", "mode,font")).code).toBe(
        0,
      )
      const config = generated()
      expect(config.defaults).toEqual({ font: "geist", contrast: "high" })
      expect(config.switcher).toEqual({
        enabled: true,
        axes: Object.fromEntries(
          AXIS_KEYS.filter((key) => key !== "mode" && key !== "font").map(
            (key) => [key, false],
          ),
        ),
      })
    },
    TIMEOUT,
  )

  it(
    "writes a disabled switcher with no axes",
    async () => {
      expect((await scaffold("--no-theme-switcher")).code).toBe(0)
      expect(generated().switcher).toEqual({ enabled: false })
    },
    TIMEOUT,
  )

  it(
    "keeps --ui-version as written",
    async () => {
      const { code } = await run(
        "app",
        "-y",
        "--no-install",
        "--no-git",
        "--ui-version",
        "7.0",
      )
      expect(code).toBe(0)
      const pkg = JSON.parse(
        readFileSync(join(cwd, "app/package.json"), "utf8"),
      ) as { dependencies: Record<string, string> }
      expect(pkg.dependencies["darkraise-ui"]).toBe("7.0")
    },
    TIMEOUT,
  )
})
