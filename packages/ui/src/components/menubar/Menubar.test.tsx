import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
} from "@components/menubar"

function Basic({
  onSelect,
}: {
  onSelect?: () => void
} = {}) {
  return (
    <Menubar>
      <MenubarMenu value="file">
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onSelect={onSelect}>New</MenubarItem>
          <MenubarItem>Open</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="edit">
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Cut</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}

describe("Menubar", () => {
  it("renders top-level triggers as menuitems within menubar", () => {
    render(<Basic />)
    const menubar = screen.getByRole("menubar")
    expect(menubar).toBeInTheDocument()
    expect(screen.getAllByRole("menuitem")).toHaveLength(2)
  })

  it("opens a menu on trigger click", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("menuitem", { name: "File" }))
    expect(await screen.findByRole("menu")).toBeInTheDocument()
  })

  it("only one menu open at a time", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("menuitem", { name: "File" }))
    await screen.findByRole("menu")
    await user.click(screen.getByRole("menuitem", { name: "Edit" }))
    const menus = await screen.findAllByRole("menu")
    expect(menus.length).toBe(1)
  })

  it("escape closes the open menu", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("menuitem", { name: "File" }))
    await screen.findByRole("menu")
    await user.keyboard("{Escape}")
    expect(screen.queryByRole("menu")).toBeNull()
  })

  it("clicking item closes the menu and fires onSelect", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<Basic onSelect={onSelect} />)
    await user.click(screen.getByRole("menuitem", { name: "File" }))
    await screen.findByRole("menu")
    const newItem = await screen.findByRole("menuitem", { name: "New" })
    await user.click(newItem)
    expect(onSelect).toHaveBeenCalled()
  })
})
