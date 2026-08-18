import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { RouterAdapterProvider } from "@router"
import type { RouterAdapter, RouterLinkProps } from "@router"
import { MobileDrawer } from "./MobileDrawer"
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

function renderDrawer(
  props: Partial<React.ComponentProps<typeof MobileDrawer>>,
) {
  return render(
    <RouterAdapterProvider value={adapter}>
      <MobileDrawer nav={nav} {...props} />
    </RouterAdapterProvider>,
  )
}

describe("MobileDrawer", () => {
  it("renders the nav tree", async () => {
    const user = userEvent.setup()
    renderDrawer({})
    await user.click(screen.getByRole("button", { name: /open menu/i }))
    expect(await screen.findByText("Dashboard")).toBeInTheDocument()
  })

  // The `aside` the drawer stands in for is display:none below md, so anything
  // that lives only in the sidebar footer is unreachable on small screens
  // unless the drawer can carry it too.
  it("carries the sidebar footer and header slots", async () => {
    const user = userEvent.setup()
    renderDrawer({
      header: <span>Workspace picker</span>,
      footer: <button type="button">Log out</button>,
    })
    await user.click(screen.getByRole("button", { name: /open menu/i }))
    expect(await screen.findByText("Workspace picker")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument()
  })

  it("renders extra children after the nav", async () => {
    const user = userEvent.setup()
    renderDrawer({ children: <span>Extra</span> })
    await user.click(screen.getByRole("button", { name: /open menu/i }))
    expect(await screen.findByText("Extra")).toBeInTheDocument()
  })

  it("accepts a custom title and trigger label", async () => {
    const user = userEvent.setup()
    renderDrawer({ title: "Main menu", triggerLabel: "Show navigation" })
    await user.click(screen.getByRole("button", { name: "Show navigation" }))
    expect(await screen.findByText("Main menu")).toBeInTheDocument()
  })

  // The drawer replaces the rail below md, so an indicator style set on the
  // layout has to reach here too or the two disagree at the breakpoint.
  it("passes the active-item indicator through to the nav", async () => {
    const user = userEvent.setup()
    renderDrawer({ activeBar: "ring" })
    await user.click(screen.getByRole("button", { name: /open menu/i }))
    const nav = await screen.findByRole("navigation")
    expect(nav.dataset.activeBar).toBe("ring")
  })

  it("leaves the indicator unset when no style is given", async () => {
    const user = userEvent.setup()
    renderDrawer({})
    await user.click(screen.getByRole("button", { name: /open menu/i }))
    const nav = await screen.findByRole("navigation")
    expect(nav.dataset.activeBar).toBeUndefined()
  })
})
