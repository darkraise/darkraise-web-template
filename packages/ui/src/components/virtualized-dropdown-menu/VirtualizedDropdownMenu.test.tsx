import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import {
  VirtualizedDropdownMenu,
  VirtualizedDropdownMenuContent,
  VirtualizedDropdownMenuItem,
  VirtualizedDropdownMenuTrigger,
} from "@components/virtualized-dropdown-menu"

const ITEMS = ["Alpha", "Beta", "Gamma", "Delta"]

function Menu({
  onItemSelect,
  isItemDisabled = (item: string) => item === "Beta" || item === "Delta",
}: {
  onItemSelect?: (item: string, index: number) => void
  isItemDisabled?: (item: string, index: number) => boolean
}) {
  return (
    <VirtualizedDropdownMenu defaultOpen>
      <VirtualizedDropdownMenuTrigger>Open</VirtualizedDropdownMenuTrigger>
      <VirtualizedDropdownMenuContent
        items={ITEMS}
        onItemSelect={onItemSelect}
        isItemDisabled={isItemDisabled}
      >
        {(item, { isActive, disabled }) => (
          <VirtualizedDropdownMenuItem isActive={isActive} disabled={disabled}>
            {item}
          </VirtualizedDropdownMenuItem>
        )}
      </VirtualizedDropdownMenuContent>
    </VirtualizedDropdownMenu>
  )
}

function activeRow(menu: HTMLElement) {
  const id = menu.getAttribute("aria-activedescendant")
  return id ? document.getElementById(id) : null
}

describe("VirtualizedDropdownMenu", () => {
  it("names the highlighted row with aria-activedescendant", async () => {
    render(<Menu isItemDisabled={() => false} />)
    const menu = await screen.findByRole("menu")
    expect(menu).not.toHaveAttribute("aria-activedescendant")
    fireEvent.keyDown(menu, { key: "ArrowDown" })
    await waitFor(() => expect(activeRow(menu)).toHaveTextContent("Alpha"))
    expect(activeRow(menu)).toHaveAttribute("role", "menuitem")
    fireEvent.keyDown(menu, { key: "ArrowDown" })
    await waitFor(() => expect(activeRow(menu)).toHaveTextContent("Beta"))
  })

  it("skips disabled rows with the arrows, Home and End", async () => {
    render(<Menu />)
    const menu = await screen.findByRole("menu")
    const expectActive = (text: string) =>
      waitFor(() => expect(activeRow(menu)).toHaveTextContent(text))
    fireEvent.keyDown(menu, { key: "ArrowDown" })
    await expectActive("Alpha")
    fireEvent.keyDown(menu, { key: "ArrowDown" })
    await expectActive("Gamma")
    fireEvent.keyDown(menu, { key: "ArrowDown" })
    await expectActive("Alpha")
    fireEvent.keyDown(menu, { key: "ArrowUp" })
    await expectActive("Gamma")
    fireEvent.keyDown(menu, { key: "Home" })
    await expectActive("Alpha")
    fireEvent.keyDown(menu, { key: "End" })
    await expectActive("Gamma")
  })

  it("marks disabled rows and passes disabled to the item", async () => {
    render(<Menu />)
    const beta = await screen.findByRole("menuitem", { name: "Beta" })
    expect(beta).toHaveAttribute("aria-disabled", "true")
    expect(beta).toHaveAttribute("data-disabled")
    expect(screen.getByText("Beta")).toHaveAttribute("data-disabled")
    expect(screen.getByRole("menuitem", { name: "Alpha" })).not.toHaveAttribute(
      "aria-disabled",
    )
  })

  it("ignores a click and the pointer on a disabled row", async () => {
    const onItemSelect = vi.fn()
    render(<Menu onItemSelect={onItemSelect} />)
    const menu = await screen.findByRole("menu")
    const beta = screen.getByRole("menuitem", { name: "Beta" })
    fireEvent.mouseEnter(beta)
    expect(menu).not.toHaveAttribute("aria-activedescendant")
    fireEvent.click(beta)
    expect(onItemSelect).not.toHaveBeenCalled()
    expect(screen.getByRole("menu")).toBeInTheDocument()
  })

  it("ignores Enter on a row disabled while it is highlighted", async () => {
    const onItemSelect = vi.fn()
    const { rerender } = render(
      <Menu onItemSelect={onItemSelect} isItemDisabled={() => false} />,
    )
    const menu = await screen.findByRole("menu")
    fireEvent.keyDown(menu, { key: "ArrowDown" })
    await waitFor(() => expect(activeRow(menu)).toHaveTextContent("Alpha"))
    rerender(
      <Menu
        onItemSelect={onItemSelect}
        isItemDisabled={(item) => item === "Alpha"}
      />,
    )
    fireEvent.keyDown(menu, { key: "Enter" })
    expect(onItemSelect).not.toHaveBeenCalled()
    expect(screen.getByRole("menu")).toBeInTheDocument()
  })

  it("selects an enabled row with Enter and closes", async () => {
    const onItemSelect = vi.fn()
    render(<Menu onItemSelect={onItemSelect} />)
    const menu = await screen.findByRole("menu")
    fireEvent.keyDown(menu, { key: "ArrowDown" })
    await waitFor(() => expect(activeRow(menu)).toHaveTextContent("Alpha"))
    fireEvent.keyDown(menu, { key: "Enter" })
    expect(onItemSelect).toHaveBeenCalledWith("Alpha", 0)
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
  })
})
