import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, it, expect } from "vitest"
import { useLayoutStore } from "@layout/layoutStore"
import { ThemeProvider, themeConfig } from "@theme"
import { BUILTIN_STYLES } from "@theme/styles"
import type { AxisValues } from "@theme"
import { SidebarLayout } from "@layout/sidebar"
import type { SidebarLayoutProps } from "@layout/sidebar"
import { RouterAdapterProvider } from "@router"
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

function renderLayout(props: Partial<SidebarLayoutProps> = {}) {
  return render(
    <RouterAdapterProvider value={adapter}>
      <SidebarLayout nav={nav} showThemeSwitcher={false} {...props}>
        <div>Content</div>
      </SidebarLayout>
    </RouterAdapterProvider>,
  )
}

function railNav(container: HTMLElement) {
  return container.querySelector<HTMLElement>(
    ".dr-sidebar-layout-nav-scroll .dr-sidebar-nav",
  )
}

function brandSlot(container: HTMLElement) {
  return container.querySelector<HTMLElement>(".dr-sidebar-layout-brand-slot")
}

describe("SidebarLayout collapsed brand slot", () => {
  it("shows the brand mark beside the toggle only once collapsed", async () => {
    const user = userEvent.setup()
    const { container } = renderLayout()

    expect(brandSlot(container)).toBeNull()

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }))

    const slot = brandSlot(container)
    expect(slot).not.toBeNull()
    expect(slot?.querySelector(".dr-brand-logo")).not.toBeNull()
  })

  // The mark only covers the toggle's paint. Dropping the button from the
  // tree until hover would strand keyboard users, who have no hover, with no
  // way back to the expanded rail.
  it("keeps the toggle mounted and reachable under the mark", async () => {
    const user = userEvent.setup()
    const { container } = renderLayout()
    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }))

    const slot = brandSlot(container)
    expect(slot).not.toBeNull()
    const toggle = within(slot as HTMLElement).getByRole("button", {
      name: "Expand sidebar",
    })

    await user.tab()
    toggle.focus()
    expect(toggle).toHaveFocus()

    await user.click(toggle)
    expect(
      screen.getByRole("button", { name: "Collapse sidebar" }),
    ).toBeInTheDocument()
    expect(brandSlot(container)).toBeNull()
  })
})

describe("shell grid", () => {
  it("marks its regions so shell style CSS can reach them", () => {
    const { container } = renderLayout()
    const shell = container.querySelector(".dr-shell")
    expect(shell).toHaveAttribute("data-structure", "sidebar")
    expect(shell?.querySelector('[data-region="nav"]')).toBeInTheDocument()
    expect(shell?.querySelector('[data-region="bar"]')).toBeInTheDocument()
    expect(shell?.querySelector('[data-region="content"]')).toBeInTheDocument()
  })

  it("puts the bar and the content in separate regions", () => {
    // The old .dr-sidebar-layout-main wrapper welded these into one box,
    // which no gutter could ever pull apart.
    const { container } = renderLayout()
    const bar = container.querySelector('[data-region="bar"]')
    const content = container.querySelector('[data-region="content"]')
    expect(bar).not.toBeNull()
    expect(content).not.toBeNull()
    expect(bar?.contains(content as Node)).toBe(false)
  })

  it("makes every region a direct grid child", () => {
    const { container } = renderLayout()
    const shell = container.querySelector(".dr-shell") as HTMLElement
    for (const region of ["nav", "bar", "content"]) {
      const node = container.querySelector(`[data-region="${region}"]`)
      expect(node?.parentElement).toBe(shell)
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

describe("SidebarLayout shell style", () => {
  const reset = () => useLayoutStore.setState({ shellStyle: null })
  beforeEach(reset)
  afterEach(reset)

  it("defaults to the classic treatment", () => {
    const { container } = renderLayout()
    expect(container.querySelector(".dr-shell")).toHaveAttribute(
      "data-shell-style",
      "classic",
    )
  })

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

  it("offers the shell-style choice, checking the painted style, only while unpinned", async () => {
    const user = userEvent.setup()
    const first = renderLayout({
      showLayoutSwitcher: true,
      defaultShellStyle: "inset",
    })
    await user.click(screen.getByRole("button", { name: "Switch layout" }))
    expect(screen.getAllByRole("menuitemradio")).toHaveLength(6)
    expect(
      screen.getByRole("menuitemradio", { name: "inset" }),
    ).toHaveAttribute("aria-checked", "true")
    first.unmount()
    renderLayout({ shellStyle: "island", showLayoutSwitcher: true })
    await user.click(screen.getByRole("button", { name: "Switch layout" }))
    expect(
      screen.getByRole("menuitem", { name: "Stacked" }),
    ).toBeInTheDocument()
    expect(screen.queryByRole("menuitemradio")).toBeNull()
  })
})

describe("sidebar selection precedence", () => {
  // Drive the setting through the provider's config rather than storage:
  // this suite runs without a localStorage stub.
  const look = (
    props: Partial<SidebarLayoutProps>,
    defaults?: Partial<AxisValues>,
  ) => {
    const tree = (
      <RouterAdapterProvider value={adapter}>
        <SidebarLayout nav={nav} showThemeSwitcher={false} {...props}>
          <div>Content</div>
        </SidebarLayout>
      </RouterAdapterProvider>
    )
    const { container } = render(
      defaults ? (
        <ThemeProvider
          config={{
            ...themeConfig,
            defaults: { ...themeConfig.defaults, ...defaults },
          }}
        >
          {tree}
        </ThemeProvider>
      ) : (
        tree
      ),
    )
    return railNav(container)?.dataset.sidebarSelection
  }

  it("follows the style under auto", () => {
    expect(look({}, { style: "tactile" })).toBe(
      BUILTIN_STYLES.tactile.signatures?.navSelection,
    )
  })

  it("follows an explicit theme setting", () => {
    expect(look({}, { sidebarSelection: "pill" })).toBe("pill")
  })

  it("lets the prop beat the theme setting", () => {
    expect(look({ selection: "frosted" }, { sidebarSelection: "pill" })).toBe(
      "frosted",
    )
  })

  it("still works with no ThemeProvider at all", () => {
    expect(look({})).toBe("chip")
  })
})
