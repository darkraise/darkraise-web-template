import type * as React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { ThemeProvider } from "@theme/theme-provider"
import { themeConfig, type ThemeConfig } from "@theme/themeConfig"
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

  it("thins a group without hiding its heading when only some axes are hidden", () => {
    renderPanel(<ThemeSettingsPanel layout="page" />)
    // Default preset — every Depth axis is visible, so the heading shows.
    expect(screen.getByRole("heading", { name: "Depth" })).toBeInTheDocument()

    // Sci-fi hides elevation, buttonElevation and surfaceIntensity, but drives
    // its glow from the shared axes rather than hiding them — so the Depth
    // group thins to the two glow controls and keeps its heading.
    fireEvent.click(screen.getByRole("radio", { name: /^sci-fi$/i }))

    expect(screen.getByRole("heading", { name: "Depth" })).toBeInTheDocument()
    expect(screen.queryByText("Elevation")).not.toBeInTheDocument()
    expect(screen.queryByText("Button Elevation")).not.toBeInTheDocument()
    expect(screen.queryByText("Surface Intensity")).not.toBeInTheDocument()
    expect(screen.getByText("Outer Glow")).toBeInTheDocument()
    expect(screen.getByText("Inner Glow")).toBeInTheDocument()
  })

  it("omits a group heading entirely once every axis in it is hidden", () => {
    // Disable every "depth" axis at the config level (elevation,
    // buttonElevation, surfaceIntensity, controlDepth and the two glow axes)
    // rather than via a preset's hiddenCommonAxes, so this test doesn't depend
    // on which axes a given preset happens to reinterpret.
    const depthHiddenConfig: ThemeConfig = {
      ...themeConfig,
      switcher: {
        ...themeConfig.switcher,
        axes: {
          ...themeConfig.switcher.axes,
          elevation: false,
          buttonElevation: false,
          surfaceIntensity: false,
          controlDepth: false,
          outerGlow: false,
          innerGlow: false,
        },
      },
    }
    render(
      <ThemeProvider config={depthHiddenConfig}>
        <ThemeSettingsPanel layout="page" />
      </ThemeProvider>,
    )

    expect(
      screen.queryByRole("heading", { name: "Depth" }),
    ).not.toBeInTheDocument()
    // Sibling groups keep their headings — this isn't the whole panel
    // vanishing, just the one group that lost every section.
    expect(screen.getByRole("heading", { name: "Theme" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Layout" })).toBeInTheDocument()
  })

  it("names its axis sliders so they are reachable by role and name", () => {
    renderPanel(<ThemeSettingsPanel layout="page" />)
    // A four-value axis renders as a Slider. Before the Slider fix its
    // aria-label landed on a wrapper span, leaving role="slider" unnamed.
    expect(screen.getByRole("slider", { name: "Density" })).toBeInTheDocument()
    expect(screen.getByRole("slider", { name: "Radius" })).toBeInTheDocument()
  })
})
