import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { UiLabelsProvider } from "@labels"
import { UserMenu } from "@layout/user-menu"
import { SearchCommand } from "@layout/search-command"
import { SidebarLayout } from "@layout/sidebar"
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

describe("UserMenu labels", () => {
  it("renders English items with no provider", async () => {
    const user = userEvent.setup()
    render(<UserMenu onLogout={vi.fn()} onSettings={vi.fn()} />)
    await user.click(screen.getByRole("button"))
    expect(screen.getByText("Log out")).toBeInTheDocument()
    expect(screen.getByText("Settings")).toBeInTheDocument()
  })

  it("renders overridden items", async () => {
    const user = userEvent.setup()
    render(
      <UiLabelsProvider
        value={{ userMenu: { logout: "Đăng xuất", settings: "Cài đặt" } }}
      >
        <UserMenu onLogout={vi.fn()} onSettings={vi.fn()} />
      </UiLabelsProvider>,
    )
    await user.click(screen.getByRole("button"))
    expect(screen.getByText("Đăng xuất")).toBeInTheDocument()
    expect(screen.getByText("Cài đặt")).toBeInTheDocument()
  })
})

// The collapsed search trigger builds the same string for both aria-label
// and title from SHORTCUT_LABEL. An override that lands on only one of the
// two attributes would be invisible to a test that checks them separately —
// so this asserts them as a pair.
describe("SearchCommand labels", () => {
  it("renders the collapsed trigger's aria-label and title from the same overridden label", () => {
    render(
      <RouterAdapterProvider value={adapter}>
        <UiLabelsProvider
          value={{ layout: { searchWithShortcut: () => "Buscar (atajo)" } }}
        >
          <SearchCommand collapsed />
        </UiLabelsProvider>
      </RouterAdapterProvider>,
    )
    const trigger = screen.getByRole("button")
    const ariaLabel = trigger.getAttribute("aria-label")
    const title = trigger.getAttribute("title")
    expect(ariaLabel).toBe("Buscar (atajo)")
    expect(title).toBe(ariaLabel)
  })
})

// The sidebar toggle's aria-label is selected by a collapsed/expanded
// ternary. A flipped condition would swap the two strings and no
// string-equality test against a single state would catch it — so this
// drives the toggle through its own click handler (the only public way to
// change `collapsed`, which is internal state with no prop) and checks the
// label at both ends.
describe("SidebarLayout labels", () => {
  function renderLayout() {
    return render(
      <RouterAdapterProvider value={adapter}>
        <UiLabelsProvider
          value={{
            layout: {
              expandSidebar: "Expandir barra",
              collapseSidebar: "Contraer barra",
            },
          }}
        >
          <SidebarLayout nav={nav} showThemeSwitcher={false}>
            <div>Content</div>
          </SidebarLayout>
        </UiLabelsProvider>
      </RouterAdapterProvider>,
    )
  }

  it("reads the collapsed and expanded aria-labels from the label context", async () => {
    const user = userEvent.setup()
    renderLayout()
    const toggle = screen.getByRole("button", { name: "Contraer barra" })
    await user.click(toggle)
    expect(
      screen.getByRole("button", { name: "Expandir barra" }),
    ).toBeInTheDocument()
  })
})
