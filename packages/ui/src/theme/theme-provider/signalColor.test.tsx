import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ThemeProvider } from "./ThemeProvider"
import { useTheme } from "@theme/useTheme"
import { cacheInputKeys } from "@theme/axes/tokenCache"

const root = document.documentElement

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
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

describe("ThemeProvider signal colour", () => {
  it("paints the signal tokens from the signal colour", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    const token = (name: string) => root.style.getPropertyValue(name)
    expect(token("--signal-fill")).toBe(token("--primary-fill"))
    expect(root.getAttribute("data-signal-color")).toBe("none")

    act(() => result.current.setSignalColor("lime"))
    expect(root.getAttribute("data-signal-color")).toBe("lime")
    expect(token("--signal-fill")).not.toBe(token("--primary-fill"))
    expect(localStorage.getItem("theme-signal-color")).toBe("lime")
  })

  it("keys the token cache on the signal colour", () => {
    expect(cacheInputKeys()).toContain("theme-signal-color")
  })
})
