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
    document.documentElement.removeAttribute("data-glass-opacity")
    document.documentElement.removeAttribute("data-glass-blur")
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
    expect(screen.getByRole("radio", { name: /^glass$/i })).toBeInTheDocument()
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
    fireEvent.click(screen.getByRole("radio", { name: /^glass$/i }))
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
    fireEvent.click(screen.getByRole("radio", { name: /^glass$/i }))
    fireEvent.click(screen.getByRole("radio", { name: /^strong$/i }))
    expect(document.documentElement.getAttribute("data-glass-opacity")).toBe(
      "strong",
    )
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

  it("does NOT render Gradient Pattern when backgroundStyle is solid", () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    )
    openSwitcher()
    expect(screen.queryByText("Gradient Pattern")).not.toBeInTheDocument()
  })

  it("renders Gradient Pattern when backgroundStyle is gradient", () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    )
    openSwitcher()
    fireEvent.click(screen.getByRole("radio", { name: /gradient/i }))
    expect(screen.getByText("Gradient Pattern")).toBeInTheDocument()
    expect(document.documentElement.getAttribute("data-gradient-pattern")).toBe(
      "blobs",
    )
  })

  it("clicking a Gradient Pattern value updates the data attribute", () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    )
    openSwitcher()
    fireEvent.click(screen.getByRole("radio", { name: /gradient/i }))
    fireEvent.click(screen.getByRole("radio", { name: /^aurora$/i }))
    expect(document.documentElement.getAttribute("data-gradient-pattern")).toBe(
      "aurora",
    )
  })

  it("hides the Mode section when active preset locks to a single mode (neon = dark only)", () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    )
    openSwitcher()
    // Default preset on mount — Mode section is visible.
    expect(screen.getByText("Mode")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("radio", { name: /^neon$/i }))
    // After switching to Neon (supportedModes: ["dark"]), the Mode label
    // and the three mode radios are removed from the DOM entirely.
    expect(screen.queryByText("Mode")).not.toBeInTheDocument()
    expect(screen.queryByRole("radio", { name: /^light$/i })).toBeNull()
    expect(screen.queryByRole("radio", { name: /^system$/i })).toBeNull()
    // ThemeProvider has already auto-switched mode to dark.
    expect(document.documentElement.getAttribute("data-mode")).toBe("dark")
  })

  it("keeps the Mode section visible when active preset has no supportedModes (default, glass)", () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    )
    openSwitcher()
    expect(screen.getByText("Mode")).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /^light$/i })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /^dark$/i })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /^system$/i })).toBeInTheDocument()
  })
})
