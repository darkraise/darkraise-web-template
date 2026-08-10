import type * as React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { ThemeProvider } from "@theme/theme-provider"
import { ThemeSettingsPanel } from "./ThemeSettingsPanel"

// Match the matchMedia mocking pattern from ThemeSwitcher.test.tsx.
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

function renderPanel(ui: React.ReactNode) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

describe("ThemeSettingsPanel", () => {
  beforeEach(() => {
    mockMatchMedia()
  })

  it("renders the axis controls without a popover", () => {
    renderPanel(<ThemeSettingsPanel />)
    expect(screen.getByText("Mode")).toBeInTheDocument()
    expect(screen.getByText("Preset")).toBeInTheDocument()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("applies a custom className to its root", () => {
    const { container } = renderPanel(<ThemeSettingsPanel className="custom" />)
    expect(container.querySelector(".custom")).toBeInTheDocument()
  })

  it("defaults to the compact layout", () => {
    const { container } = renderPanel(<ThemeSettingsPanel />)
    expect(
      container.querySelector('[data-layout="compact"]'),
    ).toBeInTheDocument()
  })

  it("groups axes under headings in the page layout", () => {
    renderPanel(<ThemeSettingsPanel layout="page" />)
    expect(screen.getByRole("heading", { name: "Theme" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Color" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Layout" })).toBeInTheDocument()
  })

  it("renders no headings in the compact layout", () => {
    renderPanel(<ThemeSettingsPanel layout="compact" />)
    expect(
      screen.queryByRole("heading", { name: "Theme" }),
    ).not.toBeInTheDocument()
  })

  it("still renders every control in the page layout", () => {
    renderPanel(<ThemeSettingsPanel layout="page" />)
    expect(screen.getByText("Mode")).toBeInTheDocument()
    expect(screen.getByText("Preset")).toBeInTheDocument()
    expect(screen.getByText("Radius")).toBeInTheDocument()
  })

  it("omits a group heading entirely once its last axis is hidden", () => {
    renderPanel(<ThemeSettingsPanel layout="page" />)
    // Default preset — both Depth axes are visible, so the heading shows.
    expect(screen.getByRole("heading", { name: "Depth" })).toBeInTheDocument()

    // Neon declares hiddenCommonAxes: ["elevation", "buttonElevation"],
    // which are the only two axes in the "depth" group — so switching to
    // it empties that group completely rather than just thinning it.
    fireEvent.click(screen.getByRole("radio", { name: /^neon$/i }))

    expect(
      screen.queryByRole("heading", { name: "Depth" }),
    ).not.toBeInTheDocument()
    // Sibling groups keep their headings — this isn't the whole panel
    // vanishing, just the one group that lost every section.
    expect(screen.getByRole("heading", { name: "Theme" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Layout" })).toBeInTheDocument()
  })
})
