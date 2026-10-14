import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useLayoutStore } from "@layout/layoutStore"
import type { ThemeConfig } from "@theme/themeConfig"
import type { ThemePersistenceAdapter } from "@theme/types"
import { useTheme } from "@theme/useTheme"
import { ThemeProvider } from "./ThemeProvider"

const root = document.documentElement

// Ink sets the elevation; Night sets the accent, the radius and a shell
// style; Dusk sets nothing.
const config: ThemeConfig = {
  defaults: {},
  switcher: { enabled: true },
  styles: { ink: { label: "Ink", defaults: { elevation: "flat" } } },
  presets: {
    night: {
      label: "Night",
      style: "ink",
      axes: { accentColor: "violet", radius: "subtle" },
      shellStyle: "inset",
    },
    dusk: { label: "Dusk", style: "ink" },
  },
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider config={config}>{children}</ThemeProvider>
)

function store(values: Record<string, string>) {
  for (const [key, value] of Object.entries(values)) {
    localStorage.setItem(key, value)
  }
}

/** Puts a shell style where a user's pick lives: the store and its key. */
function pickShellStyle(style: "island" | null) {
  if (style === null) localStorage.removeItem("theme-shell-style")
  else localStorage.setItem("theme-shell-style", style)
  act(() => useLayoutStore.setState({ shellStyle: style }))
}

beforeEach(() => {
  localStorage.clear()
  pickShellStyle(null)
  for (const name of root.getAttributeNames()) root.removeAttribute(name)
  root.style.cssText = ""
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  )
})

afterEach(() => {
  pickShellStyle(null)
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("ThemeProvider resetToPreset", () => {
  it("has nothing to reset until the user overrides what the preset sets", () => {
    store({ "theme-style": "ink", "theme-preset": "night" })
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.canResetToPreset).toBe(false)

    // Density is set by neither Night nor Ink.
    act(() => result.current.setDensity("compact"))
    expect(result.current.canResetToPreset).toBe(false)

    act(() => result.current.setAccentColor("rose"))
    expect(result.current.canResetToPreset).toBe(true)
  })

  it("clears the user's values on the axes the preset and its style set", () => {
    store({
      mode: "dark",
      "theme-style": "ink",
      "theme-preset": "night",
      "theme-accent": "rose",
      "theme-radius": "pill",
      "theme-elevation": "high",
      "theme-density": "compact",
    })
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current).toMatchObject({
      accentColor: "rose",
      radius: "pill",
      elevation: "high",
      canResetToPreset: true,
    })

    act(() => result.current.resetToPreset())

    expect(result.current).toMatchObject({
      mode: "dark",
      style: "ink",
      preset: "night",
      accentColor: "violet",
      radius: "subtle",
      elevation: "flat",
      density: "compact",
      canResetToPreset: false,
    })
    expect(root.getAttribute("data-accent")).toBe("violet")
    expect(root.getAttribute("data-radius")).toBe("subtle")
    expect(root.getAttribute("data-elevation")).toBe("flat")
    for (const key of ["theme-accent", "theme-radius", "theme-elevation"]) {
      expect(localStorage.getItem(key), key).toBeNull()
    }
    expect(localStorage.getItem("mode")).toBe("dark")
    expect(localStorage.getItem("theme-style")).toBe("ink")
    expect(localStorage.getItem("theme-preset")).toBe("night")
    expect(localStorage.getItem("theme-density")).toBe("compact")
  })

  it("clears what the style sets under base", () => {
    store({
      "theme-style": "ink",
      "theme-elevation": "high",
      "theme-accent": "rose",
    })
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.canResetToPreset).toBe(true)

    act(() => result.current.resetToPreset())

    expect(result.current).toMatchObject({
      style: "ink",
      preset: "base",
      elevation: "flat",
      accentColor: "rose",
      canResetToPreset: false,
    })
    expect(localStorage.getItem("theme-elevation")).toBeNull()
    expect(localStorage.getItem("theme-accent")).toBe("rose")
  })

  it.each([
    ["a preset that sets a shell style", "night", true],
    ["a preset that sets none", "dusk", false],
    ["base", "base", false],
  ])("treats the stored shell style under %s", (_title, preset, clears) => {
    store({ "theme-style": "ink", "theme-preset": preset })
    pickShellStyle("island")
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.canResetToPreset).toBe(clears)

    act(() => result.current.resetToPreset())

    expect(useLayoutStore.getState().shellStyle).toBe(clears ? null : "island")
    expect(localStorage.getItem("theme-shell-style")).toBe(
      clears ? null : "island",
    )
    expect(result.current.canResetToPreset).toBe(false)
  })

  it("reaches onChange and the debounced save like any other change", async () => {
    vi.useFakeTimers()
    store({
      "theme-style": "ink",
      "theme-preset": "night",
      "theme-accent": "rose",
      "theme-density": "compact",
    })
    const onChange = vi.fn()
    const adapter: ThemePersistenceAdapter = {
      load: vi.fn(() => Promise.resolve(null)),
      save: vi.fn(() => Promise.resolve()),
    }
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <ThemeProvider
          config={config}
          persistence={adapter}
          persistenceDebounce={100}
          onChange={onChange}
        >
          {children}
        </ThemeProvider>
      ),
    })
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    act(() => result.current.resetToPreset())

    const payload = {
      style: "ink",
      preset: "night",
      density: "compact",
      version: 7,
    }
    expect(onChange.mock.calls).toEqual([[payload]])
    expect(result.current.syncStatus).toBe("saving")
    expect(adapter.save).not.toHaveBeenCalled()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })
    expect(adapter.save).toHaveBeenCalledOnce()
    expect(adapter.save).toHaveBeenCalledWith(payload, expect.anything())
    expect(result.current.syncStatus).toBe("idle")
  })

  it.each([
    ["there is nothing to clear", "base", null],
    ["only the shell style is cleared", "night", "island"],
  ] as const)("announces nothing when %s", async (_title, preset, shell) => {
    vi.useFakeTimers()
    store({
      "theme-style": "ink",
      "theme-preset": preset,
      "theme-density": "compact",
    })
    pickShellStyle(shell)
    const onChange = vi.fn()
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <ThemeProvider config={config} onChange={onChange}>
          {children}
        </ThemeProvider>
      ),
    })

    act(() => result.current.resetToPreset())
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    // The theme payload carries no shell style, so clearing one changes
    // nothing a listener was told.
    expect(onChange).not.toHaveBeenCalled()
    expect(useLayoutStore.getState().shellStyle).toBeNull()
    expect(localStorage.getItem("theme-density")).toBe("compact")
  })
})

describe("ThemeProvider preset pick", () => {
  it("clears the user's values on the axes the picked preset and its style set", () => {
    store({
      mode: "dark",
      "theme-accent": "rose",
      "theme-radius": "pill",
      "theme-elevation": "high",
      "theme-density": "compact",
    })
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => result.current.setPreset("night"))

    expect(result.current).toMatchObject({
      mode: "dark",
      style: "ink",
      preset: "night",
      accentColor: "violet",
      radius: "subtle",
      elevation: "flat",
      density: "compact",
      canResetToPreset: false,
    })
    expect(root.getAttribute("data-accent")).toBe("violet")
    for (const key of ["theme-accent", "theme-radius", "theme-elevation"]) {
      expect(localStorage.getItem(key), key).toBeNull()
    }
    expect(localStorage.getItem("theme-density")).toBe("compact")
  })

  it.each([
    ["a preset that sets a shell style", "night", true],
    ["a preset that sets none", "dusk", false],
  ])(
    "treats the stored shell style when picking %s",
    (_title, preset, clears) => {
      pickShellStyle("island")
      const { result } = renderHook(() => useTheme(), { wrapper })

      act(() => result.current.setPreset(preset))

      expect(useLayoutStore.getState().shellStyle).toBe(
        clears ? null : "island",
      )
      expect(localStorage.getItem("theme-shell-style")).toBe(
        clears ? null : "island",
      )
    },
  )
})
