import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { UiLabelsProvider } from "@labels"
import { ThemeProvider } from "@theme"
import { ThemeSwitcher } from "@theme/theme-switcher"
import type { ThemeConfig } from "@theme/themeConfig"

const config: ThemeConfig = {
  defaults: {
    accentColor: "blue",
    surfaceColor: "slate",
    preset: "default",
    backgroundStyle: "solid",
    backgroundIntensity: "balanced",
    gradientPattern: "blobs",
    mode: "light",
    density: "cozy",
    elevation: "medium",
    buttonElevation: "flat",
    radius: "rounded",
    fontSize: "medium",
    accentVibrancy: "balanced",
  },
  switcher: {
    enabled: true,
    axes: {
      mode: true,
      accentColor: false,
      surfaceColor: false,
      preset: false,
      backgroundStyle: false,
      backgroundIntensity: false,
      gradientPattern: false,
      density: false,
      elevation: false,
      buttonElevation: false,
      radius: false,
      fontSize: false,
      accentVibrancy: false,
      presetAxes: false,
    },
  },
}

function renderSwitcher(labels?: Parameters<typeof UiLabelsProvider>[0]["value"]) {
  const tree = (
    <ThemeProvider config={config}>
      <ThemeSwitcher />
    </ThemeProvider>
  )
  return render(
    labels ? <UiLabelsProvider value={labels}>{tree}</UiLabelsProvider> : tree,
  )
}

describe("ThemeSwitcher labels", () => {
  it("renders the English mode axis with no provider", async () => {
    const user = userEvent.setup()
    renderSwitcher()
    await user.click(screen.getByRole("button"))
    expect(screen.getByText("Mode")).toBeInTheDocument()
  })

  it("renders an overridden axis label", async () => {
    const user = userEvent.setup()
    renderSwitcher({ theme: { axisLabels: { mode: "Chế độ" } } })
    await user.click(screen.getByRole("button"))
    expect(screen.getByText("Chế độ")).toBeInTheDocument()
  })
})
