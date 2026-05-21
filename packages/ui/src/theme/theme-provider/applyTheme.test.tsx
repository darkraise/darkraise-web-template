// packages/ui/src/theme/theme-provider/applyTheme.test.tsx
import { describe, it, expect, beforeEach, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import type { ReactNode } from "react"
import { ThemeProvider } from "./ThemeProvider"
import { useTheme } from "../useTheme"

function wrap({ children }: { children: ReactNode }) {
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

describe("ThemeProvider preset orchestration", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", storageMock)
    storageMock.clear()
    mockMatchMedia()
    document.documentElement.removeAttribute("data-preset")
    document.documentElement.removeAttribute("data-glassmorphism-opacity")
    document.documentElement.removeAttribute("data-glassmorphism-blur")
    document.documentElement.style.cssText = ""
  })

  it("writes data-preset on mount", () => {
    renderHook(() => useTheme(), { wrapper: wrap })
    expect(document.documentElement.getAttribute("data-preset")).toBe("default")
  })

  it("does NOT write glass axis attributes when default preset is active", () => {
    renderHook(() => useTheme(), { wrapper: wrap })
    expect(
      document.documentElement.getAttribute("data-glassmorphism-opacity"),
    ).toBe(null)
    expect(
      document.documentElement.getAttribute("data-glassmorphism-blur"),
    ).toBe(null)
  })

  it("writes glass axis attributes when switching to glass", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setPreset("glassmorphism"))
    expect(document.documentElement.getAttribute("data-preset")).toBe(
      "glassmorphism",
    )
    expect(
      document.documentElement.getAttribute("data-glassmorphism-opacity"),
    ).toBe("medium")
    expect(
      document.documentElement.getAttribute("data-glassmorphism-blur"),
    ).toBe("medium")
  })

  it("removes glass axis attributes when switching back to default", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setPreset("glassmorphism"))
    act(() => result.current.setPreset("default"))
    expect(
      document.documentElement.getAttribute("data-glassmorphism-opacity"),
    ).toBe(null)
    expect(
      document.documentElement.getAttribute("data-glassmorphism-blur"),
    ).toBe(null)
  })

  it("sticky persistence: setting glass-opacity survives a round-trip through default", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setPreset("glassmorphism"))
    act(() => result.current.setPresetAxis("opacity", "strong"))
    expect(
      document.documentElement.getAttribute("data-glassmorphism-opacity"),
    ).toBe("strong")

    act(() => result.current.setPreset("default"))
    expect(
      document.documentElement.getAttribute("data-glassmorphism-opacity"),
    ).toBe(null)

    act(() => result.current.setPreset("glassmorphism"))
    expect(
      document.documentElement.getAttribute("data-glassmorphism-opacity"),
    ).toBe("strong")
  })

  it("sticky persistence: glass axis values survive remount via LocalStorage", () => {
    {
      const { result } = renderHook(() => useTheme(), { wrapper: wrap })
      act(() => result.current.setPreset("glassmorphism"))
      act(() => result.current.setPresetAxis("blur", "high"))
    }
    expect(localStorage.getItem("theme-glassmorphism-blur")).toBe("high")

    // Fresh provider; should rehydrate from LocalStorage.
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setPreset("glassmorphism"))
    expect(
      document.documentElement.getAttribute("data-glassmorphism-blur"),
    ).toBe("high")
  })

  it("writes preset-owned tokens to documentElement.style when glass active", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setPreset("glassmorphism"))
    expect(document.documentElement.style.getPropertyValue("--fog-05")).toMatch(
      /^rgba\(255, 255, 255, 0\.\d+\)$/,
    )
  })

  it("clears preset-owned tokens from documentElement.style when leaving glass", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setPreset("glassmorphism"))
    expect(
      document.documentElement.style.getPropertyValue("--fog-05"),
    ).not.toBe("")

    act(() => result.current.setPreset("default"))
    expect(document.documentElement.style.getPropertyValue("--fog-05")).toBe("")
  })

  it("setPresetAxis on invalid axis name no-ops with dev warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setPresetAxis("nonexistent", "value"))
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it("setPresetAxis on invalid value for known axis no-ops with dev warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setPreset("glassmorphism"))
    act(() => result.current.setPresetAxis("opacity", "extreme"))
    expect(warn).toHaveBeenCalled()
    expect(
      document.documentElement.getAttribute("data-glassmorphism-opacity"),
    ).toBe("medium")
    warn.mockRestore()
  })

  it("writes data-background-intensity='balanced' on mount", () => {
    renderHook(() => useTheme(), { wrapper: wrap })
    expect(
      document.documentElement.getAttribute("data-background-intensity"),
    ).toBe("balanced")
  })

  it("setBackgroundIntensity updates attribute and persists", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setBackgroundIntensity("vivid"))
    expect(
      document.documentElement.getAttribute("data-background-intensity"),
    ).toBe("vivid")
    expect(localStorage.getItem("theme-bg-intensity")).toBe("vivid")
    expect(result.current.backgroundIntensity).toBe("vivid")
  })

  it("background intensity survives provider remount via LocalStorage", () => {
    {
      const { result } = renderHook(() => useTheme(), { wrapper: wrap })
      act(() => result.current.setBackgroundIntensity("subtle"))
    }
    // Fresh provider; should rehydrate from LocalStorage.
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    expect(result.current.backgroundIntensity).toBe("subtle")
    expect(
      document.documentElement.getAttribute("data-background-intensity"),
    ).toBe("subtle")
  })

  it("writes data-gradient-pattern='blobs' on mount", () => {
    renderHook(() => useTheme(), { wrapper: wrap })
    expect(document.documentElement.getAttribute("data-gradient-pattern")).toBe(
      "blobs",
    )
  })

  it("setGradientPattern updates attribute and persists", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setGradientPattern("aurora"))
    expect(document.documentElement.getAttribute("data-gradient-pattern")).toBe(
      "aurora",
    )
    expect(localStorage.getItem("theme-gradient-pattern")).toBe("aurora")
    expect(result.current.gradientPattern).toBe("aurora")
  })

  it("gradient pattern survives provider remount via LocalStorage", () => {
    {
      const { result } = renderHook(() => useTheme(), { wrapper: wrap })
      act(() => result.current.setGradientPattern("mesh"))
    }
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    expect(result.current.gradientPattern).toBe("mesh")
    expect(document.documentElement.getAttribute("data-gradient-pattern")).toBe(
      "mesh",
    )
  })
})
