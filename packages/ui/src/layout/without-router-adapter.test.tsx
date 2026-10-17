import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { SidebarLayout } from "@layout/sidebar"
import { TopNavLayout } from "@layout/top-nav-layout"
import { StackedLayout } from "@layout/stacked-layout"
import { SplitPanelLayout } from "@layout/split-panel-layout"
import { PageHeader } from "@layout/page-header"
import { ThemeProvider } from "@theme"
import type { LayoutProps, NavGroup } from "@layout/types"

// create-darkraise-ui generates an app with a ThemeProvider and no router, so
// every shell must mount without a RouterAdapterProvider and fall back to
// plain anchors.
const nav: NavGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Home", href: "/" },
      { label: "Reports", href: "/reports" },
    ],
  },
]

const inlineNavLayouts: [string, (props: LayoutProps) => React.ReactNode][] = [
  ["SidebarLayout", (props) => <SidebarLayout {...props} />],
  ["TopNavLayout", (props) => <TopNavLayout {...props} />],
  ["StackedLayout", (props) => <StackedLayout {...props} />],
]

function renderInTheme(ui: React.ReactNode) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

describe("layouts without a router adapter", () => {
  it.each(inlineNavLayouts)("%s renders plain nav links", (_, Layout) => {
    renderInTheme(
      <Layout nav={nav}>
        <h1>Welcome</h1>
      </Layout>,
    )

    expect(screen.getByRole("heading", { name: "Welcome" })).toBeInTheDocument()
    const reports = screen.getAllByRole("link", { name: "Reports" })[0]
    expect(reports).toHaveAttribute("href", "/reports")
  })

  // Its nav lives in the mobile drawer, so only mounting is checked here.
  it("SplitPanelLayout mounts", () => {
    renderInTheme(
      <SplitPanelLayout nav={nav} panel={<p>Panel</p>}>
        <h1>Welcome</h1>
      </SplitPanelLayout>,
    )

    expect(screen.getByRole("heading", { name: "Welcome" })).toBeInTheDocument()
    expect(screen.getByText("Panel")).toBeInTheDocument()
  })

  it("marks the browser's current path in the sidebar", () => {
    renderInTheme(
      <SidebarLayout nav={nav}>
        <h1>Welcome</h1>
      </SidebarLayout>,
    )

    const home = screen.getAllByRole("link", { name: "Home" })[0]
    expect(home).toHaveAttribute("aria-current", "page")
  })

  it("PageHeader renders breadcrumb links", () => {
    render(
      <PageHeader
        title="Report"
        breadcrumbs={[{ label: "Reports", href: "/reports" }, { label: "Q3" }]}
      />,
    )

    expect(screen.getByRole("link", { name: "Reports" })).toHaveAttribute(
      "href",
      "/reports",
    )
  })
})
