import { renderHook, act } from "@testing-library/react"
import { afterEach, describe, it, expect, beforeEach, vi } from "vitest"
import { useTheme } from "./useTheme"
import { ThemeProvider } from "./theme-provider"
import type { ThemePersistenceAdapter, ThemeSettings } from "./types"
import type { ReactNode } from "react"

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}

const storageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      store = Object.fromEntries(
        Object.entries(store).filter(([k]) => k !== key),
      )
    },
    clear: () => {
      store = {}
    },
  }
})()

function mockMatchMedia(prefersDark = false) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: prefersDark && query.includes("dark"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

describe("useTheme", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", storageMock)
    storageMock.clear()
    mockMatchMedia()
    document.documentElement.removeAttribute("data-mode")
    document.documentElement.removeAttribute("data-font-size")
    document.documentElement.style.cssText = ""
  })

  it("returns default axis values", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.accentColor).toBe("blue")
    expect(result.current.surfaceColor).toBe("slate")
    expect(result.current.preset).toBe("default")
    expect(result.current.mode).toBe("system")
  })

  it("setAccentColor updates accent and persists to localStorage", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setAccentColor("rose"))
    expect(result.current.accentColor).toBe("rose")
    expect(localStorage.getItem("theme-accent")).toBe("rose")
  })

  // Re-enabled in Phase 3 with the glass preset registered
  it("setPreset updates preset and persists to theme-preset key", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setPreset("glass"))
    expect(result.current.preset).toBe("glass")
    expect(localStorage.getItem("theme-preset")).toBe("glass")
  })

  it("setMode updates mode and applies data-mode attribute", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setMode("dark"))
    expect(result.current.mode).toBe("dark")
    expect(result.current.resolvedMode).toBe("dark")
    expect(document.documentElement.getAttribute("data-mode")).toBe("dark")
  })

  it("applies CSS variables to document.documentElement.style", () => {
    renderHook(() => useTheme(), { wrapper })
    const style = document.documentElement.style
    expect(style.getPropertyValue("--primary")).toBeTruthy()
    expect(style.getPropertyValue("--background")).toBeTruthy()
  })

  it("throws when used outside ThemeProvider", () => {
    expect(() => {
      renderHook(() => useTheme())
    }).toThrow("useTheme must be used within a ThemeProvider")
  })

  it("reads persisted values from localStorage on mount", () => {
    storageMock.setItem("theme-accent", "emerald")
    storageMock.setItem("theme-surface-color", "teal")
    storageMock.setItem("theme-preset", "glass")
    storageMock.setItem("mode", "dark")

    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.accentColor).toBe("emerald")
    expect(result.current.surfaceColor).toBe("teal")
    expect(result.current.preset).toBe("glass")
    expect(result.current.mode).toBe("dark")
  })

  it("setSurfaceColor updates surfaceColor and persists to localStorage", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setSurfaceColor("emerald"))
    expect(result.current.surfaceColor).toBe("emerald")
    expect(localStorage.getItem("theme-surface-color")).toBe("emerald")
  })

  it("setDensity updates density and sets data-density attribute", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setDensity("spacious"))
    expect(result.current.density).toBe("spacious")
    expect(localStorage.getItem("theme-density")).toBe("spacious")
    expect(document.documentElement.getAttribute("data-density")).toBe(
      "spacious",
    )
  })

  it("setElevation updates elevation and sets data-elevation attribute", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setElevation("high"))
    expect(result.current.elevation).toBe("high")
    expect(localStorage.getItem("theme-elevation")).toBe("high")
    expect(document.documentElement.getAttribute("data-elevation")).toBe("high")
  })

  it("setButtonElevation updates buttonElevation and sets data-button-elevation attribute", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setButtonElevation("medium"))
    expect(result.current.buttonElevation).toBe("medium")
    expect(localStorage.getItem("theme-button-elevation")).toBe("medium")
    expect(document.documentElement.getAttribute("data-button-elevation")).toBe(
      "medium",
    )
  })

  it("defaults surfaceIntensity to balanced", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.surfaceIntensity).toBe("balanced")
  })

  it("writes the attribute and storage on change", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setSurfaceIntensity("bold"))
    expect(result.current.surfaceIntensity).toBe("bold")
    expect(
      document.documentElement.getAttribute("data-surface-intensity"),
    ).toBe("bold")
    expect(localStorage.getItem("theme-surface-intensity")).toBe("bold")
  })

  it("returns config defaults for new axes when localStorage is empty", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.density).toBe("cozy")
    expect(result.current.elevation).toBe("medium")
    expect(result.current.buttonElevation).toBe("flat")
  })

  it("syncStatus is idle when no persistence adapter is provided", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.syncStatus).toBe("idle")
  })

  it("defaults fontSize to medium", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.fontSize).toBe("medium")
  })

  it("setFontSize updates state, applies the attribute, and persists", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setFontSize("large"))
    expect(result.current.fontSize).toBe("large")
    expect(document.documentElement.getAttribute("data-font-size")).toBe(
      "large",
    )
    expect(localStorage.getItem("theme-font-size")).toBe("large")
  })

  it("restores a valid stored fontSize on mount", () => {
    localStorage.setItem("theme-font-size", "extra-large")
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.fontSize).toBe("extra-large")
  })

  it("falls back to the default when the stored fontSize is invalid", () => {
    localStorage.setItem("theme-font-size", "gigantic")
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.fontSize).toBe("medium")
  })

  // The vibrancy axis is a dark-mode-only lever, and the token it always moves
  // is --primary-fill: --primary goes through capChroma, which only binds for
  // high-chroma accents and is identical across all four steps for the default
  // blue.
  it("repaints accent tokens when the vibrancy axis changes in dark mode", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setMode("dark"))
    const read = () =>
      document.documentElement.style.getPropertyValue("--primary-fill")

    const balanced = read()
    act(() => result.current.setAccentIntensity("intense"))
    const intense = read()
    act(() => result.current.setAccentIntensity("calm"))
    const calm = read()

    expect(intense).not.toBe(balanced)
    expect(calm).not.toBe(intense)
  })

  it("honours a stored vibrancy on first paint without a setter call", () => {
    localStorage.setItem("mode", "dark")
    localStorage.setItem("theme-accent-intensity", "calm")
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.accentIntensity).toBe("calm")
    expect(
      document.documentElement.style.getPropertyValue("--primary-fill"),
    ).toBe("217 74% 49%")
  })

  it("defaults backgroundIntensity to balanced", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.backgroundIntensity).toBe("balanced")
  })

  it("persists backgroundIntensity and writes its data attribute", () => {
    // Unlike the canvasTint axis it absorbed, this one drives CSS as well as
    // the token engine, so it does carry an attribute.
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setBackgroundIntensity("neutral"))
    expect(result.current.backgroundIntensity).toBe("neutral")
    expect(localStorage.getItem("theme-bg-intensity")).toBe("neutral")
    expect(
      document.documentElement.getAttribute("data-background-intensity"),
    ).toBe("neutral")
  })

  // backgroundIntensity caps how much of the surface hue's saturation the
  // canvas may carry (see CANVAS_SATURATION_CAP in generateTokens.ts).
  // --background
  // and --surface-base share the exact same formula, so they must move
  // together. Default settings resolve slate's surface[950] ("229 84% 5%");
  // "balanced" caps saturation at 16%, "neutral" caps it at 0%.
  it("moves --background and --surface-base when backgroundIntensity changes in dark mode", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setMode("dark"))
    const readBackground = () =>
      document.documentElement.style.getPropertyValue("--background")
    const readSurfaceBase = () =>
      document.documentElement.style.getPropertyValue("--surface-base")

    const balancedBackground = readBackground()
    expect(balancedBackground).toBe("229 16% 5%")
    expect(readSurfaceBase()).toBe(balancedBackground)

    act(() => result.current.setBackgroundIntensity("neutral"))

    expect(readBackground()).toBe("229 0% 5%")
    expect(readBackground()).not.toBe(balancedBackground)
    expect(readSurfaceBase()).toBe(readBackground())
  })
})

describe("useTheme persistence", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", storageMock)
    storageMock.clear()
    mockMatchMedia()
    document.documentElement.removeAttribute("data-mode")
    document.documentElement.style.cssText = ""
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const serverSettings: ThemeSettings = {
    accentColor: "rose",
    surfaceColor: "emerald",
    preset: "glass",
    backgroundStyle: "gradient",
    mode: "dark",
    density: "spacious",
    elevation: "high",
    buttonElevation: "low",
    radius: "pill",
  }

  function createAdapter(
    overrides: Partial<ThemePersistenceAdapter> = {},
  ): ThemePersistenceAdapter {
    return {
      load: vi.fn(() => Promise.resolve(serverSettings)),
      save: vi.fn(() => Promise.resolve()),
      ...overrides,
    }
  }

  function wrapperWith(adapter: ThemePersistenceAdapter) {
    return ({ children }: { children: ReactNode }) => (
      <ThemeProvider persistence={adapter} persistenceDebounce={100}>
        {children}
      </ThemeProvider>
    )
  }

  // Re-enabled in Phase 3 with the glass preset registered
  it("loads settings from adapter on mount", async () => {
    const adapter = createAdapter()
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapperWith(adapter),
    })

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(adapter.load).toHaveBeenCalledOnce()
    expect(result.current.accentColor).toBe("rose")
    expect(result.current.surfaceColor).toBe("emerald")
    expect(result.current.preset).toBe("glass")
    expect(result.current.backgroundStyle).toBe("gradient")
    expect(result.current.mode).toBe("dark")
    expect(result.current.density).toBe("spacious")
    expect(result.current.elevation).toBe("high")
    expect(result.current.buttonElevation).toBe("low")
  })

  it("falls back to config defaults when load returns settings without new fields", async () => {
    const partialSettings: ThemeSettings = {
      accentColor: "violet",
      surfaceColor: "slate",
      preset: "default",
      backgroundStyle: "solid",
      mode: "light",
      // density / elevation / buttonElevation absent
    }
    const adapter = createAdapter({
      load: vi.fn(() => Promise.resolve(partialSettings)),
    })
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapperWith(adapter),
    })

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(result.current.accentColor).toBe("violet")
    expect(result.current.density).toBe("cozy")
    expect(result.current.elevation).toBe("medium")
    expect(result.current.buttonElevation).toBe("flat")
  })

  // Re-enabled in Phase 3 with the glass preset registered
  it("updates localStorage when loading from adapter", async () => {
    const adapter = createAdapter()
    renderHook(() => useTheme(), { wrapper: wrapperWith(adapter) })

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(localStorage.getItem("theme-accent")).toBe("rose")
    expect(localStorage.getItem("theme-surface-color")).toBe("emerald")
    expect(localStorage.getItem("theme-preset")).toBe("glass")
    expect(localStorage.getItem("theme-bg-style")).toBe("gradient")
    expect(localStorage.getItem("mode")).toBe("dark")
    expect(localStorage.getItem("theme-density")).toBe("spacious")
    expect(localStorage.getItem("theme-elevation")).toBe("high")
    expect(localStorage.getItem("theme-button-elevation")).toBe("low")
  })

  it("keeps defaults when load returns null", async () => {
    const adapter = createAdapter({ load: vi.fn(() => Promise.resolve(null)) })
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapperWith(adapter),
    })

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(result.current.accentColor).toBe("blue")
    expect(result.current.syncStatus).toBe("idle")
  })

  it("sets syncStatus to error when load rejects", async () => {
    const adapter = createAdapter({
      load: vi.fn(() => Promise.reject(new Error("network error"))),
    })
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapperWith(adapter),
    })

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(result.current.syncStatus).toBe("error")
    expect(result.current.accentColor).toBe("blue")
  })

  it("calls save with debounce when a setter is used", async () => {
    const adapter = createAdapter({
      load: vi.fn(() => Promise.resolve(null)),
    })
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapperWith(adapter),
    })

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    act(() => result.current.setAccentColor("pink"))

    expect(adapter.save).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    expect(adapter.save).toHaveBeenCalledOnce()
    expect(adapter.save).toHaveBeenCalledWith(
      expect.objectContaining({ accentColor: "pink" }),
    )
  })

  it("coalesces rapid changes into a single save", async () => {
    const adapter = createAdapter({
      load: vi.fn(() => Promise.resolve(null)),
    })
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapperWith(adapter),
    })

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    act(() => {
      result.current.setAccentColor("red")
      result.current.setAccentColor("green")
      result.current.setAccentColor("violet")
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    expect(adapter.save).toHaveBeenCalledOnce()
    expect(adapter.save).toHaveBeenCalledWith(
      expect.objectContaining({ accentColor: "violet" }),
    )
  })

  it("sets syncStatus to error when save rejects", async () => {
    const adapter = createAdapter({
      load: vi.fn(() => Promise.resolve(null)),
      save: vi.fn(() => Promise.reject(new Error("save failed"))),
    })
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapperWith(adapter),
    })

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    act(() => result.current.setAccentColor("pink"))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    expect(result.current.syncStatus).toBe("error")
    expect(result.current.accentColor).toBe("pink")
  })

  it("discards server load when user changes theme before load completes", async () => {
    let resolveLoad: ((value: ThemeSettings | null) => void) | undefined
    const adapter = createAdapter({
      load: vi.fn(
        () =>
          new Promise<ThemeSettings | null>((resolve) => {
            resolveLoad = resolve
          }),
      ),
    })
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapperWith(adapter),
    })

    act(() => result.current.setAccentColor("pink"))

    await act(async () => {
      resolveLoad?.(serverSettings)
      await vi.runAllTimersAsync()
    })

    expect(result.current.accentColor).toBe("pink")
  })

  it("fires onChange callback independently of persistence", async () => {
    const onChangeSpy = vi.fn()
    const adapter = createAdapter({
      load: vi.fn(() => Promise.resolve(null)),
    })

    const wrapperWithOnChange = ({ children }: { children: ReactNode }) => (
      <ThemeProvider
        persistence={adapter}
        persistenceDebounce={100}
        onChange={onChangeSpy}
      >
        {children}
      </ThemeProvider>
    )

    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapperWithOnChange,
    })

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    act(() => result.current.setAccentColor("pink"))

    expect(onChangeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ accentColor: "pink" }),
    )
  })

  it("persists accent vibrancy and feeds it to the token engine", async () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.accentIntensity).toBe("balanced")

    act(() => result.current.setAccentIntensity("intense"))

    expect(result.current.accentIntensity).toBe("intense")
    expect(localStorage.getItem("theme-accent-intensity")).toBe("intense")
    // The axis is token-only: it must not leak a data attribute.
    expect(
      document.documentElement.getAttribute("data-accent-intensity"),
    ).toBeNull()
  })

  it("falls back to the configured default for an unknown stored value", () => {
    localStorage.setItem("theme-accent-intensity", "nonsense")
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.accentIntensity).toBe("balanced")
  })
})
