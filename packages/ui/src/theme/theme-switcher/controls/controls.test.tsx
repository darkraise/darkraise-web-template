import type * as React from "react"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { UiLabelsProvider } from "@labels"
import { resolveAccentScale } from "@theme/engine/generateTokens"
import { ThemeProvider } from "@theme/theme-provider"
import { ChoiceControl } from "./ChoiceControl"
import { OrdinalControl } from "./OrdinalControl"
import { SwatchControl } from "./SwatchControl"
import { SwitchControl } from "./SwitchControl"

// A complete Storage owned by this suite: the provider persists every click,
// and sibling suites stub their own storage.
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

function renderControl(ui: React.ReactNode) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

const html = document.documentElement

beforeEach(() => {
  vi.stubGlobal("localStorage", memoryStorage())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("SwatchControl", () => {
  it("renders one accent swatch per accent with no value tag", () => {
    const { container } = renderControl(<SwatchControl axis="accentColor" />)
    const swatches = container.querySelectorAll(".dr-theme-switcher-swatch")
    expect(swatches).toHaveLength(19)
    for (const swatch of swatches)
      expect(swatch).not.toHaveAttribute("data-value")
    expect(screen.getByTitle("blue")).toHaveAttribute("data-active", "true")
  })

  function painted(hsl: string): string {
    const probe = document.createElement("i")
    probe.style.backgroundColor = `hsl(${hsl})`
    return probe.style.backgroundColor
  }

  it("paints the neutral accent near-black in light", () => {
    localStorage.setItem("mode", "light")
    renderControl(<SwatchControl axis="accentColor" />)
    expect(
      screen.getByTitle("Neutral (near-black)").style.backgroundColor,
    ).toBe(painted(resolveAccentScale("neutral", "zinc")[900]))
  })

  it("paints the neutral accent near-white in dark", () => {
    localStorage.setItem("mode", "dark")
    renderControl(<SwatchControl axis="accentColor" />)
    expect(
      screen.getByTitle("Neutral (near-white)").style.backgroundColor,
    ).toBe(painted(resolveAccentScale("neutral", "zinc")[50]))
  })

  it("sets the accent on click", () => {
    renderControl(<SwatchControl axis="accentColor" />)
    fireEvent.click(screen.getByTitle("rose"))
    expect(html.getAttribute("data-accent")).toBe("rose")
    expect(screen.getByTitle("rose")).toHaveAttribute("data-active", "true")
  })

  it("marks only the selected swatch as pressed", () => {
    renderControl(<SwatchControl axis="accentColor" />)
    expect(screen.getByTitle("blue")).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByTitle("rose")).toHaveAttribute("aria-pressed", "false")
    fireEvent.click(screen.getByTitle("rose"))
    expect(screen.getByTitle("rose")).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByTitle("blue")).toHaveAttribute("aria-pressed", "false")
  })

  it("renders the neutral surfaces untagged and sets one on click", () => {
    const { container } = renderControl(<SwatchControl axis="surfaceColor" />)
    const swatches = container.querySelectorAll(".dr-theme-switcher-swatch")
    expect(swatches).toHaveLength(12)
    for (const swatch of swatches) {
      expect(swatch).not.toHaveAttribute("data-value")
    }
    fireEvent.click(screen.getByTitle("zinc"))
    expect(html.getAttribute("data-surface")).toBe("zinc")
  })

  it("renders nothing for an axis without swatches", () => {
    const { container } = renderControl(<SwatchControl axis="density" />)
    expect(container.querySelector(".dr-theme-switcher-swatch-grid")).toBeNull()
  })
})

describe("ChoiceControl", () => {
  it("renders mode with its icons and the mode labels", () => {
    renderControl(<ChoiceControl axis="mode" />)
    const group = screen.getByRole("radiogroup", { name: "Mode" })
    expect(group).toHaveAttribute("data-cols", "3")
    for (const name of ["Light", "Dark", "System"]) {
      expect(
        within(group).getByRole("radio", { name }).querySelector("svg"),
      ).not.toBeNull()
    }
    fireEvent.click(within(group).getByRole("radio", { name: "Dark" }))
    expect(html.getAttribute("data-mode")).toBe("dark")
  })

  it("keeps the selection when the active item is clicked again", () => {
    renderControl(<ChoiceControl axis="mode" />)
    const system = screen.getByRole("radio", { name: "System" })
    expect(system).toHaveAttribute("aria-checked", "true")
    fireEvent.click(system)
    expect(system).toHaveAttribute("aria-checked", "true")
  })

  it("labels the styles from the labels", () => {
    renderControl(<ChoiceControl axis="style" />)
    const group = screen.getByRole("radiogroup", { name: "Style" })
    expect(group).toHaveAttribute("data-cols", "4")
    expect(
      within(group)
        .getAllByRole("radio")
        .map((radio) => radio.textContent),
    ).toEqual(["Flat", "Quiet", "Tactile", "Glass"])
    fireEvent.click(within(group).getByRole("radio", { name: "Glass" }))
    expect(html.getAttribute("data-style")).toBe("glass")
  })

  it("wraps six or more styles like five", () => {
    render(
      <ThemeProvider
        config={{
          defaults: {},
          switcher: { enabled: true },
          styles: { ink: { label: "Ink" }, dusk: { label: "Dusk" } },
        }}
      >
        <ChoiceControl axis="style" />
      </ThemeProvider>,
    )
    const group = screen.getByRole("radiogroup", { name: "Style" })
    expect(within(group).getAllByRole("radio")).toHaveLength(6)
    expect(group).toHaveAttribute("data-cols", "5")
  })

  it("offers the four fonts and sets one", () => {
    renderControl(<ChoiceControl axis="font" />)
    const group = screen.getByRole("radiogroup", { name: "Font" })
    expect(group).toHaveAttribute("data-cols", "3")
    expect(
      within(group)
        .getAllByRole("radio")
        .map((radio) => radio.textContent),
    ).toEqual(["Inter", "Geist", "IBM Plex Sans", "Newsreader"])
    fireEvent.click(within(group).getByRole("radio", { name: "Geist" }))
    expect(html.getAttribute("data-font")).toBe("geist")
  })

  it("draws the background style icons", () => {
    renderControl(<ChoiceControl axis="backgroundStyle" />)
    const group = screen.getByRole("radiogroup", { name: "Background" })
    for (const name of ["Solid", "Gradient"]) {
      expect(
        within(group).getByRole("radio", { name }).querySelector("svg"),
      ).not.toBeNull()
    }
  })

  it("sizes the grid to the gradient patterns", () => {
    renderControl(<ChoiceControl axis="gradientPattern" />)
    const group = screen.getByRole("radiogroup", { name: "Gradient Pattern" })
    // Six patterns wrap into rows of three, as five values do.
    expect(group).toHaveAttribute("data-cols", "5")
    fireEvent.click(within(group).getByRole("radio", { name: "aurora" }))
    expect(html.getAttribute("data-gradient-pattern")).toBe("aurora")
  })

  it("labels the sidebar selection looks", () => {
    renderControl(<ChoiceControl axis="sidebarSelection" />)
    const group = screen.getByRole("radiogroup", { name: "Sidebar Selection" })
    expect(
      within(group)
        .getAllByRole("radio")
        .map((radio) => radio.textContent),
    ).toEqual([
      "Auto",
      "Chip",
      "Pill",
      "Tile",
      "Frosted",
      "Tint",
      "Accent",
      "Rule",
      "Key",
      "Tab",
    ])
    // Ten looks wrap to a second row of the same five-cell grid.
    expect(group).toHaveAttribute("data-cols", "5")
  })

  it("takes sidebar selection labels from their own group", () => {
    render(
      <UiLabelsProvider
        value={{
          theme: { sidebarSelections: { pill: "Vạch chỉ báo" } },
          themeOptions: { pill: "viên thuốc" },
        }}
      >
        <ThemeProvider>
          <ChoiceControl axis="sidebarSelection" />
        </ThemeProvider>
      </UiLabelsProvider>,
    )
    expect(
      screen.getByRole("radio", { name: "Vạch chỉ báo" }),
    ).toBeInTheDocument()
  })
})

describe("OrdinalControl", () => {
  it("renders a four-value axis as a named slider", () => {
    renderControl(<OrdinalControl axis="density" />)
    expect(screen.getByRole("slider", { name: "Density" })).toBeInTheDocument()
    expect(screen.getByText("cozy")).toBeInTheDocument()
  })

  it("renders a five-value axis as a named slider", () => {
    renderControl(<OrdinalControl axis="backgroundIntensity" />)
    expect(
      screen.getByRole("slider", { name: "Background Intensity" }),
    ).toBeInTheDocument()
  })

  it("renders the three-value elevation as a toggle group", () => {
    renderControl(<OrdinalControl axis="elevation" />)
    const group = screen.getByRole("radiogroup", { name: "Elevation" })
    expect(
      within(group)
        .getAllByRole("radio")
        .map((radio) => radio.textContent),
    ).toEqual(["flat", "standard", "high"])
    fireEvent.click(within(group).getByRole("radio", { name: "high" }))
    expect(html.getAttribute("data-elevation")).toBe("high")
  })

  it("renders contrast as a toggle group", () => {
    renderControl(<OrdinalControl axis="contrast" />)
    expect(
      screen.getByRole("radiogroup", { name: "Contrast" }),
    ).toBeInTheDocument()
    expect(screen.queryByRole("slider")).not.toBeInTheDocument()
  })
})

describe("SwitchControl", () => {
  it("maps checked and unchecked to on and off", () => {
    renderControl(<SwitchControl axis="tintWithAccent" />)
    const toggle = screen.getByRole("switch", { name: "Tint With Accent" })
    expect(toggle).toHaveAttribute("aria-checked", "false")

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute("aria-checked", "true")
    expect(html.getAttribute("data-tint-with-accent")).toBe("on")

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute("aria-checked", "false")
    expect(html.getAttribute("data-tint-with-accent")).toBe("off")
  })
})
