import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ThemeProvider } from "./ThemeProvider"
import { useTheme } from "@theme/useTheme"
import {
  TOKEN_CACHE_STORAGE_KEY,
  readTokenCache,
  tokenCacheId,
} from "@theme/axes/tokenCache"
import type { ThemePersistenceAdapter } from "@theme/types"

function mockMatchMedia(dark = false) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: dark,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

const wrap = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute("data-accent")
  document.documentElement.removeAttribute("data-surface")
  document.documentElement.style.cssText = ""
  mockMatchMedia()
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
    expect(document.documentElement.getAttribute("data-accent")).toBe("blue")
    expect(document.documentElement.getAttribute("data-surface")).toBe("slate")
    act(() => result.current.setAccentColor("violet"))
    expect(document.documentElement.getAttribute("data-accent")).toBe("violet")
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

  it("caches the painted tokens under the current settings", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setAccentColor("rose"))
    const cache = readTokenCache(localStorage)
    expect(cache?.id).toBe(
      tokenCacheId((k) => localStorage.getItem(k), "light"),
    )
    expect(cache?.tokens["--primary"]).toBe(
      document.documentElement.style.getPropertyValue("--primary"),
    )
    expect(localStorage.getItem(TOKEN_CACHE_STORAGE_KEY)).not.toBeNull()
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
    vi.useRealTimers()
  })
})
