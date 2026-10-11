import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ThemeProvider } from "./ThemeProvider"
import { useTheme } from "@theme/useTheme"
import { themeConfig, type ThemeConfig } from "@theme/themeConfig"

const root = document.documentElement

const config: ThemeConfig = {
  ...themeConfig,
  styles: {
    "night-rail": {
      label: "Night rail",
      extends: "quiet",
      signatures: { railTone: "inverse", barTone: "inverse" },
    },
  },
  presets: {
    "brand-rail": {
      label: "Brand rail",
      style: "night-rail",
      signatures: { barTone: "accent" },
    },
  },
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider config={config}>{children}</ThemeProvider>
)

beforeEach(() => {
  localStorage.clear()
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
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("ThemeProvider chrome tone", () => {
  it("paints the rail and the bar in the tones the style and preset resolve", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    const token = (name: string) => root.style.getPropertyValue(name)
    const pageRail = token("--surface-sidebar")
    const pageBar = token("--surface-header")
    expect(pageRail).toBe(token("--background"))
    expect(token("--bar-foreground")).toBe("")

    act(() => result.current.setStyle("night-rail"))
    expect(root.getAttribute("data-rail-tone")).toBe("inverse")
    expect(root.getAttribute("data-bar-tone")).toBe("inverse")
    const inverse = token("--surface-sidebar")
    expect(inverse).not.toBe(pageRail)
    expect(token("--surface-header")).toBe(inverse)
    expect(token("--bar-foreground")).toBe(token("--sidebar-foreground"))

    act(() => result.current.setPreset("brand-rail"))
    expect(root.getAttribute("data-rail-tone")).toBe("inverse")
    expect(root.getAttribute("data-bar-tone")).toBe("accent")
    expect(token("--surface-sidebar")).toBe(inverse)
    expect(token("--surface-header")).not.toBe(inverse)
    expect(token("--bar-foreground-hover")).toBe("0 0% 100%")

    act(() => result.current.setStyle("quiet"))
    expect(token("--surface-sidebar")).toBe(pageRail)
    expect(token("--surface-header")).toBe(pageBar)
    expect(token("--bar-foreground")).toBe("")
  })
})
