import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
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

  it("forwards surfaceIntensity to the content surface", async () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
        <ContextMenuContent surfaceIntensity="flat">
          <ContextMenuItem>Edit</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    )
    fireEvent.contextMenu(screen.getByText("Right-click here"))
    expect(await screen.findByRole("menu")).toHaveAttribute(
      "data-surface-intensity",
      "flat",
    )
  })

  it("emits the attribute for balanced, so it overrides an ancestor", async () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
        <ContextMenuContent surfaceIntensity="balanced">
          <ContextMenuItem>Edit</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    )
    fireEvent.contextMenu(screen.getByText("Right-click here"))
    expect(await screen.findByRole("menu")).toHaveAttribute(
      "data-surface-intensity",
      "balanced",
    )
  })

  describe("submenus", () => {
    function Nested() {
      return (
        <ContextMenu>
          <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Alpha</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>Alpha One</ContextMenuItem>
                <ContextMenuSub>
                  <ContextMenuSubTrigger>Alpha Deep</ContextMenuSubTrigger>
                  <ContextMenuSubContent>
                    <ContextMenuItem>Alpha Deep One</ContextMenuItem>
                  </ContextMenuSubContent>
                </ContextMenuSub>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Beta</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>Beta One</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuItem>Plain</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )
    }

    async function openRoot() {
      render(<Nested />)
      fireEvent.contextMenu(screen.getByText("Right-click here"), {
        clientX: 10,
        clientY: 10,
      })
      await screen.findByRole("menu")
    }

    // The full suite runs 174 jsdom environments in parallel; the portal's
    // one-tick mount deferral can land outside findBy's 1s default when the
    // workers thrash. The behaviour under test is not timing-sensitive.
    const SLOW_ENV = { timeout: 5000 }

    function hover(label: string) {
      fireEvent.pointerEnter(screen.getByText(label))
    }

    // A closed submenu may still be in the DOM (Presence holds it for the
    // exit animation) or already gone, depending on how fast the run is.
    // Both mean "not showing", so an absent node reads as closed.
    function stateOf(text: string) {
      const node = screen.queryByText(text)
      if (!node) return "closed"
      return node.closest("[role='menu']")?.getAttribute("data-state")
    }

    it("opens a submenu on sub-trigger hover", async () => {
      await openRoot()
      hover("Alpha")
      expect(
        await screen.findByText("Alpha One", undefined, SLOW_ENV),
      ).toBeInTheDocument()
      expect(stateOf("Alpha One")).toBe("open")
    })

    it("hovering a sibling sub-trigger closes the open submenu", async () => {
      await openRoot()
      hover("Alpha")
      await screen.findByText("Alpha One", undefined, SLOW_ENV)
      hover("Beta")
      await screen.findByText("Beta One", undefined, SLOW_ENV)
      expect(stateOf("Beta One")).toBe("open")
      expect(stateOf("Alpha One")).toBe("closed")
    })

    it("hovering a plain item closes the open submenu", async () => {
      await openRoot()
      hover("Alpha")
      await screen.findByText("Alpha One", undefined, SLOW_ENV)
      hover("Plain")
      expect(stateOf("Alpha One")).toBe("closed")
    })

    it("keeps a submenu open while the pointer moves within it", async () => {
      await openRoot()
      hover("Alpha")
      await screen.findByText("Alpha One", undefined, SLOW_ENV)
      hover("Alpha One")
      expect(stateOf("Alpha One")).toBe("open")
    })

    it("opens a third level nested inside a submenu", async () => {
      await openRoot()
      hover("Alpha")
      await screen.findByText("Alpha Deep", undefined, SLOW_ENV)
      hover("Alpha Deep")
      expect(
        await screen.findByText("Alpha Deep One", undefined, SLOW_ENV),
      ).toBeInTheDocument()
      expect(stateOf("Alpha Deep One")).toBe("open")
      // The level above stays open behind it.
      expect(stateOf("Alpha One")).toBe("open")
    })

    it("closing a submenu closes the deeper level it contained", async () => {
      await openRoot()
      hover("Alpha")
      await screen.findByText("Alpha Deep", undefined, SLOW_ENV)
      hover("Alpha Deep")
      await screen.findByText("Alpha Deep One", undefined, SLOW_ENV)
      hover("Beta")
      expect(stateOf("Alpha Deep One")).toBe("closed")
    })

    it("selecting an item inside a submenu closes the whole tree", async () => {
      await openRoot()
      hover("Alpha")
      fireEvent.click(await screen.findByText("Alpha One", undefined, SLOW_ENV))
      expect(
        screen
          .queryAllByRole("menu")
          .every((m) => m.getAttribute("data-state") === "closed"),
      ).toBe(true)
    })
  })
})
