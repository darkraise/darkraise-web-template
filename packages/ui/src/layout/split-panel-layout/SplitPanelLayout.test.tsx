import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { SplitPanelLayout } from "./SplitPanelLayout"
import { RouterAdapterProvider } from "@router"
import { UiLabelsProvider } from "@labels"
import type { RouterAdapter, RouterLinkProps } from "@router"
import type { NavGroup } from "@layout/types"

function StubLink({ to, className, children }: RouterLinkProps) {
  return (
    <a href={to} className={className}>
      {children}
    </a>
  )
}

const adapter: RouterAdapter = {
  Link: StubLink,
  useNavigate: () => () => {},
  usePathname: () => "/",
  useBack: () => () => {},
  useInvalidate: () => () => {},
}

const nav: NavGroup[] = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/" }] },
]

function renderLayout(props = {}) {
  return render(
    <RouterAdapterProvider value={adapter}>
      <SplitPanelLayout
        nav={nav}
        showThemeSwitcher={false}
        panel={<p>Records</p>}
        {...props}
      >
        <div>Content</div>
      </SplitPanelLayout>
    </RouterAdapterProvider>,
  )
}

const panelWidth = (container: HTMLElement) =>
  (container.querySelector(".dr-shell") as HTMLElement).style.getPropertyValue(
    "--panel-width",
  )

describe("SplitPanelLayout shell grid", () => {
  it("marks its regions", () => {
    const { container } = renderLayout()
    const shell = container.querySelector(".dr-shell")
    expect(shell).toHaveAttribute("data-structure", "split-panel")
    expect(shell?.querySelector('[data-region="bar"]')).toBeInTheDocument()
    expect(shell?.querySelector('[data-region="panel"]')).toBeInTheDocument()
    expect(shell?.querySelector('[data-region="handle"]')).toBeInTheDocument()
    expect(shell?.querySelector('[data-region="content"]')).toBeInTheDocument()
  })

  it("makes every region a direct grid child", () => {
    const { container } = renderLayout()
    const shell = container.querySelector(".dr-shell") as HTMLElement
    for (const region of ["bar", "panel", "handle", "content"]) {
      expect(
        container.querySelector(`[data-region="${region}"]`)?.parentElement,
      ).toBe(shell)
    }
  })

  it("pins the style when the prop is given", () => {
    const { container } = renderLayout({ shellStyle: "island" })
    expect(container.querySelector(".dr-shell")).toHaveAttribute(
      "data-shell-style",
      "island",
    )
  })
})

describe("SplitPanelLayout resize handle", () => {
  it("exposes the handle as a focusable separator", () => {
    renderLayout()
    const handle = screen.getByRole("separator")
    expect(handle).toHaveAttribute("aria-orientation", "vertical")
    expect(handle).toHaveAttribute("tabindex", "0")
    expect(handle).toHaveAttribute("aria-valuemin", "0")
    expect(handle).toHaveAttribute("aria-valuemax", "100")
  })

  it("widens the panel with the right arrow", () => {
    const { container } = renderLayout({ defaultPanelWidth: 320 })
    fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowRight" })
    expect(panelWidth(container)).not.toBe("320px")
  })

  it("jumps to the bounds on Home and End", () => {
    const { container } = renderLayout({
      defaultPanelWidth: 320,
      minPanelWidth: 240,
      maxPanelWidth: 480,
    })
    const handle = screen.getByRole("separator")

    fireEvent.keyDown(handle, { key: "Home" })
    expect(panelWidth(container)).toBe("240px")

    fireEvent.keyDown(handle, { key: "End" })
    expect(panelWidth(container)).toBe("480px")
  })

  it("never resizes past its bounds", () => {
    const { container } = renderLayout({
      defaultPanelWidth: 470,
      minPanelWidth: 240,
      maxPanelWidth: 480,
    })
    const handle = screen.getByRole("separator")
    for (let i = 0; i < 10; i++) {
      fireEvent.keyDown(handle, { key: "ArrowRight" })
    }
    expect(panelWidth(container)).toBe("480px")
  })

  it("routes its skip link through the label system", () => {
    render(
      <UiLabelsProvider value={{ layout: { skipToContent: "Naar inhoud" } }}>
        <RouterAdapterProvider value={adapter}>
          <SplitPanelLayout nav={nav} showThemeSwitcher={false} panel={null}>
            <div>Content</div>
          </SplitPanelLayout>
        </RouterAdapterProvider>
      </UiLabelsProvider>,
    )
    expect(
      screen.getByRole("link", { name: "Naar inhoud" }),
    ).toBeInTheDocument()
  })
})
