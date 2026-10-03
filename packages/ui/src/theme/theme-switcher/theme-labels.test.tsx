import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { UiLabelsProvider, defaultLabels } from "@labels"
import { ThemeProvider } from "@theme"
import { ThemeSwitcher } from "@theme/theme-switcher"
import type { ThemeConfig } from "@theme/themeConfig"
import { viTheme } from "../../locales/viTheme"
import { vi as viLocale } from "../../locales/vi"
import { themeMessages } from "../../i18n/themeMessages"

// Brand shows Mode and Density; Advanced shows Contrast and Background Intensity.
const config: ThemeConfig = {
  defaults: { backgroundIntensity: "balanced", mode: "light" },
  switcher: {
    enabled: true,
    axes: {
      accentColor: false,
      surfaceColor: false,
      tintWithAccent: false,
      style: false,
      font: false,
      radius: false,
      fontSize: false,
      darkAccentChroma: false,
      elevation: false,
      outerGlow: false,
      innerGlow: false,
      backgroundStyle: false,
      gradientPattern: false,
      sidebarActiveBar: false,
    },
  },
}

function renderSwitcher(
  labels?: Parameters<typeof UiLabelsProvider>[0]["value"],
) {
  const tree = (
    <ThemeProvider config={config}>
      <ThemeSwitcher />
    </ThemeProvider>
  )
  return render(
    labels ? <UiLabelsProvider value={labels}>{tree}</UiLabelsProvider> : tree,
  )
}

const trigger = () => screen.getByRole("button", { name: "Customize theme" })

describe("ThemeSwitcher labels", () => {
  it("renders the English mode axis with no provider", async () => {
    const user = userEvent.setup()
    renderSwitcher()
    await user.click(trigger())
    expect(screen.getByText("Mode")).toBeInTheDocument()
  })

  it("renders an overridden axis label", async () => {
    const user = userEvent.setup()
    renderSwitcher({ theme: { axisLabels: { mode: "Chế độ" } } })
    await user.click(trigger())
    expect(screen.getByText("Chế độ")).toBeInTheDocument()
  })

  it("wires the mode toggle group's accessible name to axisLabels.mode", async () => {
    const user = userEvent.setup()
    renderSwitcher({ theme: { axisLabels: { mode: "Chế độ" } } })
    await user.click(trigger())
    expect(
      screen.getByRole("radiogroup", { name: "Chế độ" }),
    ).toBeInTheDocument()
  })

  it("wires the density axis control's accessible name to axisLabels.density", async () => {
    const user = userEvent.setup()
    renderSwitcher({ theme: { axisLabels: { density: "Mật độ" } } })
    await user.click(trigger())
    expect(screen.getByRole("slider", { name: "Mật độ" })).toBeInTheDocument()
  })

  it("labels the contrast axis under Advanced", async () => {
    const user = userEvent.setup()
    renderSwitcher()
    await user.click(trigger())
    await user.click(screen.getByRole("button", { name: "Advanced" }))
    expect(screen.getByText("Contrast")).toBeInTheDocument()
  })

  it("labels the background intensity axis under Advanced", async () => {
    const user = userEvent.setup()
    renderSwitcher()
    await user.click(trigger())
    await user.click(screen.getByRole("button", { name: "Advanced" }))
    expect(screen.getByText("Background Intensity")).toBeInTheDocument()
  })

  it("names the Advanced trigger from groupLabels.advanced", async () => {
    const user = userEvent.setup()
    renderSwitcher({ theme: { groupLabels: { advanced: "Nâng cao" } } })
    await user.click(trigger())
    expect(
      screen.getByRole("button", { name: "Nâng cao" }),
    ).toBeInTheDocument()
  })

  it("labels the font axis and its faces in English and Vietnamese", () => {
    expect(defaultLabels.theme.axisLabels.font).toBe("Font")
    expect(viLocale.messages.theme.axisLabels.font).toBe("Phông chữ")
    for (const [value, label] of [
      ["inter", "Inter"],
      ["geist", "Geist"],
      ["ibm-plex-sans", "IBM Plex Sans"],
    ] as const) {
      expect(themeMessages[value]).toBe(label)
      expect(viTheme[value]).toBe(label)
    }
  })

  it("labels the style axes and the styles in English and Vietnamese", () => {
    expect(defaultLabels.theme.axisLabels.style).toBe("Style")
    expect(defaultLabels.theme.axisLabels.glassOpacity).toBe("Opacity")
    expect(defaultLabels.theme.axisLabels.glassBlur).toBe("Backdrop Blur")
    expect(defaultLabels.theme.styles).toEqual({
      flat: "Flat",
      quiet: "Quiet",
      tactile: "Tactile",
      glass: "Glass",
    })
    expect(viLocale.messages.theme.axisLabels.style).toBe("Phong cách")
    expect(viLocale.messages.theme.axisLabels.glassOpacity).toBe("Độ đục")
    expect(viLocale.messages.theme.axisLabels.glassBlur).toBe("Độ mờ nền")
    expect(viLocale.messages.theme.styles).toEqual({
      flat: "Phẳng",
      quiet: "Nhẹ nhàng",
      tactile: "Nổi khối",
      glass: "Kính mờ",
    })
  })

  it("has Vietnamese group labels", () => {
    expect(viLocale.messages.theme.groupLabels).toEqual({
      brand: "Thương hiệu",
      advanced: "Nâng cao",
    })
  })

  it("has Vietnamese option labels for the colour engine values", () => {
    expect(viTheme.standard).toBe("chuẩn")
    expect(viTheme.off).toBe("tắt")
    expect(viTheme.on).toBe("bật")
    expect(viTheme.neutralAccent).toBe("Trung tính (gần đen)")
  })
})
