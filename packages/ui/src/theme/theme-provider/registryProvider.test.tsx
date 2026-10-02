import { act, render, renderHook } from "@testing-library/react"
import { StrictMode, type ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ThemeProvider } from "./ThemeProvider"
import { useTheme } from "@theme/useTheme"
import {
  TOKEN_CACHE_STORAGE_KEY,
  cacheInputKeys,
  readTokenCache,
} from "@theme/axes/tokenCache"
import { buildPrerenderScript } from "@theme/axes/prerender"
import { themeConfig } from "@theme/themeConfig"
import type { ThemePersistenceAdapter } from "@theme/types"

const root = document.documentElement

function mockColorScheme(dark = false) {
  const listeners = new Set<() => void>()
  let current = dark
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      get matches() {
        return current
      },
      media: query,
      addEventListener: (_type: string, listener: () => void) =>
        listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) =>
        listeners.delete(listener),
    })),
  )
  return {
    setDark(next: boolean) {
      current = next
      for (const listener of listeners) listener()
    },
  }
}

// The pre-render script is the token cache's real consumer, so it checks the
// cache id instead of a second call to the function that built it.
function runPrerender() {
  new Function(buildPrerenderScript())()
}

function cacheWrites(spy: { mock: { calls: unknown[][] } }) {
  return spy.mock.calls.filter(([key]) => key === TOKEN_CACHE_STORAGE_KEY)
    .length
}

const wrap = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

beforeEach(() => {
  localStorage.clear()
  for (const name of root.getAttributeNames()) root.removeAttribute(name)
  root.style.cssText = ""
  mockColorScheme()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("ThemeProvider on the axis registry", () => {
  it("writes nothing to storage until the user sets an axis", () => {
    renderHook(() => useTheme(), { wrapper: wrap })
    expect(localStorage.getItem("theme-density")).toBeNull()
    expect(localStorage.getItem("theme-accent")).toBeNull()
  })

  it("persists only the axis the user set", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setDensity("spacious"))
    expect(localStorage.getItem("theme-density")).toBe("spacious")
    expect(localStorage.getItem("theme-radius")).toBeNull()
  })

  it("stamps data-accent and data-surface", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    expect(root.getAttribute("data-accent")).toBe("blue")
    expect(root.getAttribute("data-surface")).toBe("slate")
    act(() => result.current.setAccentColor("violet"))
    expect(root.getAttribute("data-accent")).toBe("violet")
  })

  it("keeps every change when several setters run in one batch", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => {
      result.current.setDensity("compact")
      result.current.setRadius("pill")
      result.current.setAxis("fontSize", "large")
    })
    expect(result.current.density).toBe("compact")
    expect(result.current.radius).toBe("pill")
    expect(result.current.fontSize).toBe("large")
  })

  it("ignores an invalid value", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setAxis("density", "huge" as never))
    expect(result.current.density).toBe("cozy")
    expect(localStorage.getItem("theme-density")).toBeNull()
    warn.mockRestore()
  })

  it("caches the painted tokens where the pre-render script finds them", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setAccentColor("rose"))
    const painted = root.style.getPropertyValue("--primary")
    expect(painted).not.toBe("")
    expect(readTokenCache(localStorage)?.tokens["--primary"]).toBe(painted)
    root.style.cssText = ""
    runPrerender()
    expect(root.style.getPropertyValue("--primary")).toBe(painted)
  })

  it("sanitises a synced payload and drops dead preset axes", async () => {
    vi.useFakeTimers()
    const adapter: ThemePersistenceAdapter = {
      load: vi.fn(() =>
        Promise.resolve({
          accentColor: "rose",
          mode: "sepia",
          presetAxisValues: {
            scifi: { glow: "high" },
            glass: { blur: "high" },
          },
        } as never),
      ),
      save: vi.fn(() => Promise.resolve()),
    }
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <ThemeProvider persistence={adapter} persistenceDebounce={50}>
          {children}
        </ThemeProvider>
      ),
    })
    await act(async () => {
      await vi.runAllTimersAsync()
    })
    expect(result.current.accentColor).toBe("rose")
    expect(result.current.mode).toBe("system")
    expect(localStorage.getItem("mode")).toBeNull()
    expect(result.current.presetAxisValues).toEqual({
      default: {},
      glass: { opacity: "medium", blur: "high" },
    })
    act(() => result.current.setDensity("compact"))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60)
    })
    const saved = (adapter.save as ReturnType<typeof vi.fn>).mock.calls.at(
      -1,
    )?.[0]
    expect(saved).toEqual({
      accentColor: "rose",
      density: "compact",
      presetAxisValues: {
        default: {},
        glass: { opacity: "medium", blur: "high" },
      },
    })
  })

  it("repaints and re-caches when the system colour scheme changes", () => {
    const scheme = mockColorScheme(false)
    renderHook(() => useTheme(), { wrapper: wrap })
    expect(root.getAttribute("data-mode")).toBe("light")
    const light = root.style.getPropertyValue("--background")
    act(() => scheme.setDark(true))
    expect(root.getAttribute("data-mode")).toBe("dark")
    const dark = root.style.getPropertyValue("--background")
    expect(dark).not.toBe(light)
    root.style.cssText = ""
    runPrerender()
    expect(root.style.getPropertyValue("--background")).toBe(dark)
  })

  it("paints and caches once per setter call", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    const setItem = vi.spyOn(Storage.prototype, "setItem")
    act(() => result.current.setAccentColor("rose"))
    expect(cacheWrites(setItem)).toBe(1)
  })

  it("does not repaint when an inline config re-renders unchanged", () => {
    const { rerender } = renderHook(() => useTheme(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <ThemeProvider
          config={{ ...themeConfig, defaults: { ...themeConfig.defaults } }}
        >
          {children}
        </ThemeProvider>
      ),
    })
    const setItem = vi.spyOn(Storage.prototype, "setItem")
    rerender()
    expect(cacheWrites(setItem)).toBe(0)
  })

  it("reads each stored key once at mount", () => {
    localStorage.setItem("mode", "dark")
    const inputs = new Set(cacheInputKeys())
    const getItem = vi.spyOn(Storage.prototype, "getItem")
    renderHook(() => useTheme(), { wrapper: wrap })
    const reads = getItem.mock.calls
      .map(([key]) => key)
      .filter((key) => inputs.has(key))
    expect(reads.length).toBeGreaterThan(0)
    expect(reads).toHaveLength(new Set(reads).size)
  })

  it("repaints when effects re-run on the same instance", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem")
    render(
      <StrictMode>
        <ThemeProvider>{null}</ThemeProvider>
      </StrictMode>,
    )
    expect(cacheWrites(setItem)).toBe(2)
  })

  it("does not label new tokens with the old id when a write fails", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    const setItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (key === "theme-accent") {
        throw new DOMException("full", "QuotaExceededError")
      }
      setItem.call(this, key, value)
    })
    act(() => result.current.setAccentColor("rose"))
    expect(localStorage.getItem("theme-accent")).toBeNull()
    expect(readTokenCache(localStorage)?.tokens["--primary"]).toBe(
      root.style.getPropertyValue("--primary"),
    )
    root.style.cssText = ""
    runPrerender()
    expect(root.style.getPropertyValue("--primary")).toBe("")
  })
})
