import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react"
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

function renderSwitcher() {
  return render(
    <ThemeProvider>
      <ThemeSwitcher />
    </ThemeProvider>,
  )
}

function openSwitcher() {
  fireEvent.click(screen.getByRole("button", { name: /customize theme/i }))
}

function openAdvanced() {
  fireEvent.click(screen.getByRole("button", { name: "Advanced" }))
}

function sectionLabels(): string[] {
  return [
    ...document.querySelectorAll(".dr-theme-switcher-section-label"),
  ].map((label) => label.textContent ?? "")
}

beforeEach(() => {
  storageMock.clear()
  vi.stubGlobal("localStorage", storageMock)
  mockMatchMedia()
  document.documentElement.removeAttribute("data-style")
  document.documentElement.removeAttribute("data-glass-opacity")
  document.documentElement.removeAttribute("data-glass-blur")
  document.documentElement.style.cssText = ""
})

describe("ThemeSwitcher style section", () => {
  it("renders one toggle per style", () => {
    renderSwitcher()
    openSwitcher()
    const group = screen.getByRole("radiogroup", { name: "Style" })
    expect(within(group).getAllByRole("radio")).toHaveLength(4)
  })

  it("does NOT render glass axis toggles when quiet is active", () => {
    renderSwitcher()
    openSwitcher()
    expect(screen.queryByText("Opacity")).not.toBeInTheDocument()
    expect(screen.queryByText("Backdrop Blur")).not.toBeInTheDocument()
  })

  it("renders the glass axes right after the style control", () => {
    renderSwitcher()
    openSwitcher()
    fireEvent.click(screen.getByRole("radio", { name: /^glass$/i }))
    const labels = sectionLabels()
    const at = labels.indexOf("Style")
    expect(labels.slice(at + 1, at + 3)).toEqual(["Opacity", "Backdrop Blur"])
  })

  it("toggling glass-opacity updates the data attribute", () => {
    renderSwitcher()
    openSwitcher()
    fireEvent.click(screen.getByRole("radio", { name: /^glass$/i }))
    fireEvent.click(screen.getByRole("radio", { name: /^strong$/i }))
    expect(document.documentElement.getAttribute("data-glass-opacity")).toBe(
      "strong",
    )
  })
})

describe("ThemeSwitcher brand part", () => {
  it("always shows the Mode section", () => {
    renderSwitcher()
    openSwitcher()
    expect(screen.getByText("Mode")).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /^light$/i })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /^dark$/i })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /^system$/i })).toBeInTheDocument()
  })

  it("renders a Font Size section", () => {
    renderSwitcher()
    openSwitcher()
    expect(screen.getByText("Font Size")).toBeInTheDocument()
  })

  it("switches the font", () => {
    renderSwitcher()
    openSwitcher()
    fireEvent.click(screen.getByRole("radio", { name: "Geist" }))
    expect(document.documentElement.getAttribute("data-font")).toBe("geist")
  })

  it("renders Tint With Accent as a switch", () => {
    renderSwitcher()
    openSwitcher()
    fireEvent.click(screen.getByRole("switch", { name: "Tint With Accent" }))
    expect(
      document.documentElement.getAttribute("data-tint-with-accent"),
    ).toBe("on")
  })
})

describe("ThemeSwitcher Advanced part", () => {
  it("starts collapsed and opens on its trigger", () => {
    renderSwitcher()
    openSwitcher()
    const trigger = screen.getByRole("button", { name: "Advanced" })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByText("Contrast")).not.toBeInTheDocument()

    openAdvanced()

    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText("Contrast")).toBeInTheDocument()
  })

  it("starts collapsed again when the popover reopens", async () => {
    renderSwitcher()
    openSwitcher()
    openAdvanced()
    fireEvent.keyDown(document, { key: "Escape" })
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    )

    openSwitcher()

    expect(screen.getByRole("button", { name: "Advanced" })).toHaveAttribute(
      "aria-expanded",
      "false",
    )
  })

  // The axis absorbed canvasTint, so under `solid` it still drives the canvas
  // saturation cap. Only its blob-scale half is gradient-specific, and that
  // half goes inert rather than hiding the whole control.
  it("renders Background Intensity when backgroundStyle is solid", () => {
    renderSwitcher()
    openSwitcher()
    openAdvanced()
    expect(screen.getByText("Background Intensity")).toBeInTheDocument()
  })

  it("renders Background Intensity when backgroundStyle is gradient", () => {
    renderSwitcher()
    openSwitcher()
    openAdvanced()
    fireEvent.click(screen.getByRole("radio", { name: "Gradient" }))
    expect(screen.getByText("Background Intensity")).toBeInTheDocument()
    expect(
      document.documentElement.getAttribute("data-background-intensity"),
    ).toBe("vivid")
  })

  it("renders four- and five-value ordinal axes as sliders and three-value ones as toggle groups", () => {
    renderSwitcher()
    openSwitcher()
    openAdvanced()
    // Radius, Density, Font Size, Outer Glow, Inner Glow, Background Intensity.
    expect(screen.getAllByRole("slider")).toHaveLength(6)
    for (const name of ["Elevation", "Contrast", "Dark Accent Chroma"]) {
      expect(screen.getByRole("radiogroup", { name }), name).toBeInTheDocument()
    }
    const bgIntensityRow = screen
      .getByText("Background Intensity")
      .closest(".dr-theme-switcher-row") as HTMLElement
    expect(within(bgIntensityRow).getByText("vivid")).toBeInTheDocument()
    expect(screen.getByText("cozy")).toBeInTheDocument()
    expect(screen.getByText("rounded")).toBeInTheDocument()
  })

  it("does NOT render Gradient Pattern when backgroundStyle is solid", () => {
    renderSwitcher()
    openSwitcher()
    openAdvanced()
    expect(screen.queryByText("Gradient Pattern")).not.toBeInTheDocument()
  })

  it("renders Gradient Pattern when backgroundStyle is gradient", () => {
    renderSwitcher()
    openSwitcher()
    openAdvanced()
    fireEvent.click(screen.getByRole("radio", { name: "Gradient" }))
    expect(screen.getByText("Gradient Pattern")).toBeInTheDocument()
    expect(document.documentElement.getAttribute("data-gradient-pattern")).toBe(
      "blobs",
    )
  })

  it("clicking a Gradient Pattern value updates the data attribute", () => {
    renderSwitcher()
    openSwitcher()
    openAdvanced()
    fireEvent.click(screen.getByRole("radio", { name: "Gradient" }))
    fireEvent.click(screen.getByRole("radio", { name: /^aurora$/i }))
    expect(document.documentElement.getAttribute("data-gradient-pattern")).toBe(
      "aurora",
    )
  })
})

describe("ThemeSwitcher popover props", () => {
  it("gives the popover a role and a default accessible name", () => {
    renderSwitcher()
    openSwitcher()
    expect(
      screen.getByRole("dialog", { name: "Theme settings" }),
    ).toBeInTheDocument()
  })

  it("forwards role, aria-label and triggerLabel overrides", () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher
          role="region"
          aria-label="Appearance"
          triggerLabel="Open appearance settings"
        />
      </ThemeProvider>,
    )
    fireEvent.click(
      screen.getByRole("button", { name: "Open appearance settings" }),
    )
    expect(
      screen.getByRole("region", { name: "Appearance" }),
    ).toBeInTheDocument()
  })

  it("forwards open state and onOpenChange", () => {
    const onOpenChange = vi.fn()
    render(
      <ThemeProvider>
        <ThemeSwitcher defaultOpen onOpenChange={onOpenChange} />
      </ThemeProvider>,
    )
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    fireEvent.keyDown(document, { key: "Escape" })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("labels every toggle group it renders", () => {
    renderSwitcher()
    openSwitcher()
    openAdvanced()
    for (const group of screen.getAllByRole("radiogroup")) {
      expect(group).toHaveAccessibleName()
    }
  })
})
