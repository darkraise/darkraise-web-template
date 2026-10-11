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
    "fine-rule": { label: "Fine rule", extends: "quiet", hairlines: "alpha" },
    "fine-rule-flat": { label: "Fine rule flat", extends: "fine-rule" },
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

describe("ThemeProvider hairlines", () => {
  it("paints the style's hairline mode, inherited along extends", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    const border = () => root.style.getPropertyValue("--border")
    expect(border()).not.toContain("/")

    act(() => result.current.setStyle("fine-rule"))
    expect(border()).toMatch(/^\S+ \S+% \S+% \/ [\d.]+$/)

    act(() => result.current.setStyle("fine-rule-flat"))
    expect(border()).toContain("/")

    act(() => result.current.setStyle("quiet"))
    expect(border()).not.toContain("/")
  })
})
