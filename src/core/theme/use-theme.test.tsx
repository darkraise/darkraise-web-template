import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { useTheme } from "./use-theme"
import { ThemeProvider } from "./theme-provider"
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
    document.documentElement.removeAttribute("data-theme")
    document.documentElement.removeAttribute("data-mode")
  })

  it("returns default theme and system mode", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe("default")
    expect(result.current.mode).toBe("system")
  })

  it("setTheme updates theme attribute", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setTheme("emerald"))
    expect(result.current.theme).toBe("emerald")
    expect(document.documentElement.getAttribute("data-theme")).toBe("emerald")
  })

  it("setMode updates mode attribute", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setMode("dark"))
    expect(result.current.mode).toBe("dark")
    expect(document.documentElement.getAttribute("data-mode")).toBe("dark")
  })

  it("persists to localStorage", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setTheme("rose"))
    expect(localStorage.getItem("theme")).toBe("rose")
  })
})
