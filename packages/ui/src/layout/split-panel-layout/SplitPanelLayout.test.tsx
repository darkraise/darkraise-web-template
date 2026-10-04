import { render, screen, fireEvent } from "@testing-library/react"
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest"
import { useLayoutStore } from "@layout/layoutStore"
import {
  SplitPanelLayout,
  type SplitPanelLayoutProps,
} from "./SplitPanelLayout"
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
  return render(phoneTree(props))
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

describe("SplitPanelLayout shell style", () => {
  const reset = () => useLayoutStore.setState({ shellStyle: null })
  beforeEach(reset)
  afterEach(reset)

  it("starts from defaultShellStyle until the user picks one", () => {
    const first = renderLayout({ defaultShellStyle: "inset" })
    expect(first.container.querySelector(".dr-shell")).toHaveAttribute(
      "data-shell-style",
      "inset",
    )
    first.unmount()
    useLayoutStore.setState({ shellStyle: "flat" })
    const second = renderLayout({ defaultShellStyle: "inset" })
    expect(second.container.querySelector(".dr-shell")).toHaveAttribute(
      "data-shell-style",
      "flat",
    )
  })

  it("offers the shell-style choice, checking the painted style, only while unpinned", () => {
    const first = renderLayout({
      showLayoutSwitcher: true,
      defaultShellStyle: "inset",
    })
    fireEvent.click(screen.getByRole("button", { name: "Switch layout" }))
    expect(screen.getAllByRole("menuitemradio")).toHaveLength(6)
    expect(
      screen.getByRole("menuitemradio", { name: "inset" }),
    ).toHaveAttribute("aria-checked", "true")
    first.unmount()
    renderLayout({ shellStyle: "framed", showLayoutSwitcher: true })
    fireEvent.click(screen.getByRole("button", { name: "Switch layout" }))
    expect(
      screen.getByRole("menuitem", { name: "Stacked" }),
    ).toBeInTheDocument()
    expect(screen.queryByRole("menuitemradio")).toBeNull()
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

function phoneTree(props: Partial<SplitPanelLayoutProps> = {}) {
  return (
    <RouterAdapterProvider value={adapter}>
      <SplitPanelLayout
        nav={nav}
        showThemeSwitcher={false}
        panel={<p>Records</p>}
        {...props}
      >
        <div>Content</div>
      </SplitPanelLayout>
    </RouterAdapterProvider>
  )
}

const PHONE_QUERY = "(width < 48rem)"

function stubPhoneWidth(narrow: boolean) {
  window.matchMedia = vi.fn((query: string) => ({
    matches: narrow && query === PHONE_QUERY,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

describe("SplitPanelLayout phone view", () => {
  const originalMatchMedia = window.matchMedia
  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it("shows the panel until the content is active", () => {
    const { container, rerender } = render(phoneTree())
    const shell = container.querySelector(".dr-shell")
    expect(shell).toHaveAttribute("data-mobile-view", "panel")
    rerender(phoneTree({ contentActive: true }))
    expect(shell).toHaveAttribute("data-mobile-view", "content")
  })

  it("renders no Back button without onBack", () => {
    render(phoneTree({ contentActive: true }))
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull()
  })

  it("renders a Back button that calls onBack", () => {
    const onBack = vi.fn()
    render(phoneTree({ contentActive: true, onBack }))
    const back = screen.getByRole("button", { name: "Back" })
    expect(back).toHaveClass("dr-split-panel-layout-back")
    fireEvent.click(back)
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it("moves focus between content and panel on a phone", () => {
    stubPhoneWidth(true)
    const { container, rerender } = render(phoneTree())
    rerender(phoneTree({ contentActive: true }))
    expect(document.activeElement).toBe(
      container.querySelector("main#main-content"),
    )
    rerender(phoneTree({ contentActive: false }))
    expect(document.activeElement).toBe(
      container.querySelector('[data-region="panel"]'),
    )
  })

  it("points the skip link at the panel while the phone list shows", () => {
    stubPhoneWidth(true)
    const { container, rerender } = render(phoneTree())
    const link = () => screen.getByRole("link", { name: "Skip to content" })
    expect(link()).toHaveAttribute("href", "#panel-region")
    expect(container.querySelector("#panel-region")).toBe(
      container.querySelector('[data-region="panel"]'),
    )
    rerender(phoneTree({ contentActive: true }))
    expect(link()).toHaveAttribute("href", "#main-content")
  })

  it("keeps the skip link on the content side by side", () => {
    stubPhoneWidth(false)
    render(phoneTree())
    expect(
      screen.getByRole("link", { name: "Skip to content" }),
    ).toHaveAttribute("href", "#main-content")
  })

  it("leaves focus alone side by side", () => {
    stubPhoneWidth(false)
    const { rerender } = render(phoneTree())
    rerender(phoneTree({ contentActive: true }))
    expect(document.activeElement).toBe(document.body)
  })
})
