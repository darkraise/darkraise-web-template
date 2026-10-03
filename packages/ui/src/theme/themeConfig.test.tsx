import { StrictMode } from "react"
import { render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { AXES, AXIS_KEYS, type AxisKey } from "@theme/axes/registry"
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
  ["preset", "use style"],
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
