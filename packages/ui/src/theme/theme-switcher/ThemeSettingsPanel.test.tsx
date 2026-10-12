import type * as React from "react"
import { fireEvent, render, screen, within } from "@testing-library/react"
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
  "Preset",
  "Font",
  "Heading Font",
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
    expect(screen.getByTitle("Neutral (near-black)")).toBeInTheDocument()
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

  it("shows Signal Color only while a signal colour is set", () => {
    const { container, unmount } = renderPanel(
      <ThemeSettingsPanel layout="page" />,
    )
    expect(sectionLabels(container)).not.toContain("Signal Color")
    unmount()

    localStorage.setItem("theme-signal-color", "lime")
    const shown = renderPanel(<ThemeSettingsPanel layout="page" />)
    expect(sectionLabels(shown.container)).toContain("Signal Color")
    fireEvent.click(screen.getByTitle("none"))
    expect(sectionLabels(shown.container)).not.toContain("Signal Color")
    expect(localStorage.getItem("theme-signal-color")).toBe("none")
  })

  it.each<[string, Partial<ThemeConfig>, Record<string, string>, boolean]>([
    ["a style that has presets", {}, {}, true],
    [
      "a style that has none",
      { styles: { ink: { label: "Ink" } } },
      { "theme-style": "ink" },
      false,
    ],
    [
      "a style whose presets are all filtered out",
      { switcher: { enabled: true, presets: [] } },
      {},
      false,
    ],
    [
      "a filtered-out preset that is active",
      { switcher: { enabled: true, presets: [] } },
      { "theme-preset": "paper-ink" },
      true,
    ],
    [
      "switcher.axes.preset set to false",
      { switcher: { enabled: true, axes: { preset: false } } },
      {},
      false,
    ],
  ])("decides the preset control for %s", (_title, config, stored, shown) => {
    for (const [key, value] of Object.entries(stored)) {
      localStorage.setItem(key, value)
    }
    const { container } = renderPanel(<ThemeSettingsPanel layout="page" />, {
      ...themeConfig,
      ...config,
    })
    expect(sectionLabels(container).includes("Preset")).toBe(shown)
  })

  it("resets the preset to base when another style is picked", () => {
    renderPanel(<ThemeSettingsPanel layout="page" />)
    const html = document.documentElement
    fireEvent.click(screen.getByRole("radio", { name: "Linen & Teal" }))
    expect(html.getAttribute("data-preset")).toBe("linen-teal")

    fireEvent.click(screen.getByRole("radio", { name: "Flat" }))
    expect(html.getAttribute("data-style")).toBe("flat")
    expect(html.getAttribute("data-preset")).toBe("base")
    expect(localStorage.getItem("theme-preset")).toBe("base")
    const group = screen.getByRole("radiogroup", { name: "Preset" })
    expect(
      within(group)
        .getAllByRole("radio")
        .map((radio) => radio.textContent),
    ).toEqual(["Base", "Pastel Soft-Flat", "Forest & Lime"])
    expect(within(group).getByRole("radio", { name: "Base" })).toBeChecked()
  })

  it("shows Signal Color once a preset sets a signal colour", () => {
    localStorage.setItem("theme-style", "tactile")
    const { container } = renderPanel(<ThemeSettingsPanel layout="page" />)
    expect(sectionLabels(container)).not.toContain("Signal Color")
    fireEvent.click(screen.getByRole("radio", { name: "Braun Panel" }))
    expect(sectionLabels(container)).toContain("Signal Color")
    expect(document.documentElement.getAttribute("data-signal-color")).toBe(
      "yellow",
    )
  })

  it("renders the preset, then the glass axes, right after the style control under glass", () => {
    localStorage.setItem("theme-style", "glass")
    const { container } = renderPanel(<ThemeSettingsPanel layout="page" />)
    const labels = sectionLabels(container)
    const at = labels.indexOf("Style")
    expect(labels.slice(at, at + 5)).toEqual([
      "Style",
      "Preset",
      "Opacity",
      "Backdrop Blur",
      "Font",
    ])
  })

  it("renders the glass axes under a style that extends glass", () => {
    localStorage.setItem("theme-style", "ink")
    const { container } = renderPanel(<ThemeSettingsPanel layout="page" />, {
      ...themeConfig,
      styles: { ink: { label: "Ink", extends: "glass" } },
    })
    expect(sectionLabels(container)).toEqual(
      expect.arrayContaining(["Opacity", "Backdrop Blur"]),
    )
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
