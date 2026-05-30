// packages/ui/src/theme/theme-provider/applyTheme.test.tsx
import { describe, it, expect, beforeEach, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import type { ReactNode } from "react"
import { ThemeProvider } from "./ThemeProvider"
import { useTheme } from "../useTheme"
import { glass } from "../presets/glass/glass"

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
    document.documentElement.removeAttribute("data-glass-opacity")
    document.documentElement.removeAttribute("data-glass-blur")
    document.documentElement.style.cssText = ""
  })

  it("writes data-preset on mount", () => {
    renderHook(() => useTheme(), { wrapper: wrap })
    expect(document.documentElement.getAttribute("data-preset")).toBe("default")
  })

  it("does NOT write glass axis attributes when default preset is active", () => {
    renderHook(() => useTheme(), { wrapper: wrap })
    expect(document.documentElement.getAttribute("data-glass-opacity")).toBe(
      null,
    )
    expect(document.documentElement.getAttribute("data-glass-blur")).toBe(null)
  })

  it("writes glass axis attributes when switching to glass", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setPreset("glass"))
    expect(document.documentElement.getAttribute("data-preset")).toBe("glass")
    expect(document.documentElement.getAttribute("data-glass-opacity")).toBe(
      "medium",
    )
    expect(document.documentElement.getAttribute("data-glass-blur")).toBe(
      "medium",
    )
  })

  it("removes glass axis attributes when switching back to default", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setPreset("glass"))
    act(() => result.current.setPreset("default"))
    expect(document.documentElement.getAttribute("data-glass-opacity")).toBe(
      null,
    )
    expect(document.documentElement.getAttribute("data-glass-blur")).toBe(null)
  })

  it("sticky persistence: setting glass-opacity survives a round-trip through default", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setPreset("glass"))
    act(() => result.current.setPresetAxis("opacity", "strong"))
    expect(document.documentElement.getAttribute("data-glass-opacity")).toBe(
      "strong",
    )

    act(() => result.current.setPreset("default"))
    expect(document.documentElement.getAttribute("data-glass-opacity")).toBe(
      null,
    )

    act(() => result.current.setPreset("glass"))
    expect(document.documentElement.getAttribute("data-glass-opacity")).toBe(
      "strong",
    )
  })

  it("sticky persistence: glass axis values survive remount via LocalStorage", () => {
    {
      const { result } = renderHook(() => useTheme(), { wrapper: wrap })
      act(() => result.current.setPreset("glass"))
      act(() => result.current.setPresetAxis("blur", "high"))
    }
    expect(localStorage.getItem("theme-glass-blur")).toBe("high")

    // Fresh provider; should rehydrate from LocalStorage.
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setPreset("glass"))
    expect(document.documentElement.getAttribute("data-glass-blur")).toBe(
      "high",
    )
  })

  it("writes preset-owned tokens to documentElement.style when glass active", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setPreset("glass"))
    // After the accent-tint update, --fog-05 is a nested color-mix
    // expression: outer color-mix sets alpha, inner color-mix builds an
    // accent-tinted white base. Just assert the shape; the unit tests in
    // glass.test.ts cover exact values per opacity × mode.
    expect(document.documentElement.style.getPropertyValue("--fog-05")).toMatch(
      /^color-mix\(in oklab, color-mix\(in oklab, hsl\(.+\) \d+%, white\) [\d.]+%, transparent\)$/,
    )
  })

  it("clears preset-owned tokens from documentElement.style when leaving glass", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setPreset("glass"))
    expect(
      document.documentElement.style.getPropertyValue("--fog-05"),
    ).not.toBe("")

    act(() => result.current.setPreset("default"))
    expect(document.documentElement.style.getPropertyValue("--fog-05")).toBe("")
  })

  it("self-clean: ALL glass-specific owned tokens are removed when leaving glass", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setPreset("glass"))
    // Glass-specific keys: the fog/inset/halo families. (--accent/--muted/
    // --secondary/--border are also in ownedTokenKeys but the common engine
    // re-writes them for every preset, so they're overwritten, not removed.)
    const glassOnly = glass.ownedTokenKeys.filter(
      (k) =>
        k.startsWith("--fog-") ||
        k.startsWith("--inset-hi") ||
        k.startsWith("--glass-halo-"),
    )
    expect(glassOnly.length).toBeGreaterThan(0)
    for (const key of glassOnly) {
      expect(document.documentElement.style.getPropertyValue(key)).not.toBe("")
    }
    act(() => result.current.setPreset("default"))
    for (const key of glassOnly) {
      expect(document.documentElement.style.getPropertyValue(key)).toBe("")
    }
  })

  it("CSS-only glass tokens are never written to inline style", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setPreset("glass"))
    // These live in glass.css attribute selectors, not generateTokens, so
    // they must never appear as inline documentElement styles (and thus are
    // correctly excluded from ownedTokenKeys).
    for (const key of [
      "--surface-opacity",
      "--backdrop-filter",
      "--backdrop-blur",
      "--glass-state-hover-glow",
      "--glass-state-active-inset",
      "--glass-state-selected-fill",
    ]) {
      // These live in glass.css attribute selectors, never in inline style.
      expect(document.documentElement.style.getPropertyValue(key)).toBe("")
    }
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
    act(() => result.current.setPreset("glass"))
    act(() => result.current.setPresetAxis("opacity", "extreme"))
    expect(warn).toHaveBeenCalled()
    expect(document.documentElement.getAttribute("data-glass-opacity")).toBe(
      "medium",
    )
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

  it("setPreset('neon') from light mode auto-switches to dark", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setMode("light"))
    expect(result.current.resolvedMode).toBe("light")
    act(() => result.current.setPreset("neon"))
    expect(result.current.preset).toBe("neon")
    expect(result.current.resolvedMode).toBe("dark")
    expect(result.current.mode).toBe("dark")
    expect(document.documentElement.getAttribute("data-mode")).toBe("dark")
    expect(localStorage.getItem("mode")).toBe("dark")
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it("setMode('light') while neon active resets preset to default", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setPreset("neon"))
    expect(result.current.preset).toBe("neon")
    act(() => result.current.setMode("light"))
    expect(result.current.preset).toBe("default")
    expect(result.current.resolvedMode).toBe("light")
    expect(localStorage.getItem("theme-preset")).toBe("default")
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it("setPreset to a preset WITHOUT supportedModes (glass) leaves mode alone", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setMode("light"))
    expect(result.current.resolvedMode).toBe("light")
    act(() => result.current.setPreset("glass"))
    expect(result.current.preset).toBe("glass")
    expect(result.current.resolvedMode).toBe("light")
  })
})
