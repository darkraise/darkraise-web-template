import { StrictMode } from "react"
import { render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { AXES, AXIS_KEYS, type AxisKey } from "@theme/axes/registry"
import { resolveRegistry } from "@theme/config/registry"
import { PRESET_NAMES } from "@theme/styles/builtin/presets"
import { ThemeProvider } from "@theme/theme-provider"
import { resolveDefaults, themeConfig, type ThemeConfig } from "./themeConfig"

const REGISTRY_DEFAULTS = Object.fromEntries(
  AXIS_KEYS.map((key) => [key, AXES[key].default]),
)

const REMOVED: [key: string, replacement: string][] = [
  ["surfaceIntensity", "use contrast"],
  ["borderIntensity", "use contrast"],
  ["accentIntensity", "use darkAccentChroma"],
  ["controlDepth", "no replacement"],
  ["buttonElevation", "no replacement"],
  ["shellStyle", "defaultShellStyle"],
]

function silenceWarnings() {
  return vi.spyOn(console, "warn").mockImplementation(() => {})
}

// Each case builds a config no other case uses: the warnings are deduplicated
// per config content for the whole module, not per test.
function cast(config: unknown): ThemeConfig {
  return config as ThemeConfig
}

describe("resolveDefaults", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it("resolves the kit config to the registry defaults", () => {
    expect(resolveDefaults(themeConfig)).toEqual(REGISTRY_DEFAULTS)
  })

  it("fills every axis missing from partial defaults from the registry", () => {
    const warn = silenceWarnings()
    expect(
      resolveDefaults(
        cast({
          defaults: { accentColor: "rose", density: "compact" },
          switcher: { enabled: true },
        }),
      ),
    ).toEqual({ ...REGISTRY_DEFAULTS, accentColor: "rose", density: "compact" })
    expect(warn).not.toHaveBeenCalled()
  })

  it.each(REMOVED)(
    "warns once about defaults.%s, naming its replacement, and ignores it",
    (key, replacement) => {
      const warn = silenceWarnings()
      const config = cast({
        defaults: { [key]: "x", radius: "pill" },
        switcher: { enabled: true },
      })
      expect(resolveDefaults(config)).toEqual({
        ...REGISTRY_DEFAULTS,
        radius: "pill",
      })
      resolveDefaults(JSON.parse(JSON.stringify(config)) as ThemeConfig)
      expect(warn).toHaveBeenCalledTimes(1)
      expect(warn.mock.calls[0]?.[0]).toContain(`defaults.${key}`)
      expect(warn.mock.calls[0]?.[0]).toContain(replacement)
    },
  )

  it.each([...REMOVED, ["presetAxes", "no replacement"]])(
    "warns once about switcher.axes.%s, naming its replacement, and ignores it",
    (key, replacement) => {
      const warn = silenceWarnings()
      const config = cast({
        defaults: {},
        switcher: { enabled: true, axes: { [key]: true } },
      })
      expect(resolveDefaults(config)).toEqual(REGISTRY_DEFAULTS)
      resolveDefaults(JSON.parse(JSON.stringify(config)) as ThemeConfig)
      expect(warn).toHaveBeenCalledTimes(1)
      expect(warn.mock.calls[0]?.[0]).toContain(`switcher.axes.${key}`)
      expect(warn.mock.calls[0]?.[0]).toContain(replacement)
    },
  )

  it("warns about an invalid default and falls back to the registry", () => {
    const warn = silenceWarnings()
    const config = cast({
      defaults: { density: "huge", mode: 3 },
      switcher: { enabled: true },
    })
    expect(resolveDefaults(config)).toEqual(REGISTRY_DEFAULTS)
    expect(warn).toHaveBeenCalledTimes(2)
    expect(warn.mock.calls[0]?.[0]).toContain('defaults.mode "3"')
    expect(warn.mock.calls[1]?.[0]).toContain('defaults.density "huge"')
    expect(warn.mock.calls[1]?.[0]).toContain('using "cozy"')
  })

  it("stays silent in production but still ignores removed and invalid keys", () => {
    vi.stubEnv("NODE_ENV", "production")
    const warn = silenceWarnings()
    const config = cast({
      defaults: { controlDepth: "deep", elevation: "medium", preset: "glass" },
      switcher: { enabled: true, axes: { presetAxes: false, preset: false } },
    })
    expect(resolveDefaults(config)).toEqual(REGISTRY_DEFAULTS)
    expect(warn).not.toHaveBeenCalled()
  })

  it("warns once per config content across provider renders", () => {
    const warn = silenceWarnings()
    const config = () =>
      cast({
        defaults: { accentIntensity: "vivid", density: "compact" },
        switcher: { enabled: true },
      })
    const tree = () => (
      <StrictMode>
        <ThemeProvider config={config()}>
          <span />
        </ThemeProvider>
      </StrictMode>
    )
    const { rerender } = render(tree())
    rerender(tree())
    const removed = warn.mock.calls.filter(([message]) =>
      String(message).includes("accentIntensity"),
    )
    expect(removed).toHaveLength(1)
    expect(document.documentElement.getAttribute("data-density")).toBe(
      "compact",
    )
  })

  it("warns that sidebarActiveBar moved to sidebarSelection", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    resolveDefaults({
      ...themeConfig,
      defaults: { sidebarActiveBar: "bar" } as never,
    })
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(
        "themeConfig.defaults.sidebarActiveBar was removed; use sidebarSelection instead",
      ),
    )
    warn.mockRestore()
  })
})

describe("resolveDefaults with theme definitions", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const definitions = {
    styles: { ink: { label: "Ink", extends: "glass" } },
    presets: {
      night: { label: "Night", style: "ink", axes: { radius: "pill" } },
      dusk: { label: "Dusk", style: "quiet" },
    },
  } satisfies Pick<ThemeConfig, "styles" | "presets">

  it("accepts a consumer style and one of its presets as defaults", () => {
    const warn = silenceWarnings()
    expect(
      resolveDefaults({
        ...definitions,
        defaults: { style: "ink", preset: "night", density: "compact" },
        switcher: { enabled: true },
      }),
    ).toEqual({
      ...REGISTRY_DEFAULTS,
      style: "ink",
      preset: "night",
      density: "compact",
    })
    expect(warn).not.toHaveBeenCalled()
  })

  it("validates against the registry it is given", () => {
    const warn = silenceWarnings()
    const config = cast({
      defaults: { style: "ink", density: "spacious" },
      switcher: { enabled: true },
    })
    expect(resolveDefaults(config, resolveRegistry(definitions))).toEqual({
      ...REGISTRY_DEFAULTS,
      style: "ink",
      density: "spacious",
    })
    expect(warn).not.toHaveBeenCalled()
  })

  it("warns once when defaults.preset names a style, and ignores it", () => {
    const warn = silenceWarnings()
    const config = cast({
      defaults: { preset: "glass", radius: "sharp" },
      switcher: { enabled: true },
    })
    expect(resolveDefaults(config)).toEqual({
      ...REGISTRY_DEFAULTS,
      radius: "sharp",
    })
    resolveDefaults(JSON.parse(JSON.stringify(config)) as ThemeConfig)
    expect(warn.mock.calls).toEqual([
      [
        '[ThemeProvider] themeConfig.defaults.preset "glass" names a style; preset now selects a preset, so use defaults.style. The key is ignored.',
      ],
    ])
  })

  it("warns once when defaults.preset belongs to another style", () => {
    const warn = silenceWarnings()
    const config: ThemeConfig = {
      ...definitions,
      defaults: { style: "quiet", preset: "night" },
      switcher: { enabled: true },
    }
    expect(resolveDefaults(config)).toEqual({
      ...REGISTRY_DEFAULTS,
      style: "quiet",
    })
    resolveDefaults(JSON.parse(JSON.stringify(config)) as ThemeConfig)
    expect(warn.mock.calls).toEqual([
      [
        '[ThemeProvider] themeConfig.defaults.preset "night" belongs to style "ink", not "quiet"; using "base".',
      ],
    ])
  })

  it("lists the presets when defaults.preset names none", () => {
    const warn = silenceWarnings()
    resolveDefaults({
      ...definitions,
      defaults: { preset: "noon" },
      switcher: { enabled: true },
    })
    const offered = ["base", ...PRESET_NAMES, "night", "dusk"].join(", ")
    expect(warn.mock.calls).toEqual([
      [
        `[ThemeProvider] themeConfig.defaults.preset "noon" is not a valid preset (expected one of: ${offered}); using "base".`,
      ],
    ])
  })

  it("lists the consumer styles when defaults.style names none", () => {
    const warn = silenceWarnings()
    resolveDefaults({
      ...definitions,
      defaults: { style: "paper" },
      switcher: { enabled: true },
    })
    expect(warn.mock.calls).toEqual([
      [
        '[ThemeProvider] themeConfig.defaults.style "paper" is not a valid style (expected one of: flat, quiet, tactile, glass, ink); using "quiet".',
      ],
    ])
  })

  it("treats switcher.axes.preset as an axis", () => {
    const warn = silenceWarnings()
    resolveDefaults(
      cast({
        defaults: {},
        switcher: { enabled: true, axes: { preset: false } },
      }),
    )
    expect(warn).not.toHaveBeenCalled()
  })
})

describe("kit theme config", () => {
  it("lists only defaults that differ from the registry", () => {
    for (const [key, value] of Object.entries(themeConfig.defaults)) {
      expect(value, key).not.toBe(AXES[key as AxisKey].default)
    }
  })

  it("lists no switcher axis, so every axis is shown", () => {
    expect(themeConfig.switcher.axes).toBeUndefined()
  })
})
