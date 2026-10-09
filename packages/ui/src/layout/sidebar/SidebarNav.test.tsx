// `RouterLinkProps` does not include arbitrary `data-*` props, so a
// contract-conforming adapter Link — the package's own StubLink included —
// is free to drop them. The collapsed square must therefore be selectable
// without relying on an attribute that only lands on the anchor when the
// consumer happens to spread its rest props.
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { RouterAdapterProvider } from "@router"
import type { RouterAdapter, RouterLinkProps } from "@router"
import { SidebarNav } from "./SidebarNav"
import { SidebarProvider } from "./SidebarContext"
import { ThemeProvider, themeConfig } from "@theme"
import type { SidebarSelection } from "@theme"
import type { NavGroup } from "@layout/types"
import { stripCssComments } from "../../test/strip-css-comments"

const thisDir = dirname(fileURLToPath(import.meta.url))
const sidebarNavCss = readFileSync(
  resolve(thisDir, "./sidebar-nav.css"),
  "utf8",
)

function StrictLink({
  to,
  className,
  style,
  children,
  "aria-current": ariaCurrent,
}: RouterLinkProps) {
  return (
    <a
      href={to}
      className={className}
      style={style}
      aria-current={ariaCurrent}
      // A router link handles the click itself; jsdom cannot load another
      // document and logs an error when an anchor tries.
      onClick={(event) => event.preventDefault()}
    >
      {children}
    </a>
  )
}

function makeAdapter(pathname: string): RouterAdapter {
  return {
    Link: StrictLink,
    useNavigate: () => () => {},
    usePathname: () => pathname,
    useBack: () => () => {},
    useInvalidate: () => () => {},
  }
}

const strictAdapter = makeAdapter("/")

const nav: NavGroup[] = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/" }] },
]

// The selector list of the rule that pins the icon-only item to a square,
// read from the stylesheet itself so the test tracks the real CSS rather
// than a hard-coded copy of it.
function collapsedSquareSelector(): string {
  const withoutComments = stripCssComments(sidebarNavCss)
  const rule = [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
    ([, selector = "", body = ""]) =>
      selector.includes(".dr-sidebar-nav-link") &&
      body.includes("w-[var(--control-height)]"),
  )
  if (!rule) {
    throw new Error("no collapsed square rule found in sidebar-nav.css")
  }
  const selector = rule[1]
  if (!selector) throw new Error("collapsed square rule has no selector")
  return selector.trim()
}

function renderNav(collapsed: boolean) {
  const { container } = render(
    <RouterAdapterProvider value={strictAdapter}>
      <SidebarProvider collapsed={collapsed}>
        <SidebarNav nav={nav} />
      </SidebarProvider>
    </RouterAdapterProvider>,
  )
  const link = container.querySelector(".dr-sidebar-nav-link")
  if (!link) throw new Error("no sidebar nav link rendered")
  return link
}

describe("SidebarNav collapsed styling", () => {
  it("matches the collapsed square rule when the adapter Link drops data-* props", () => {
    expect(renderNav(true).matches(collapsedSquareSelector())).toBe(true)
  })

  it("does not match the collapsed square rule while expanded", () => {
    expect(renderNav(false).matches(collapsedSquareSelector())).toBe(false)
  })
})

const nestedNav: NavGroup[] = [
  {
    label: "Catalog",
    items: [
      {
        label: "Products",
        href: "/products",
        badge: "12",
        children: [
          { label: "All products", href: "/products/all" },
          { label: "Drafts", href: "/products/drafts" },
        ],
      },
    ],
  },
]

function renderNested(collapsed: boolean, pathname = "/products/all") {
  const tree = (path: string) => (
    <RouterAdapterProvider value={makeAdapter(path)}>
      <SidebarProvider collapsed={collapsed}>
        <SidebarNav nav={nestedNav} />
      </SidebarProvider>
    </RouterAdapterProvider>
  )
  const result = render(tree(pathname))
  return { ...result, navigate: (path: string) => result.rerender(tree(path)) }
}

describe("SidebarNav parent items", () => {
  it("links the expanded parent to its own href", () => {
    const { container } = renderNested(false)
    expect(container.querySelector('a[href="/products"]')).not.toBeNull()
  })

  it("renders the expanded parent's label and badge", () => {
    const { container } = renderNested(false)
    const link = container.querySelector('a[href="/products"]')
    expect(link?.querySelector(".dr-sidebar-nav-label")?.textContent).toBe(
      "Products",
    )
    expect(link?.querySelector(".dr-sidebar-nav-badge")?.textContent).toBe("12")
  })

  it("gives the expanded chevron a stable accessible name and toggles it", async () => {
    const user = userEvent.setup()
    renderNested(false)
    const chevron = screen.getByRole("button", { name: "Products" })
    expect(chevron).toHaveAttribute("aria-expanded", "true")
    await user.click(chevron)
    expect(chevron).toHaveAttribute("aria-expanded", "false")
    // The name must not track the state: it also names the content region.
    expect(screen.getByRole("button", { name: "Products" })).toBe(chevron)
  })

  it("keeps the expanded parent link out of the toggle's hit area", async () => {
    const user = userEvent.setup()
    const { container } = renderNested(false)
    const link = container.querySelector('a[href="/products"]')
    expect(link).not.toBeNull()
    await user.click(link as Element)
    expect(screen.getByRole("button", { name: "Products" })).toHaveAttribute(
      "aria-expanded",
      "true",
    )
  })

  it("names the collapsed rail trigger", () => {
    renderNested(true)
    expect(screen.getByRole("button", { name: "Products" })).toBeInTheDocument()
  })

  it("reaches the parent route from the collapsed popover", async () => {
    const user = userEvent.setup()
    renderNested(true)
    await user.click(screen.getByRole("button", { name: "Products" }))
    const parentLink = await screen.findByRole("link", { name: "Products" })
    expect(parentLink).toHaveAttribute("href", "/products")
    expect(await screen.findByRole("link", { name: "Drafts" })).toHaveAttribute(
      "href",
      "/products/drafts",
    )
  })
})

describe("SidebarNav parent items follow the route", () => {
  it("starts open when a child route is current", () => {
    renderNested(false, "/products/drafts")
    expect(screen.getByRole("button", { name: "Products" })).toHaveAttribute(
      "aria-expanded",
      "true",
    )
  })

  it("starts closed when the route is elsewhere", () => {
    renderNested(false, "/orders")
    expect(screen.getByRole("button", { name: "Products" })).toHaveAttribute(
      "aria-expanded",
      "false",
    )
  })

  it("opens when navigation enters the group", () => {
    const { navigate } = renderNested(false, "/orders")
    const chevron = screen.getByRole("button", { name: "Products" })
    expect(chevron).toHaveAttribute("aria-expanded", "false")
    navigate("/products/all")
    expect(chevron).toHaveAttribute("aria-expanded", "true")
  })

  it("leaves a hand-collapsed group closed when navigation leaves it", async () => {
    const user = userEvent.setup()
    const { navigate } = renderNested(false, "/products/all")
    const chevron = screen.getByRole("button", { name: "Products" })
    await user.click(chevron)
    expect(chevron).toHaveAttribute("aria-expanded", "false")
    navigate("/orders")
    expect(chevron).toHaveAttribute("aria-expanded", "false")
  })

  it("marks the whole expanded row active on the parent's own route", () => {
    const { container } = renderNested(false, "/products")
    const row = container.querySelector(".dr-sidebar-nav-collapsible-row")
    // The row, not the link, so the fill and the rail cover the toggle too.
    expect(row).toHaveClass("dr-sidebar-nav-item")
    expect(row).toHaveAttribute("data-status", "active")
    expect(row?.querySelector(".dr-sidebar-nav-link")).not.toHaveClass(
      "dr-sidebar-nav-item",
    )
    expect(row?.querySelector("button")).not.toHaveClass("dr-sidebar-nav-item")
  })

  it("leaves the row unmarked while a child route is the active one", () => {
    const { container } = renderNested(false, "/products/drafts")
    expect(
      container.querySelector(".dr-sidebar-nav-collapsible-row"),
    ).not.toHaveAttribute("data-status")
  })

  it("marks the collapsed rail item active for a child route", () => {
    renderNested(true, "/products/drafts")
    expect(screen.getByRole("button", { name: "Products" })).toHaveAttribute(
      "data-status",
      "active",
    )
  })

  it("leaves the collapsed rail item unmarked elsewhere", () => {
    renderNested(true, "/orders")
    expect(
      screen.getByRole("button", { name: "Products" }),
    ).not.toHaveAttribute("data-status")
  })
})

describe("SidebarNav selection", () => {
  const navOf = (selection?: SidebarSelection) =>
    render(
      <RouterAdapterProvider value={makeAdapter("/")}>
        <SidebarProvider collapsed={false}>
          <SidebarNav nav={nav} selection={selection} />
        </SidebarProvider>
      </RouterAdapterProvider>,
    ).container.querySelector<HTMLElement>(".dr-sidebar-nav")

  it("draws the default style's look without a theme", () => {
    expect(navOf()?.dataset.sidebarSelection).toBe("chip")
  })

  it("draws the look it is given", () => {
    expect(navOf("frosted")?.dataset.sidebarSelection).toBe("frosted")
  })

  it("renders one hidden indicator as the nav's first child", () => {
    const first = navOf()?.firstElementChild
    expect(first).toHaveClass("dr-sidebar-nav-indicator")
    expect(first).toHaveAttribute("aria-hidden", "true")
  })

  it("carries the look into the collapsed rail's popover", async () => {
    const user = userEvent.setup()
    render(
      <RouterAdapterProvider value={makeAdapter("/products/drafts")}>
        <SidebarProvider collapsed>
          <SidebarNav nav={nestedNav} selection="pill" />
        </SidebarProvider>
      </RouterAdapterProvider>,
    )
    await user.click(screen.getByRole("button", { name: "Products" }))
    expect(
      document.querySelector(".dr-sidebar-nav-popover-content"),
    ).toHaveAttribute("data-sidebar-selection", "pill")
  })

  it("drops the shadows under Flat even for a pinned look", () => {
    const { container } = render(
      <ThemeProvider
        config={{
          ...themeConfig,
          defaults: { ...themeConfig.defaults, style: "flat" },
        }}
      >
        <RouterAdapterProvider value={makeAdapter("/")}>
          <SidebarProvider collapsed={false}>
            <SidebarNav nav={nav} selection="tile" />
          </SidebarProvider>
        </RouterAdapterProvider>
      </ThemeProvider>,
    )
    const el = container.querySelector<HTMLElement>(".dr-sidebar-nav")
    expect(el?.dataset.sidebarSelection).toBe("tile")
    expect(el?.dataset.sidebarShadow).toBe("none")
  })

  it("keeps the shadows outside Flat", () => {
    expect(navOf("tile")?.hasAttribute("data-sidebar-shadow")).toBe(false)
  })

  it("carries Flat's shadow drop into the collapsed rail's popover", async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider
        config={{
          ...themeConfig,
          defaults: { ...themeConfig.defaults, style: "flat" },
        }}
      >
        <RouterAdapterProvider value={makeAdapter("/products/drafts")}>
          <SidebarProvider collapsed>
            <SidebarNav nav={nestedNav} selection="tile" />
          </SidebarProvider>
        </RouterAdapterProvider>
      </ThemeProvider>,
    )
    await user.click(screen.getByRole("button", { name: "Products" }))
    expect(
      document.querySelector(".dr-sidebar-nav-popover-content"),
    ).toHaveAttribute("data-sidebar-shadow", "none")
  })
})

describe("SidebarNav active row", () => {
  const detailNav: NavGroup[] = [
    {
      label: "Sales",
      items: [
        { label: "Orders", href: "/orders" },
        { label: "Customers", href: "/customers" },
      ],
    },
  ]
  const indexNav: NavGroup[] = [
    {
      label: "Catalog",
      items: [
        {
          label: "Products",
          href: "/products",
          children: [
            { label: "All products", href: "/products" },
            { label: "Drafts", href: "/products/drafts" },
          ],
        },
      ],
    },
  ]
  // Two parents whose hrefs overlap: "/settings" is a whole-segment prefix
  // of everything under "/settings/billing".
  const overlapNav: NavGroup[] = [
    {
      label: "Admin",
      items: [
        {
          label: "Settings",
          href: "/settings",
          children: [{ label: "Profile", href: "/settings/profile" }],
        },
        {
          label: "Billing",
          href: "/settings/billing",
          children: [{ label: "Invoices", href: "/settings/billing/invoices" }],
        },
      ],
    },
  ]
  const deepNav: NavGroup[] = [
    {
      label: "Admin",
      items: [
        {
          label: "Settings",
          href: "/settings",
          children: [
            { label: "Profile", href: "/settings/profile" },
            {
              label: "Billing",
              href: "/settings/billing",
              children: [
                { label: "Invoices", href: "/settings/billing/invoices" },
              ],
            },
          ],
        },
      ],
    },
  ]
  const renderAt = (
    groups: NavGroup[],
    path: string,
    collapsed = false,
    adapter: RouterAdapter = makeAdapter(path),
  ) =>
    render(
      <RouterAdapterProvider value={adapter}>
        <SidebarProvider collapsed={collapsed}>
          <SidebarNav nav={groups} />
        </SidebarProvider>
      </RouterAdapterProvider>,
    )

  it("keeps a detail route on its list item", () => {
    const { container } = renderAt(detailNav, "/orders/ord-1")
    const current = container.querySelectorAll(".dr-sidebar-nav-current")
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveTextContent("Orders")
  })

  it("marks the current link for assistive technology", () => {
    const { container } = renderAt(detailNav, "/orders/ord-1")
    expect(container.querySelector(".dr-sidebar-nav-current")).toHaveAttribute(
      "aria-current",
      "page",
    )
  })

  it("marks one row when an index child shares its parent's href", () => {
    const { container } = renderAt(indexNav, "/products")
    const current = container.querySelectorAll(".dr-sidebar-nav-current")
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveTextContent("All products")
    expect(
      container.querySelector(".dr-sidebar-nav-collapsible-row"),
    ).toHaveClass("dr-sidebar-nav-ancestor")
    expect(
      container.querySelector(".dr-sidebar-nav-collapsible-link"),
    ).not.toHaveAttribute("aria-current")
  })

  it("marks only the expanded parent that holds the longest match", () => {
    const { container } = renderAt(overlapNav, "/settings/billing/invoices")
    const rows = container.querySelectorAll(".dr-sidebar-nav-collapsible-row")
    expect(rows[0]).not.toHaveClass("dr-sidebar-nav-ancestor")
    expect(rows[1]).toHaveClass("dr-sidebar-nav-ancestor")
    expect(container.querySelectorAll(".dr-sidebar-nav-current")).toHaveLength(
      1,
    )
  })

  it("marks only the collapsed parent that holds the longest match", () => {
    const { container } = renderAt(
      overlapNav,
      "/settings/billing/invoices",
      true,
    )
    const current = container.querySelectorAll(".dr-sidebar-nav-current")
    expect(current).toHaveLength(1)
    expect(current[0]).toBe(screen.getByRole("button", { name: "Billing" }))
  })

  it("marks the popover entry that leads to a grandchild route", async () => {
    const user = userEvent.setup()
    renderAt(deepNav, "/settings/billing/invoices", true)
    await user.click(screen.getByRole("button", { name: "Settings" }))
    const billing = screen.getByRole("link", { name: "Billing" })
    expect(billing).toHaveClass("dr-sidebar-nav-current")
    expect(billing).toHaveAttribute("aria-current", "page")
    expect(
      document.querySelectorAll(
        ".dr-sidebar-nav-popover-content .dr-sidebar-nav-current",
      ),
    ).toHaveLength(1)
  })

  it("asks the router for an exact match and no class on every link", async () => {
    const seen: RouterLinkProps[] = []
    const RecordingLink = (props: RouterLinkProps) => {
      seen.push(props)
      return <StrictLink {...props} />
    }
    const recording = (path: string): RouterAdapter => ({
      ...makeAdapter(path),
      Link: RecordingLink,
    })
    const user = userEvent.setup()
    // Unmounted first: the expanded chevron is also named "Products".
    renderAt(indexNav, "/products", false, recording("/products")).unmount()
    renderAt(indexNav, "/products", true, recording("/products"))
    await user.click(screen.getByRole("button", { name: "Products" }))
    expect(seen.length).toBeGreaterThan(0)
    for (const props of seen) {
      expect(props.activeExact, props.to).toBe(true)
      expect(props.activeClassName, props.to).toBeUndefined()
    }
  })

  it("marks the collapsed parent current for a child route", () => {
    renderAt(indexNav, "/products/drafts", true)
    expect(screen.getByRole("button", { name: "Products" })).toHaveClass(
      "dr-sidebar-nav-current",
    )
  })

  it("marks only the current popover entry", async () => {
    const user = userEvent.setup()
    renderAt(indexNav, "/products/drafts", true)
    await user.click(screen.getByRole("button", { name: "Products" }))
    expect(screen.getByRole("link", { name: "Drafts" })).toHaveClass(
      "dr-sidebar-nav-current",
    )
    expect(screen.getByRole("link", { name: "Products" })).not.toHaveClass(
      "dr-sidebar-nav-current",
    )
  })
})

describe("SidebarNav direction", () => {
  it("indents nested rows from the inline start", () => {
    const { container } = renderNested(false)
    const nested = container.querySelector<HTMLElement>(
      'a[href="/products/all"]',
    )
    expect(nested?.style.paddingInlineStart).toBe("24px")
    expect(nested?.style.paddingLeft).toBe("")
  })

  it("opens the collapsed rail's popover toward the inline end", async () => {
    const user = userEvent.setup()
    render(
      <div dir="rtl">
        <RouterAdapterProvider value={makeAdapter("/products/all")}>
          <SidebarProvider collapsed>
            <SidebarNav nav={nestedNav} />
          </SidebarProvider>
        </RouterAdapterProvider>
      </div>,
    )
    await user.click(screen.getByRole("button", { name: "Products" }))
    await waitFor(() =>
      expect(
        document.querySelector(".dr-sidebar-nav-popover-content"),
      ).toHaveAttribute("data-side", "left"),
    )
  })
})
