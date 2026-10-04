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
    document.documentElement.removeAttribute("data-sidebar-selection")
    document.documentElement.style.cssText = ""
  })

  it("returns default axis values", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.accentColor).toBe("blue")
    expect(result.current.surfaceColor).toBe("zinc")
    expect(result.current.style).toBe("quiet")
    expect(result.current.mode).toBe("system")
  })

  it("setAccentColor updates accent and persists to localStorage", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setAccentColor("rose"))
    expect(result.current.accentColor).toBe("rose")
    expect(localStorage.getItem("theme-accent")).toBe("rose")
  })

  it("setStyle updates style and persists to theme-preset key", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setStyle("glass"))
    expect(result.current.style).toBe("glass")
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
    storageMock.setItem("theme-surface-color", "stone")
    storageMock.setItem("theme-preset", "glass")
    storageMock.setItem("mode", "dark")

    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.accentColor).toBe("emerald")
    expect(result.current.surfaceColor).toBe("stone")
    expect(result.current.style).toBe("glass")
    expect(result.current.mode).toBe("dark")
  })

  it("setSurfaceColor updates surfaceColor and persists to localStorage", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setSurfaceColor("stone"))
    expect(result.current.surfaceColor).toBe("stone")
    expect(localStorage.getItem("theme-surface-color")).toBe("stone")
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

  it("returns config defaults for new axes when localStorage is empty", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.density).toBe("cozy")
    expect(result.current.elevation).toBe("standard")
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

  // The chroma axis is a dark-mode-only lever, and the tokens it moves are
  // --primary-fill and --primary.
  it("repaints accent tokens when the dark accent chroma changes", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setMode("dark"))
    act(() => result.current.setAccentColor("violet"))
    const fills = () =>
      document.documentElement.style.getPropertyValue("--primary-fill")
    const marks = () =>
      document.documentElement.style.getPropertyValue("--primary")

    const standard = [fills(), marks()]
    act(() => result.current.setDarkAccentChroma("vivid"))
    const vivid = [fills(), marks()]
    act(() => result.current.setDarkAccentChroma("calm"))
    const calm = [fills(), marks()]

    expect(new Set([standard[0], vivid[0], calm[0]]).size).toBe(3)
    expect(new Set([standard[1], vivid[1], calm[1]]).size).toBe(3)
  })

  it("honours a stored dark accent chroma on first paint without a setter call", () => {
    localStorage.setItem("mode", "dark")
    localStorage.setItem("theme-dark-accent-chroma", "calm")
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.darkAccentChroma).toBe("calm")
    const read = () =>
      document.documentElement.style.getPropertyValue("--primary-fill")
    const calm = read()
    act(() => result.current.setDarkAccentChroma("standard"))
    expect(calm).toBeTruthy()
    expect(calm).not.toBe(read())
  })

  it("defaults backgroundIntensity to vivid", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.backgroundIntensity).toBe("vivid")
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
  // canvas may carry (see CANVAS_SATURATION_CAP in canvas.ts). --background
  // and --surface-base share the exact same formula, so they must move
  // together. The default "vivid" step leaves the neutral's saturation
  // uncapped; "neutral" caps it at 0%.
  it("moves --background and --surface-base when backgroundIntensity changes in dark mode", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setMode("dark"))
    const readBackground = () =>
      document.documentElement.style.getPropertyValue("--background")
    const readSurfaceBase = () =>
      document.documentElement.style.getPropertyValue("--surface-base")
    const saturation = (hsl: string) => parseFloat(hsl.split(" ")[1] ?? "")

    const vividBackground = readBackground()
    expect(saturation(vividBackground)).toBeGreaterThan(0)
    expect(readSurfaceBase()).toBe(vividBackground)

    act(() => result.current.setBackgroundIntensity("neutral"))

    expect(saturation(readBackground())).toBe(0)
    expect(readBackground()).not.toBe(vividBackground)
    expect(readSurfaceBase()).toBe(readBackground())
  })

  it("keeps the sidebar selection off the document element", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setSidebarSelection("pill"))
    expect(result.current.sidebarSelection).toBe("pill")
    expect(
      document.documentElement.hasAttribute("data-sidebar-selection"),
    ).toBe(false)
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
    surfaceColor: "stone",
    style: "glass",
    backgroundStyle: "gradient",
    mode: "dark",
    density: "spacious",
    elevation: "high",
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
    expect(result.current.surfaceColor).toBe("stone")
    expect(result.current.style).toBe("glass")
    expect(result.current.backgroundStyle).toBe("gradient")
    expect(result.current.mode).toBe("dark")
    expect(result.current.density).toBe("spacious")
    expect(result.current.elevation).toBe("high")
  })

  it("loads quiet when synced settings name a removed preset", async () => {
    const adapter = createAdapter({
      load: vi.fn(() =>
        Promise.resolve({
          accentColor: "rose",
          preset: "scifi",
          mode: "dark",
        } as unknown as ThemeSettings),
      ),
    })
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapperWith(adapter),
    })

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(result.current.style).toBe("quiet")
    expect(result.current.mode).toBe("dark")
    expect(result.current.accentColor).toBe("rose")
  })

  it("falls back to config defaults when load returns settings without new fields", async () => {
    const partialSettings: ThemeSettings = {
      accentColor: "violet",
      surfaceColor: "slate",
      style: "quiet",
      backgroundStyle: "solid",
      mode: "light",
      // density / elevation absent
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
    expect(result.current.elevation).toBe("standard")
  })

  // Re-enabled in Phase 3 with the glass preset registered
  it("updates localStorage when loading from adapter", async () => {
    const adapter = createAdapter()
    renderHook(() => useTheme(), { wrapper: wrapperWith(adapter) })

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(localStorage.getItem("theme-accent")).toBe("rose")
    expect(localStorage.getItem("theme-surface-color")).toBe("stone")
    expect(localStorage.getItem("theme-preset")).toBe("glass")
    expect(localStorage.getItem("theme-bg-style")).toBe("gradient")
    expect(localStorage.getItem("mode")).toBe("dark")
    expect(localStorage.getItem("theme-density")).toBe("spacious")
    expect(localStorage.getItem("theme-elevation")).toBe("high")
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
      expect.anything(),
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
      expect.anything(),
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

  it("falls back to the configured default for an unknown stored value", () => {
    localStorage.setItem("theme-density", "nonsense")
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.density).toBe("cozy")
  })

  it("falls back to the default mode for an unknown stored mode", () => {
    localStorage.setItem("mode", "neon")
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.mode).toBe("system")
    expect(result.current.resolvedMode).toBe("light")
    expect(document.documentElement.getAttribute("data-mode")).toBe("light")
  })

  it("falls back to the default accent for an unknown stored accent", () => {
    localStorage.setItem("theme-accent", "nonsense")
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.accentColor).toBe("blue")
    expect(
      document.documentElement.style.getPropertyValue("--primary"),
    ).toBeTruthy()
  })

  it("falls back to the default background style for an unknown stored one", () => {
    localStorage.setItem("theme-bg-style", "nonsense")
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.backgroundStyle).toBe("solid")
  })
})

describe("useTheme shell style", () => {
  it("leaves shell style to the layout", () => {
    document.documentElement.removeAttribute("data-shell-style")
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current).not.toHaveProperty("shellStyle")
    expect(result.current).not.toHaveProperty("setShellStyle")
    expect(document.documentElement.hasAttribute("data-shell-style")).toBe(
      false,
    )
  })
})
