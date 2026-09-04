import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import userEvent from "@testing-library/user-event"
import { SidebarLayout } from "@layout/sidebar"
import { TopNavLayout } from "@layout/top-nav-layout/TopNavLayout"
import { StackedLayout } from "@layout/stacked-layout/StackedLayout"
import { SplitPanelLayout } from "@layout/split-panel-layout/SplitPanelLayout"
import { RouterAdapterProvider } from "@router"
import type { RouterAdapter, RouterLinkProps } from "@router"
import type { NavGroup } from "@layout/types"

function StubLink({ to, className, children, ...rest }: RouterLinkProps) {
  return (
    <a href={to} className={className} {...rest}>
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

const layouts = [
  ["SidebarLayout", SidebarLayout],
  ["TopNavLayout", TopNavLayout],
  ["StackedLayout", StackedLayout],
  ["SplitPanelLayout", SplitPanelLayout],
] as const

function renderWith(Layout: (typeof layouts)[number][1], props: object) {
  return render(
    <RouterAdapterProvider value={adapter}>
      {/* @ts-expect-error - panel is required only on SplitPanelLayout */}
      <Layout nav={nav} showThemeSwitcher={false} panel={null} {...props}>
        <div>Content</div>
      </Layout>
    </RouterAdapterProvider>,
  )
}

// Only SidebarLayout renders these slots inline; the other three forward them
// to the mobile drawer, so the drawer is where the value has to be observed.
async function openDrawer() {
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Open menu" }))
}

describe.each(layouts)("%s nav slot props", (_name, Layout) => {
  it("renders the new prop name", async () => {
    renderWith(Layout, { navHeader: <p>slot</p> })
    await openDrawer()
    expect((await screen.findAllByText("slot")).length).toBeGreaterThan(0)
  })

  it("still renders the deprecated name", async () => {
    renderWith(Layout, { sidebarHeader: <p>legacy</p> })
    await openDrawer()
    expect((await screen.findAllByText("legacy")).length).toBeGreaterThan(0)
  })

  it("prefers the new name when both are given", async () => {
    renderWith(Layout, {
      navHeader: <p>fresh</p>,
      sidebarHeader: <p>stale</p>,
    })
    await openDrawer()
    expect((await screen.findAllByText("fresh")).length).toBeGreaterThan(0)
    expect(screen.queryByText("stale")).toBeNull()
  })

  it("renders the new footer prop name", async () => {
    renderWith(Layout, { navFooter: <p>footslot</p> })
    await openDrawer()
    expect((await screen.findAllByText("footslot")).length).toBeGreaterThan(0)
  })
})
