// `RouterLinkProps` does not include arbitrary `data-*` props, so a
// contract-conforming adapter Link — the package's own StubLink included —
// is free to drop them. The collapsed square must therefore be selectable
// without relying on an attribute that only lands on the anchor when the
// consumer happens to spread its rest props.
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { RouterAdapterProvider } from "@router"
import type { RouterAdapter, RouterLinkProps } from "@router"
import { SidebarNav } from "./SidebarNav"
import { SidebarProvider } from "./SidebarContext"
import type { NavGroup } from "@layout/types"

const thisDir = dirname(fileURLToPath(import.meta.url))
const sidebarNavCss = readFileSync(
  resolve(thisDir, "./sidebar-nav.css"),
  "utf8",
)
const scifiCss = readFileSync(
  resolve(thisDir, "../../theme/presets/scifi/scifi.css"),
  "utf8",
)

function StrictLink({ to, className, style, children }: RouterLinkProps) {
  return (
    <a href={to} className={className} style={style}>
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
  const withoutComments = sidebarNavCss.replace(/\/\*[\s\S]*?\*\//g, "")
  const rule = [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
    ([, selector, body]) =>
      selector.includes(".dr-sidebar-nav-link") &&
      body.includes("w-[var(--density-cell)]"),
  )
  if (!rule) {
    throw new Error("no collapsed square rule found in sidebar-nav.css")
  }
  return rule[1].trim()
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

describe("SidebarNav activeBar", () => {
  function renderWithActiveBar(activeBar?: boolean | "bar" | "ring" | "both") {
    const { container } = render(
      <RouterAdapterProvider value={strictAdapter}>
        <SidebarProvider collapsed={false}>
          <SidebarNav nav={nav} activeBar={activeBar} />
        </SidebarProvider>
      </RouterAdapterProvider>,
    )
    const el = container.querySelector(".dr-sidebar-nav")
    if (!el) throw new Error("no sidebar nav rendered")
    return el
  }

  it("emits no attribute when the prop is omitted", () => {
    expect(renderWithActiveBar().getAttribute("data-active-bar")).toBeNull()
  })

  it("maps true to bar", () => {
    expect(renderWithActiveBar(true).getAttribute("data-active-bar")).toBe(
      "bar",
    )
  })

  it("maps false to ring", () => {
    expect(renderWithActiveBar(false).getAttribute("data-active-bar")).toBe(
      "ring",
    )
  })

  it("passes through each explicit value", () => {
    expect(renderWithActiveBar("bar").getAttribute("data-active-bar")).toBe(
      "bar",
    )
    expect(renderWithActiveBar("ring").getAttribute("data-active-bar")).toBe(
      "ring",
    )
    expect(renderWithActiveBar("both").getAttribute("data-active-bar")).toBe(
      "both",
    )
  })

  it("has a ring rule with no 3px rail", () => {
    const withoutComments = sidebarNavCss.replace(/\/\*[\s\S]*?\*\//g, "")
    const rule = [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
      ([, selector]) =>
        selector.includes('[data-active-bar="ring"]') &&
        !selector.includes("data-preset"),
    )
    expect(rule, "no activeBar=ring rule in sidebar-nav.css").toBeDefined()
    expect(rule?.[2]).toMatch(/inset 0 0 0 1px/)
    expect(rule?.[2]).not.toMatch(/inset 3px/)
  })

  it("has a both rule carrying the ring and the rail", () => {
    const withoutComments = sidebarNavCss.replace(/\/\*[\s\S]*?\*\//g, "")
    const rule = [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
      ([, selector]) =>
        selector.includes('[data-active-bar="both"]') &&
        !selector.includes("data-preset"),
    )
    expect(rule, "no activeBar=both rule in sidebar-nav.css").toBeDefined()
    expect(rule?.[2]).toMatch(/inset 0 0 0 1px/)
    expect(rule?.[2]).toMatch(/inset 3px/)
  })

  it("gives glass its own variant for each value", () => {
    const withoutComments = sidebarNavCss.replace(/\/\*[\s\S]*?\*\//g, "")
    const rules = [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    for (const value of ["bar", "ring", "both"]) {
      const rule = rules.find(
        ([, selector]) =>
          selector.includes('[data-preset="glass"]') &&
          selector.includes(`[data-active-bar="${value}"]`),
      )
      expect(rule, `no glass rule for activeBar=${value}`).toBeDefined()
    }
  })

  it("gives glass a full-opacity standalone ring with no rail", () => {
    const withoutComments = sidebarNavCss.replace(/\/\*[\s\S]*?\*\//g, "")
    const rule = [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
      ([, selector]) =>
        selector.includes('[data-preset="glass"]') &&
        selector.includes('[data-active-bar="ring"]'),
    )
    expect(rule, "no glass activeBar=ring rule found").toBeDefined()
    expect(rule?.[2]).toMatch(/inset 0 0 0 1px/)
    expect(rule?.[2]).not.toMatch(/0\.3/)
  })

  it("gives glass both the rail and a tinted ring, rail painted first", () => {
    const withoutComments = sidebarNavCss.replace(/\/\*[\s\S]*?\*\//g, "")
    const rule = [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
      ([, selector]) =>
        selector.includes('[data-preset="glass"]') &&
        selector.includes('[data-active-bar="both"]'),
    )
    expect(rule, "no glass activeBar=both rule found").toBeDefined()
    const body = rule?.[2] ?? ""
    expect(body).toMatch(/inset 3px/)
    expect(body).toMatch(/inset 0 0 0 1px/)
    expect(body).toMatch(/0\.3/)
    const railIndex = body.indexOf("inset 3px")
    const ringIndex = body.indexOf("inset 0 0 0 1px")
    expect(railIndex).toBeGreaterThanOrEqual(0)
    expect(ringIndex).toBeGreaterThanOrEqual(0)
    expect(railIndex).toBeLessThan(ringIndex)
  })

  it("keeps the glass default carrying both layers", () => {
    const withoutComments = sidebarNavCss.replace(/\/\*[\s\S]*?\*\//g, "")
    const base = [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
      ([, selector]) =>
        selector.includes('[data-preset="glass"]') &&
        selector.includes(".dr-sidebar-nav-item.active") &&
        !selector.includes("data-active-bar"),
    )
    expect(base, "glass base rule missing").toBeDefined()
    expect(base?.[2]).toMatch(/inset 3px/)
    expect(base?.[2]).toMatch(/inset 0 0 0 1px/)
  })

  it("gives scifi its own variant for each value, in its own file", () => {
    const withoutComments = scifiCss.replace(/\/\*[\s\S]*?\*\//g, "")
    const rules = [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    for (const value of ["bar", "ring", "both"]) {
      const rule = rules.find(
        ([, selector]) =>
          selector.includes(".dr-sidebar-nav-item") &&
          selector.includes(`[data-active-bar="${value}"]`),
      )
      expect(rule, `no scifi rule for activeBar=${value}`).toBeDefined()
    }
  })

  it("gives scifi both the rail and the ring, rail painted first", () => {
    const withoutComments = scifiCss.replace(/\/\*[\s\S]*?\*\//g, "")
    const rule = [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
      ([, selector]) =>
        selector.includes(".dr-sidebar-nav-item") &&
        selector.includes('[data-active-bar="both"]'),
    )
    expect(rule, "no scifi activeBar=both rule found").toBeDefined()
    const body = rule?.[2] ?? ""
    expect(body).toMatch(/inset 3px/)
    expect(body).toMatch(/inset 0 0 0 1px/)
    const railIndex = body.indexOf("inset 3px")
    const ringIndex = body.indexOf("inset 0 0 0 1px")
    expect(railIndex).toBeGreaterThanOrEqual(0)
    expect(ringIndex).toBeGreaterThanOrEqual(0)
    expect(railIndex).toBeLessThan(ringIndex)
  })

  it("keeps the scifi default as a ring only", () => {
    const withoutComments = scifiCss.replace(/\/\*[\s\S]*?\*\//g, "")
    const base = [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
      ([, selector]) =>
        selector.includes(".dr-sidebar-nav-item.active") &&
        !selector.includes("data-active-bar"),
    )
    expect(base, "scifi base rule missing").toBeDefined()
    expect(base?.[2]).toMatch(/inset 0 0 0 1px/)
    expect(base?.[2]).not.toMatch(/inset 3px/)
  })
})
