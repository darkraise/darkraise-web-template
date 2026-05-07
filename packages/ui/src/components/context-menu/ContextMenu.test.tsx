import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@components/context-menu"

function Basic({
  onChange,
  onSelect,
}: {
  onChange?: (open: boolean) => void
  onSelect?: () => void
} = {}) {
  return (
    <ContextMenu onOpenChange={onChange}>
      <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={onSelect}>Edit</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled>Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

describe("ContextMenu", () => {
  it("does not render content while closed", () => {
    render(<Basic />)
    expect(screen.queryByRole("menu")).toBeNull()
  })

  it("opens on right-click of trigger", async () => {
    const onOpenChange = vi.fn()
    render(<Basic onChange={onOpenChange} />)
    const trigger = screen.getByText("Right-click here")
    fireEvent.contextMenu(trigger, { clientX: 100, clientY: 200 })
    expect(await screen.findByRole("menu")).toBeInTheDocument()
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it("escape closes the menu", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Basic onChange={onOpenChange} />)
    const trigger = screen.getByText("Right-click here")
    fireEvent.contextMenu(trigger, { clientX: 100, clientY: 200 })
    await screen.findByRole("menu")
    await user.keyboard("{Escape}")
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it("clicking item triggers select", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<Basic onSelect={onSelect} />)
    fireEvent.contextMenu(screen.getByText("Right-click here"))
    await screen.findByRole("menu")
    await user.click(screen.getByRole("menuitem", { name: "Edit" }))
    expect(onSelect).toHaveBeenCalled()
  })

  it("disabled item is marked aria-disabled", async () => {
    render(<Basic />)
    fireEvent.contextMenu(screen.getByText("Right-click here"))
    const del = await screen.findByRole("menuitem", { name: "Delete" })
    expect(del).toHaveAttribute("aria-disabled", "true")
  })
})
