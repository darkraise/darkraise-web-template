import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, it, expect } from "vitest"
import { useLayoutStore } from "@layout/layoutStore"
import { StackedLayout } from "./StackedLayout"
import { RouterAdapterProvider } from "@router"
import { UiLabelsProvider } from "@labels"
import type { RouterAdapter, RouterLinkProps } from "@router"
import type { NavGroup } from "@layout/types"
import { readFileSync } from "node:fs"
import { CreditCard, Home, Settings, ShoppingCart, Users } from "lucide-react"
import { ThemeProvider, themeConfig } from "@theme"
import type { SidebarSelectionSetting } from "@theme"

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
      <StackedLayout nav={nav} showThemeSwitcher={false} {...props}>
        <div>Content</div>
      </StackedLayout>
    </RouterAdapterProvider>,
  )
}

describe("StackedLayout shell grid", () => {
  it("marks its regions", () => {
    const { container } = renderLayout()
    const shell = container.querySelector(".dr-shell")
    expect(shell).toHaveAttribute("data-structure", "stacked")
    expect(shell?.querySelector('[data-region="nav"]')).toBeInTheDocument()
    expect(shell?.querySelector('[data-region="subnav"]')).toBeInTheDocument()
    expect(shell?.querySelector('[data-region="bar"]')).toBeInTheDocument()
    expect(shell?.querySelector('[data-region="content"]')).toBeInTheDocument()
  })

  it("makes every region a direct grid child", () => {
    const { container } = renderLayout()
    const shell = container.querySelector(".dr-shell") as HTMLElement
    for (const region of ["nav", "subnav", "bar", "content"]) {
      expect(
        container.querySelector(`[data-region="${region}"]`)?.parentElement,
      ).toBe(shell)
    }
  })

  it("pins the style when the prop is given", () => {
    const { container } = renderLayout({ shellStyle: "framed" })
    expect(container.querySelector(".dr-shell")).toHaveAttribute(
      "data-shell-style",
      "framed",
    )
  })

  it("renders the real brand mark rather than a coloured box", () => {
    const { container } = renderLayout()
    expect(container.querySelector(".dr-brand-logo")).toBeInTheDocument()
  })

  it("routes its skip link through the label system", () => {
    render(
      <UiLabelsProvider value={{ layout: { skipToContent: "Bo qua" } }}>
        <RouterAdapterProvider value={adapter}>
          <StackedLayout nav={nav} showThemeSwitcher={false}>
            <div>Content</div>
          </StackedLayout>
        </RouterAdapterProvider>
      </UiLabelsProvider>,
    )
    expect(screen.getByRole("link", { name: "Bo qua" })).toBeInTheDocument()
  })
})

describe("StackedLayout shell style", () => {
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

describe("sidebar selection", () => {
  // Drive the setting through the provider's config rather than storage, as
  // SidebarLayout.test.tsx does: this suite runs without a localStorage stub.
  const renderWith = (setting: SidebarSelectionSetting) =>
    render(
      <ThemeProvider
        config={{
          ...themeConfig,
          defaults: { ...themeConfig.defaults, sidebarSelection: setting },
        }}
      >
        <RouterAdapterProvider value={adapter}>
          <StackedLayout nav={nav} showThemeSwitcher={false}>
            <div>Content</div>
          </StackedLayout>
        </RouterAdapterProvider>
      </ThemeProvider>,
    )

  const look = (container: HTMLElement, cls: string) =>
    container.querySelector<HTMLElement>(`.${cls}`)?.dataset.sidebarSelection

  it.each(["dr-stacked-layout-rail-nav", "dr-stacked-layout-aside-nav"])(
    "stamps the theme's look on .%s",
    (cls) => {
      expect(look(renderWith("pill").container, cls)).toBe("pill")
    },
  )

  it("resolves auto against the style", () => {
    const { container } = renderWith("auto")
    expect(look(container, "dr-stacked-layout-rail-nav")).toBe("chip")
    expect(look(container, "dr-stacked-layout-aside-nav")).toBe("chip")
  })

  it.each(["dr-stacked-layout-rail-nav", "dr-stacked-layout-aside-nav"])(
    "gives .%s an indicator",
    (cls) => {
      const { container } = renderWith("auto")
      expect(container.querySelector(`.${cls}`)?.firstElementChild).toHaveClass(
        "dr-sidebar-nav-indicator",
      )
    },
  )

  it("gives the rail icon a sidebar row's icon markup", () => {
    const { container } = render(
      <RouterAdapterProvider value={adapter}>
        <StackedLayout
          nav={[
            {
              label: "Overview",
              items: [{ label: "Dashboard", href: "/", icon: Home }],
            },
          ]}
          showThemeSwitcher={false}
        >
          <div>Content</div>
        </StackedLayout>
      </RouterAdapterProvider>,
    )
    expect(
      container.querySelector(
        ".dr-stacked-layout-rail-item > .dr-sidebar-nav-icon > .dr-sidebar-nav-icon-svg",
      ),
    ).not.toBeNull()
  })

  it("positions the indicator against both stacked navs", () => {
    const css = readFileSync("src/layout/sidebar/sidebar-selection.css", "utf8")
    expect(css).toContain(".dr-stacked-layout-rail-nav[data-sidebar-selection]")
    expect(css).toContain(
      ".dr-stacked-layout-aside-nav[data-sidebar-selection]",
    )
  })

  it("stamps Flat's shadow drop on both stacked navs", () => {
    const { container } = render(
      <ThemeProvider
        config={{
          ...themeConfig,
          defaults: { ...themeConfig.defaults, style: "flat" },
        }}
      >
        <RouterAdapterProvider value={adapter}>
          <StackedLayout nav={nav} showThemeSwitcher={false}>
            <div>Content</div>
          </StackedLayout>
        </RouterAdapterProvider>
      </ThemeProvider>,
    )
    for (const cls of [
      "dr-stacked-layout-rail-nav",
      "dr-stacked-layout-aside-nav",
    ]) {
      expect(
        container.querySelector<HTMLElement>(`.${cls}`)?.dataset.sidebarShadow,
        cls,
      ).toBe("none")
    }
  })
})

describe("stacked layout active row", () => {
  const groups: NavGroup[] = [
    {
      label: "Sales",
      items: [
        { label: "Orders", href: "/orders", icon: ShoppingCart },
        { label: "Customers", href: "/customers", icon: Users },
      ],
    },
  ]
  const at = (path: string): RouterAdapter => ({
    Link: ({ to, className, children, "aria-current": ariaCurrent }) => (
      <a href={to} className={className} aria-current={ariaCurrent}>
        {children}
      </a>
    ),
    useNavigate: () => () => {},
    usePathname: () => path,
    useBack: () => () => {},
    useInvalidate: () => () => {},
  })

  it("keeps a detail route on its sub-nav item and marks the rail", () => {
    const { container } = render(
      <RouterAdapterProvider value={at("/orders/ord-1")}>
        <StackedLayout nav={groups} showThemeSwitcher={false}>
          <div>Content</div>
        </StackedLayout>
      </RouterAdapterProvider>,
    )
    const aside = container.querySelector(".dr-stacked-layout-aside-nav")
    expect(aside?.querySelector(".dr-sidebar-nav-current")).toHaveTextContent(
      "Orders",
    )
    expect(
      container.querySelector(
        ".dr-stacked-layout-rail-nav .dr-sidebar-nav-current",
      ),
    ).not.toBeNull()
  })

  it("picks the group that holds the longest match", () => {
    const overlapping: NavGroup[] = [
      {
        label: "Settings",
        items: [{ label: "Settings", href: "/settings", icon: Settings }],
      },
      {
        label: "Billing",
        items: [
          { label: "Billing", href: "/settings/billing", icon: CreditCard },
        ],
      },
    ]
    const { container } = render(
      <RouterAdapterProvider value={at("/settings/billing/42")}>
        <StackedLayout nav={overlapping} showThemeSwitcher={false}>
          <div>Content</div>
        </StackedLayout>
      </RouterAdapterProvider>,
    )
    const rail = container.querySelectorAll(
      ".dr-stacked-layout-rail-nav .dr-sidebar-nav-current",
    )
    expect(rail).toHaveLength(1)
    expect(rail[0]).toHaveAttribute("href", "/settings/billing")
    expect(
      container.querySelector(".dr-stacked-layout-aside-label"),
    ).toHaveTextContent("Billing")
  })
})
