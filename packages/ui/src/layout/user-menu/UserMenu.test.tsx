import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { useLayoutStore } from "@layout/layoutStore"
import { UserMenu } from "./UserMenu"

function openMenu(container: HTMLElement) {
  const trigger = container.querySelector<HTMLElement>(".dr-user-menu-trigger")
  if (!trigger) throw new Error("no user menu trigger")
  fireEvent.click(trigger)
}

describe("UserMenu", () => {
  beforeEach(() =>
    useLayoutStore.setState({ layout: "sidebar", shellStyle: null }),
  )

  it("names its trigger Account menu rather than the initials", () => {
    render(<UserMenu user={{ name: "Jane Doe", email: "jane@example.com" }} />)
    expect(
      screen.getByRole("button", { name: "Account menu" }),
    ).toHaveTextContent("JD")
  })

  it("offers no Layout entry without layoutSwitcher", () => {
    const { container } = render(<UserMenu onLogout={() => {}} />)
    openMenu(container)
    expect(screen.queryByRole("menuitem", { name: "Layout" })).toBeNull()
  })

  it("offers the layout choices in a Layout submenu", () => {
    const { container } = render(
      <UserMenu
        onLogout={() => {}}
        layoutSwitcher={{ variants: ["sidebar", "top-nav"] }}
      />,
    )
    openMenu(container)
    const entry = screen.getByRole("menuitem", { name: "Layout" })
    expect(entry).toHaveClass("dr-user-menu-layout")
    fireEvent.click(entry)
    expect(screen.queryByRole("menuitem", { name: "Split Panel" })).toBeNull()
    expect(screen.getAllByRole("menuitemradio")).toHaveLength(6)
    fireEvent.click(screen.getByRole("menuitem", { name: "Top Navigation" }))
    expect(useLayoutStore.getState().layout).toBe("top-nav")
  })

  it("leaves the shell styles out when the layout pins one", () => {
    const { container } = render(
      <UserMenu layoutSwitcher={{ shellStylePinned: true }} />,
    )
    openMenu(container)
    fireEvent.click(screen.getByRole("menuitem", { name: "Layout" }))
    expect(
      screen.getByRole("menuitem", { name: "Split Panel" }),
    ).toBeInTheDocument()
    expect(screen.queryAllByRole("menuitemradio")).toHaveLength(0)
  })

  it("marks the separator before Log out when Layout is its only neighbour", () => {
    const { container } = render(
      <UserMenu onLogout={() => {}} layoutSwitcher={{}} />,
    )
    openMenu(container)
    expect(screen.getByRole("separator")).toHaveClass(
      "dr-user-menu-layout-separator",
    )
  })

  it("leaves the separator unmarked when Settings precedes it", () => {
    const { container } = render(
      <UserMenu
        onSettings={() => {}}
        onLogout={() => {}}
        layoutSwitcher={{}}
      />,
    )
    openMenu(container)
    expect(screen.getByRole("separator")).not.toHaveClass(
      "dr-user-menu-layout-separator",
    )
  })
})
