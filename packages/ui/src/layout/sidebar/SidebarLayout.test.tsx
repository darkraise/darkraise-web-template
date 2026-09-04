import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { ThemeProvider, themeConfig } from "@theme"
import type { SidebarActiveBarSetting } from "@theme"
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

describe("SidebarLayout activeBar", () => {
  it("leaves the preset's own indicator alone when unset", () => {
    const { container } = renderLayout()
    expect(railNav(container)?.dataset.activeBar).toBeUndefined()
  })

  it("applies an explicit style without the toggle being shown", () => {
    const { container } = renderLayout({ activeBar: "ring" })
    expect(railNav(container)?.dataset.activeBar).toBe("ring")
  })

  it.each([
    [true, "bar"],
    [false, "ring"],
  ])("maps the %s shorthand to %s", (input, expected) => {
    const { container } = renderLayout({ activeBar: input })
    expect(railNav(container)?.dataset.activeBar).toBe(expected)
  })

  it("seeds the toggle from defaultActiveBar and lets it take over", async () => {
    const user = userEvent.setup()
    const { container } = renderLayout({
      defaultActiveBar: "both",
      showActiveBarToggle: true,
    })
    expect(railNav(container)?.dataset.activeBar).toBe("both")

    await user.click(screen.getByRole("radio", { name: "Left rail only" }))
    expect(railNav(container)?.dataset.activeBar).toBe("bar")
  })

  // Controlled means the prop wins: the toggle reports the click and waits
  // for the consumer to feed a new value back, exactly like a controlled
  // input. Without this the two sources of truth would fight.
  it("keeps a controlled activeBar pinned and reports toggle clicks", async () => {
    const user = userEvent.setup()
    const onActiveBarChange = vi.fn()
    const { container } = renderLayout({
      activeBar: "ring",
      showActiveBarToggle: true,
      onActiveBarChange,
    })

    await user.click(screen.getByRole("radio", { name: "Left rail only" }))

    expect(onActiveBarChange).toHaveBeenCalledWith("bar")
    expect(railNav(container)?.dataset.activeBar).toBe("ring")
  })

  it("reports the default item as undefined", async () => {
    const user = userEvent.setup()
    const onActiveBarChange = vi.fn()
    renderLayout({
      defaultActiveBar: "bar",
      showActiveBarToggle: true,
      onActiveBarChange,
    })

    await user.click(
      screen.getByRole("radio", { name: "Each preset's own indicator" }),
    )

    expect(onActiveBarChange).toHaveBeenCalledWith(undefined)
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

  it("defaults to the classic treatment", () => {
    const { container } = renderLayout()
    expect(container.querySelector(".dr-shell")).toHaveAttribute(
      "data-shell-style",
      "classic",
    )
  })

  it("pins the style when the prop is given", () => {
    const { container } = renderLayout({ shellStyle: "island" })
    expect(container.querySelector(".dr-shell")).toHaveAttribute(
      "data-shell-style",
      "island",
    )
  })
})

describe("active indicator precedence", () => {
  // Drive the axis through the provider's config rather than storage: this
  // suite runs without a localStorage stub.
  const withAxis = (value: SidebarActiveBarSetting) => ({
    ...themeConfig,
    defaults: { ...themeConfig.defaults, sidebarActiveBar: value },
  })

  const renderWithTheme = (
    props: Partial<SidebarLayoutProps> = {},
    axis?: SidebarActiveBarSetting,
  ) => {
    const tree = (
      <RouterAdapterProvider value={adapter}>
        <SidebarLayout nav={nav} showThemeSwitcher={false} {...props}>
          <div>Content</div>
        </SidebarLayout>
      </RouterAdapterProvider>
    )
    return render(
      axis === undefined ? (
        tree
      ) : (
        <ThemeProvider config={withAxis(axis)}>{tree}</ThemeProvider>
      ),
    )
  }

  const wire = (container: HTMLElement) =>
    container
      .querySelector(".dr-sidebar-nav")
      ?.getAttribute("data-active-bar") ?? null

  it("leaves the preset's own indicator alone by default", () => {
    const { container } = renderWithTheme({}, "default")
    expect(wire(container)).toBeNull()
  })

  it("follows the theme axis when nothing more specific is set", () => {
    const { container } = renderWithTheme({}, "ring")
    expect(wire(container)).toBe("ring")
  })

  it("lets the prop beat the theme axis", () => {
    const { container } = renderWithTheme({ activeBar: "both" }, "ring")
    expect(wire(container)).toBe("both")
  })

  it("lets defaultActiveBar beat the theme axis", () => {
    const { container } = renderWithTheme({ defaultActiveBar: "bar" }, "ring")
    expect(wire(container)).toBe("bar")
  })

  it("still works with no ThemeProvider at all", () => {
    const { container } = renderWithTheme({ activeBar: "bar" })
    expect(wire(container)).toBe("bar")
  })
})
