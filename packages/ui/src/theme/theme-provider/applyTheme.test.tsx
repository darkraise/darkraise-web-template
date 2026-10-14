// packages/ui/src/theme/theme-provider/applyTheme.test.tsx
import { describe, it, expect, beforeEach, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
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

describe("ThemeProvider style orchestration", () => {
  const root = document.documentElement

  beforeEach(() => {
    vi.stubGlobal("localStorage", storageMock)
    storageMock.clear()
    mockMatchMedia()
    root.removeAttribute("data-preset")
    root.removeAttribute("data-style")
    root.removeAttribute("data-glass-transparency")
    root.removeAttribute("data-glass-blur")
    root.style.cssText = ""
  })

  it("stamps data-style, the glass axes and the base preset", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    for (const style of ["quiet", "flat", "tactile", "glass"] as const) {
      act(() => result.current.setStyle(style))
      expect(root.getAttribute("data-style")).toBe(style)
      expect(root.getAttribute("data-glass-transparency")).toBe("medium")
      expect(root.getAttribute("data-glass-blur")).toBe("medium")
      expect(root.getAttribute("data-preset")).toBe("base")
    }
  })

  it("stamps the glass axes under every style", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    expect(root.getAttribute("data-glass-transparency")).toBe("medium")
    expect(root.getAttribute("data-glass-blur")).toBe("medium")
    act(() => result.current.setStyle("glass"))
    expect(root.getAttribute("data-style")).toBe("glass")
    expect(root.getAttribute("data-glass-transparency")).toBe("medium")
    expect(root.getAttribute("data-glass-blur")).toBe("medium")
  })

  it("persists the style under its own storage key", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setStyle("tactile"))
    expect(result.current.style).toBe("tactile")
    expect(localStorage.getItem("theme-style")).toBe("tactile")
  })

  it("keeps a glass transparency across a round trip through another style", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setStyle("glass"))
    act(() => result.current.setGlassTransparency("high"))
    expect(root.getAttribute("data-glass-transparency")).toBe("high")
    act(() => result.current.setStyle("quiet"))
    act(() => result.current.setStyle("glass"))
    expect(result.current.glassTransparency).toBe("high")
    expect(root.getAttribute("data-glass-transparency")).toBe("high")
  })

  it("restores the glass axes from storage on remount", () => {
    {
      const { result } = renderHook(() => useTheme(), { wrapper: wrap })
      act(() => result.current.setStyle("glass"))
      act(() => result.current.setGlassBlur("high"))
    }
    expect(localStorage.getItem("theme-glass-blur")).toBe("high")

    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    expect(result.current.glassBlur).toBe("high")
    expect(root.getAttribute("data-glass-blur")).toBe("high")
  })

  it("paints engine tokens alone under glass: the glass stylesheet owns its tokens", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    // Glass defaults the background to gradient; pin it so only the style
    // differs between the two reads.
    act(() => result.current.setBackgroundStyle("solid"))
    const style = document.documentElement.style
    const shared = ["--accent", "--muted", "--secondary", "--border"]
    const quiet = shared.map((key) => style.getPropertyValue(key))

    act(() => result.current.setStyle("glass"))

    expect(shared.map((key) => style.getPropertyValue(key))).toEqual(quiet)
    expect(style.getPropertyValue("--glass-noise")).toBe("")
  })

  it("ignores an invalid glass transparency with a dev warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setStyle("glass"))
    act(() => result.current.setAxis("glassTransparency", "extreme" as never))
    expect(warn).toHaveBeenCalled()
    expect(root.getAttribute("data-glass-transparency")).toBe("medium")
    warn.mockRestore()
  })

  it("applies a style's defaults to axes the user never set", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setStyle("glass"))
    expect(result.current.backgroundStyle).toBe("gradient")
    expect(result.current.outerGlow).toBe("none")
    act(() => result.current.setStyle("flat"))
    expect(result.current.backgroundStyle).toBe("solid")
    expect(result.current.elevation).toBe("flat")
    expect(root.getAttribute("data-elevation")).toBe("flat")
  })

  it("clears a user value on an axis the picked style sets", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setBackgroundStyle("solid"))
    act(() => result.current.setStyle("glass"))
    expect(result.current.backgroundStyle).toBe("gradient")
  })

  it("lets a user value set after the pick beat the style's default", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setStyle("glass"))
    act(() => result.current.setBackgroundStyle("solid"))
    expect(result.current.backgroundStyle).toBe("solid")
  })

  it("writes data-background-intensity='vivid' on mount", () => {
    renderHook(() => useTheme(), { wrapper: wrap })
    expect(root.getAttribute("data-background-intensity")).toBe("vivid")
  })

  it("setBackgroundIntensity updates attribute and persists", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setBackgroundIntensity("vivid"))
    expect(root.getAttribute("data-background-intensity")).toBe("vivid")
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
    expect(root.getAttribute("data-background-intensity")).toBe("subtle")
  })

  it("writes data-gradient-pattern='blobs' on mount", () => {
    renderHook(() => useTheme(), { wrapper: wrap })
    expect(root.getAttribute("data-gradient-pattern")).toBe("blobs")
  })

  it("setGradientPattern updates attribute and persists", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setGradientPattern("aurora"))
    expect(root.getAttribute("data-gradient-pattern")).toBe("aurora")
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
    expect(root.getAttribute("data-gradient-pattern")).toBe("mesh")
  })

  it("boots a stored removed preset on quiet, keeping its mode", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    localStorage.setItem("theme-preset", "scifi")
    localStorage.setItem("mode", "dark")

    const { result } = renderHook(() => useTheme(), { wrapper: wrap })

    expect(result.current.style).toBe("quiet")
    expect(result.current.resolvedMode).toBe("dark")
    expect(root.getAttribute("data-style")).toBe("quiet")
    expect(root.getAttribute("data-mode")).toBe("dark")
    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
  })

  it("leaves a stored mode untouched at boot", () => {
    localStorage.setItem("theme-style", "glass")
    localStorage.setItem("mode", "light")

    const { result } = renderHook(() => useTheme(), { wrapper: wrap })

    expect(result.current.mode).toBe("light")
    expect(result.current.resolvedMode).toBe("light")
    expect(localStorage.getItem("mode")).toBe("light")
  })

  it("setMode('light') keeps the active style", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setStyle("glass"))
    act(() => result.current.setMode("light"))
    expect(result.current.style).toBe("glass")
    expect(result.current.resolvedMode).toBe("light")
    expect(localStorage.getItem("theme-style")).toBe("glass")
  })

  it("setStyle leaves the mode alone", () => {
    const { result } = renderHook(() => useTheme(), { wrapper: wrap })
    act(() => result.current.setMode("light"))
    expect(result.current.resolvedMode).toBe("light")
    act(() => result.current.setStyle("glass"))
    expect(result.current.style).toBe("glass")
    expect(result.current.resolvedMode).toBe("light")
  })
})

describe("shell style", () => {
  beforeEach(() => {
    localStorage.removeItem("theme-shell-style")
    document.documentElement.removeAttribute("data-shell-style")
  })

  it("stamps no shell style on the document element", () => {
    renderHook(() => useTheme(), { wrapper: wrap })
    expect(document.documentElement.hasAttribute("data-shell-style")).toBe(
      false,
    )
  })

  it("leaves a stored shell style to the layout store", () => {
    localStorage.setItem("theme-shell-style", "island")
    renderHook(() => useTheme(), { wrapper: wrap })
    expect(document.documentElement.hasAttribute("data-shell-style")).toBe(
      false,
    )
    expect(localStorage.getItem("theme-shell-style")).toBe("island")
  })

  it("keeps the stored shell style when a synced payload loads", async () => {
    localStorage.setItem("theme-shell-style", "island")
    const persistence = {
      load: vi.fn().mockResolvedValue({ accentColor: "teal" }),
      save: vi.fn().mockResolvedValue(undefined),
    }
    function withSync({ children }: { children: ReactNode }) {
      return <ThemeProvider persistence={persistence}>{children}</ThemeProvider>
    }
    const { result } = renderHook(() => useTheme(), { wrapper: withSync })
    await waitFor(() => expect(result.current.accentColor).toBe("teal"))
    expect(localStorage.getItem("theme-shell-style")).toBe("island")
  })
})
