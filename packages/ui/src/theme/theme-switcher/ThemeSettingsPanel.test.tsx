import type * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { ThemeProvider } from "@theme/theme-provider"
import { themeConfig, type ThemeConfig } from "@theme/themeConfig"
import { ThemeSettingsPanel } from "./ThemeSettingsPanel"

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

function renderPanel(ui: React.ReactNode, config?: ThemeConfig) {
  return render(<ThemeProvider config={config}>{ui}</ThemeProvider>)
}

function withSwitcher(switcher: Partial<ThemeConfig["switcher"]>): ThemeConfig {
  return { ...themeConfig, switcher: { ...themeConfig.switcher, ...switcher } }
}

function sectionLabels(container: HTMLElement): string[] {
  return [
    ...container.querySelectorAll(".dr-theme-switcher-section-label"),
  ].map((label) => label.textContent ?? "")
}

const BRAND = [
  "Mode",
  "Accent Color",
  "Surface Color",
  "Tint With Accent",
  "Style",
  "Font",
  "Radius",
  "Density",
  "Font Size",
]

// Gradient Pattern is absent: the default background is solid.
const ADVANCED = [
  "Contrast",
  "Dark Accent Chroma",
  "Elevation",
  "Outer Glow",
  "Inner Glow",
  "Background",
  "Background Intensity",
  "Sidebar Indicator",
  "Sidebar Selection",
]

describe("ThemeSettingsPanel", () => {
  beforeEach(() => {
    // The provider persists every choice, so a test that picks a style would
    // otherwise leave every later test running under it.
    vi.stubGlobal("localStorage", memoryStorage())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("renders the axis controls without a popover", () => {
    renderPanel(<ThemeSettingsPanel />)
    expect(screen.getByText("Mode")).toBeInTheDocument()
    expect(screen.getByText("Style")).toBeInTheDocument()
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

  it("renders the Brand controls in registry order", () => {
    const { container } = renderPanel(<ThemeSettingsPanel />)
    expect(sectionLabels(container)).toEqual(BRAND)
  })

  it("keeps Advanced collapsed in the compact layout until it is opened", () => {
    const { container } = renderPanel(<ThemeSettingsPanel />)
    const trigger = screen.getByRole("button", { name: "Advanced" })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByText("Contrast")).not.toBeInTheDocument()

    fireEvent.click(trigger)

    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("region", { name: "Advanced" })).toBeInTheDocument()
    expect(sectionLabels(container)).toEqual([...BRAND, ...ADVANCED])
  })

  it("renders no headings in the compact layout", () => {
    renderPanel(<ThemeSettingsPanel layout="compact" />)
    expect(screen.queryByRole("heading")).not.toBeInTheDocument()
  })

  it("renders Brand and Advanced as headed sections in the page layout", () => {
    const { container } = renderPanel(<ThemeSettingsPanel layout="page" />)
    expect(
      screen.getAllByRole("heading").map((heading) => heading.textContent),
    ).toEqual(["Brand", "Advanced"])
    expect(
      screen.queryByRole("button", { name: "Advanced" }),
    ).not.toBeInTheDocument()
    expect(sectionLabels(container)).toEqual([...BRAND, ...ADVANCED])
  })

  it("drops the old group headings", () => {
    renderPanel(<ThemeSettingsPanel layout="page" />)
    for (const name of ["Theme", "Color", "Layout", "Depth"]) {
      expect(
        screen.queryByRole("heading", { name }),
        name,
      ).not.toBeInTheDocument()
    }
  })

  it.each(["compact", "page"] as const)(
    "removes Advanced from the %s layout when switcher.advanced is false",
    (layout) => {
      const { container } = renderPanel(
        <ThemeSettingsPanel layout={layout} />,
        withSwitcher({ advanced: false }),
      )
      expect(sectionLabels(container)).toEqual(BRAND)
      expect(
        screen.queryByRole("button", { name: "Advanced" }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole("heading", { name: "Advanced" }),
      ).not.toBeInTheDocument()
    },
  )

  it("hides one control when switcher.axes sets it to false", () => {
    const { container } = renderPanel(
      <ThemeSettingsPanel layout="page" />,
      withSwitcher({ axes: { radius: false } }),
    )
    expect(sectionLabels(container)).toEqual([
      ...BRAND.filter((label) => label !== "Radius"),
      ...ADVANCED,
    ])
  })

  it("omits the Advanced heading once every Advanced axis is hidden", () => {
    renderPanel(
      <ThemeSettingsPanel layout="page" />,
      withSwitcher({
        axes: {
          contrast: false,
          darkAccentChroma: false,
          elevation: false,
          outerGlow: false,
          innerGlow: false,
          backgroundStyle: false,
          backgroundIntensity: false,
          gradientPattern: false,
          sidebarActiveBar: false,
          sidebarSelection: false,
        },
      }),
    )
    expect(
      screen.getAllByRole("heading").map((heading) => heading.textContent),
    ).toEqual(["Brand"])
  })

  it("renders each control kind, with three-value ordinal axes as toggle groups", () => {
    renderPanel(<ThemeSettingsPanel layout="page" />)
    expect(screen.getByTitle("Neutral (near-black)")).toHaveAttribute(
      "data-value",
      "neutral",
    )
    expect(screen.getByRole("radiogroup", { name: "Font" })).toBeInTheDocument()
    expect(screen.getByRole("slider", { name: "Density" })).toBeInTheDocument()
    expect(screen.getByRole("slider", { name: "Radius" })).toBeInTheDocument()
    for (const name of ["Elevation", "Contrast", "Dark Accent Chroma"]) {
      expect(screen.getByRole("radiogroup", { name }), name).toBeInTheDocument()
    }
    expect(
      screen.getByRole("switch", { name: "Tint With Accent" }),
    ).toBeInTheDocument()
  })

  it("shows the gradient pattern only under the gradient background", () => {
    const { container } = renderPanel(<ThemeSettingsPanel layout="page" />)
    expect(sectionLabels(container)).not.toContain("Gradient Pattern")
    fireEvent.click(screen.getByRole("radio", { name: "Gradient" }))
    expect(sectionLabels(container)).toContain("Gradient Pattern")
  })

  it("hides Tint With Accent under the neutral accent", () => {
    renderPanel(<ThemeSettingsPanel layout="page" />)
    fireEvent.click(screen.getByTitle("Neutral (near-black)"))
    expect(
      screen.queryByRole("switch", { name: "Tint With Accent" }),
    ).not.toBeInTheDocument()
  })

  it("renders the glass axes right after the style control under glass", () => {
    localStorage.setItem("theme-preset", "glass")
    const { container } = renderPanel(<ThemeSettingsPanel layout="page" />)
    const labels = sectionLabels(container)
    const at = labels.indexOf("Style")
    expect(labels.slice(at, at + 4)).toEqual([
      "Style",
      "Opacity",
      "Backdrop Blur",
      "Font",
    ])
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
      "Button Elevation",
      "Shell Style",
    ]) {
      expect(screen.queryByText(removed), removed).not.toBeInTheDocument()
    }
  })
})
