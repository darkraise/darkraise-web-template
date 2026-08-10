import type * as React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { ThemeProvider } from "@theme/theme-provider"
import { themeConfig, type ThemeConfig } from "@theme/themeConfig"
import { ThemeSettingsPanel } from "./ThemeSettingsPanel"
import { ThemeSwitcher } from "./ThemeSwitcher"

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

// Derived from the real config rather than hand-listed, so a newly added axis
// is switched off here automatically instead of quietly re-populating the
// panel and making these tests pass for the wrong reason.
const allAxesHidden: ThemeConfig = {
  ...themeConfig,
  switcher: {
    ...themeConfig.switcher,
    axes: Object.fromEntries(
      Object.keys(themeConfig.switcher.axes).map((axis) => [axis, false]),
    ) as ThemeConfig["switcher"]["axes"],
  },
}

function renderHidden(ui: React.ReactNode) {
  return render(<ThemeProvider config={allAxesHidden}>{ui}</ThemeProvider>)
}

describe("theme settings with every axis hidden", () => {
  beforeEach(() => {
    mockMatchMedia()
  })

  it("renders no ThemeSwitcher trigger at all", () => {
    const { container } = renderHidden(<ThemeSwitcher />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Customize theme" }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText("Customize theme")).not.toBeInTheDocument()
    expect(container).toBeEmptyDOMElement()
  })

  it("renders nothing for the ThemeSettingsPanel", () => {
    const { container } = renderHidden(<ThemeSettingsPanel />)
    expect(container).toBeEmptyDOMElement()
    expect(container.querySelector(".dr-theme-settings")).toBeNull()
  })
})
