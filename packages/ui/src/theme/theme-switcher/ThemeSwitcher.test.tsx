// packages/ui/src/theme/theme-switcher/ThemeSwitcher.test.tsx
import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ThemeProvider } from "../theme-provider/ThemeProvider"
import { ThemeSwitcher } from "./ThemeSwitcher"

// Match the storage + matchMedia mocking pattern from useTheme.test.tsx.
const storageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      Reflect.deleteProperty(store, key)
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  }
})()

function mockMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe("ThemeSwitcher preset section", () => {
  beforeEach(() => {
    storageMock.clear()
    vi.stubGlobal("localStorage", storageMock)
    mockMatchMedia()
    document.documentElement.removeAttribute("data-preset")
    document.documentElement.removeAttribute("data-glassmorphism-opacity")
    document.documentElement.removeAttribute("data-glassmorphism-blur")
    document.documentElement.style.cssText = ""
  })

  function openSwitcher() {
    fireEvent.click(screen.getByRole("button", { name: /customize theme/i }))
  }

  it("renders one toggle per registered preset", () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    )
    openSwitcher()
    expect(screen.getByRole("radio", { name: /default/i })).toBeInTheDocument()
    expect(
      screen.getByRole("radio", { name: /glassmorphism/i }),
    ).toBeInTheDocument()
  })

  it("does NOT render glass axis toggles when default preset is active", () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    )
    openSwitcher()
    expect(screen.queryByText("Opacity")).not.toBeInTheDocument()
    expect(screen.queryByText("Backdrop Blur")).not.toBeInTheDocument()
  })

  it("renders glass axis toggles when glass preset active", () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    )
    openSwitcher()
    fireEvent.click(screen.getByRole("radio", { name: /glassmorphism/i }))
    expect(screen.getByText("Opacity")).toBeInTheDocument()
    expect(screen.getByText("Backdrop Blur")).toBeInTheDocument()
  })

  it("toggling glass-opacity updates the data attribute", () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    )
    openSwitcher()
    fireEvent.click(screen.getByRole("radio", { name: /glassmorphism/i }))
    fireEvent.click(screen.getByRole("radio", { name: /^strong$/i }))
    expect(
      document.documentElement.getAttribute("data-glassmorphism-opacity"),
    ).toBe("strong")
  })

  it("does NOT render Background Intensity when backgroundStyle is solid", () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    )
    openSwitcher()
    expect(screen.queryByText("Background Intensity")).not.toBeInTheDocument()
  })

  it("renders Background Intensity when backgroundStyle is gradient", () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    )
    openSwitcher()
    fireEvent.click(screen.getByRole("radio", { name: /gradient/i }))
    expect(screen.getByText("Background Intensity")).toBeInTheDocument()
    // Should default to balanced.
    expect(
      document.documentElement.getAttribute("data-background-intensity"),
    ).toBe("balanced")
  })

  it("clicking a Background Intensity value updates the data attribute", () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    )
    openSwitcher()
    fireEvent.click(screen.getByRole("radio", { name: /gradient/i }))
    fireEvent.click(screen.getByRole("radio", { name: /^vivid$/i }))
    expect(
      document.documentElement.getAttribute("data-background-intensity"),
    ).toBe("vivid")
  })
})
