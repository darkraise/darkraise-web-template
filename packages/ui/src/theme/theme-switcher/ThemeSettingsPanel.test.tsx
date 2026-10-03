import type * as React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
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

// memoryStorage is a complete Storage, installed fresh for every test here.
//
// Reaching for whatever localStorage happens to be installed does not work:
// sibling theme suites stub their own, vi.stubGlobal outlives the file that
// called it, and not every stub implements the whole interface. Owning one
// makes this suite independent of what ran before it.
function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, String(v)),
    removeItem: (k) => void data.delete(k),
    clear: () => data.clear(),
    key: (i) => Array.from(data.keys())[i] ?? null,
    get length() {
      return data.size
    },
  }
}

describe("ThemeSettingsPanel", () => {
  beforeEach(() => {
    mockMatchMedia()
    // The provider persists the chosen preset, so a test that clicks a preset
    // radio leaves every later test running under it. Glass hides the surface
    // intensity axis, which is enough to make an unrelated assertion disappear.
    vi.stubGlobal("localStorage", memoryStorage())
  })

  afterEach(() => {
    // Not left installed: this suite's storage must not become the next
    // file's inherited surprise, which is the bug it exists to avoid.
    vi.unstubAllGlobals()
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
    const thinnedConfig: ThemeConfig = {
      ...themeConfig,
      switcher: {
        ...themeConfig.switcher,
        axes: { ...themeConfig.switcher.axes, elevation: false },
      },
    }
    render(
      <ThemeProvider config={thinnedConfig}>
        <ThemeSettingsPanel layout="page" />
      </ThemeProvider>,
    )

    expect(screen.getByRole("heading", { name: "Depth" })).toBeInTheDocument()
    expect(screen.queryByText("Elevation")).not.toBeInTheDocument()
    expect(screen.getByText("Outer Glow")).toBeInTheDocument()
  })

  it("omits a group heading entirely once every axis in it is hidden", () => {
    // Disable every "depth" axis at the config level (elevation, contrast
    // and the two glow axes) rather than via a preset's hiddenCommonAxes, so
    // this test doesn't depend on which axes a given preset happens to
    // reinterpret.
    const depthHiddenConfig: ThemeConfig = {
      ...themeConfig,
      switcher: {
        ...themeConfig.switcher,
        axes: {
          ...themeConfig.switcher.axes,
          elevation: false,
          contrast: false,
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

  it("renders the colour engine controls in place of the old intensity ones", () => {
    renderPanel(<ThemeSettingsPanel layout="page" />)
    expect(screen.getByText("Contrast")).toBeInTheDocument()
    expect(screen.getByText("Dark Accent Chroma")).toBeInTheDocument()
    expect(screen.getByText("Tint With Accent")).toBeInTheDocument()
    for (const removed of [
      "Accent Intensity",
      "Surface Intensity",
      "Border Intensity",
      "Control Depth",
    ]) {
      expect(screen.queryByText(removed), removed).not.toBeInTheDocument()
    }
  })

  it("tags the neutral accent swatch so dark mode can outline it", () => {
    renderPanel(<ThemeSettingsPanel layout="page" />)
    expect(screen.getByTitle("Neutral (near-black)")).toHaveAttribute(
      "data-value",
      "neutral",
    )
  })

  it("names its axis sliders so they are reachable by role and name", () => {
    renderPanel(<ThemeSettingsPanel layout="page" />)
    // A four-value axis renders as a Slider carrying the axis name.
    expect(screen.getByRole("slider", { name: "Density" })).toBeInTheDocument()
    expect(screen.getByRole("slider", { name: "Radius" })).toBeInTheDocument()
  })
})
