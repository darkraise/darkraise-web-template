import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
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

function renderLayout() {
  return render(
    <RouterAdapterProvider value={adapter}>
      <SidebarLayout nav={nav} showThemeSwitcher={false}>
        <div>Content</div>
      </SidebarLayout>
    </RouterAdapterProvider>,
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
