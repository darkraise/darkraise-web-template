import { renderHook, act } from "@testing-library/react"
import { afterEach, describe, it, expect, beforeEach, vi } from "vitest"
import { useTheme } from "./use-theme"
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
    document.documentElement.style.cssText = ""
  })

  it("returns default axis values", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.accentColor).toBe("blue")
    expect(result.current.surfaceColor).toBe("slate")
    expect(result.current.surfaceStyle).toBe("default")
    expect(result.current.mode).toBe("system")
  })

  it("setAccentColor updates accent and persists to localStorage", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setAccentColor("rose"))
    expect(result.current.accentColor).toBe("rose")
    expect(localStorage.getItem("theme-accent")).toBe("rose")
  })

  it("setSurfaceStyle updates style and persists to localStorage", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setSurfaceStyle("glassmorphism"))
    expect(result.current.surfaceStyle).toBe("glassmorphism")
    expect(localStorage.getItem("theme-style")).toBe("glassmorphism")
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
    expect(style.getPropertyValue("--radius")).toBeTruthy()
  })

  it("throws when used outside ThemeProvider", () => {
    expect(() => {
      renderHook(() => useTheme())
    }).toThrow("useTheme must be used within a ThemeProvider")
  })

  it("reads persisted values from localStorage on mount", () => {
    storageMock.setItem("theme-accent", "emerald")
    storageMock.setItem("theme-surface-color", "teal")
    storageMock.setItem("theme-style", "glassmorphism")
    storageMock.setItem("mode", "dark")

    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.accentColor).toBe("emerald")
    expect(result.current.surfaceColor).toBe("teal")
    expect(result.current.surfaceStyle).toBe("glassmorphism")
    expect(result.current.mode).toBe("dark")
  })

  it("setSurfaceColor updates surfaceColor and persists to localStorage", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setSurfaceColor("emerald"))
    expect(result.current.surfaceColor).toBe("emerald")
    expect(localStorage.getItem("theme-surface-color")).toBe("emerald")
  })

  it("syncStatus is idle when no persistence adapter is provided", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.syncStatus).toBe("idle")
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
    surfaceStyle: "glassmorphism",
    backgroundStyle: "gradient",
    fontFamily: "editorial",
    mode: "dark",
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
    expect(result.current.surfaceColor).toBe("emerald")
    expect(result.current.surfaceStyle).toBe("glassmorphism")
    expect(result.current.backgroundStyle).toBe("gradient")
    expect(result.current.fontFamily).toBe("editorial")
    expect(result.current.mode).toBe("dark")
  })

  it("updates localStorage when loading from adapter", async () => {
    const adapter = createAdapter()
    renderHook(() => useTheme(), { wrapper: wrapperWith(adapter) })

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(localStorage.getItem("theme-accent")).toBe("rose")
    expect(localStorage.getItem("theme-surface-color")).toBe("emerald")
    expect(localStorage.getItem("theme-style")).toBe("glassmorphism")
    expect(localStorage.getItem("theme-bg-style")).toBe("gradient")
    expect(localStorage.getItem("theme-font")).toBe("editorial")
    expect(localStorage.getItem("mode")).toBe("dark")
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
})
