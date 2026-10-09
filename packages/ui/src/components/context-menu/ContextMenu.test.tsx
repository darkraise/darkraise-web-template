import {
  createEvent,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, it, expect, vi } from "vitest"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuCheckboxItem,
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

  it("shows a menu opened without a pointer", async () => {
    render(
      <ContextMenu defaultOpen>
        <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Edit</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    )
    const menu = await screen.findByRole("menu")
    expect(menu).not.toHaveStyle({ visibility: "hidden" })
    await waitFor(() => expect(menu).toHaveFocus())
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

  it("forwards surface to the content surface", async () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
        <ContextMenuContent surface="page">
          <ContextMenuItem>Edit</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    )
    fireEvent.contextMenu(screen.getByText("Right-click here"))
    expect(await screen.findByRole("menu")).toHaveAttribute(
      "data-surface-fill",
      "page",
    )
  })

  it("emits the attribute for card, so it overrides an ancestor", async () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
        <ContextMenuContent surface="card">
          <ContextMenuItem>Edit</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    )
    fireEvent.contextMenu(screen.getByText("Right-click here"))
    expect(await screen.findByRole("menu")).toHaveAttribute(
      "data-surface-fill",
      "card",
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

describe("ContextMenuCheckboxItem mark", () => {
  function marks(item: Element): string[] {
    return [...item.querySelectorAll("svg.lucide-check, svg.lucide-minus")].map(
      (svg) => (svg.classList.contains("lucide-minus") ? "minus" : "check"),
    )
  }

  it.each([
    [true, ["check"]],
    ["indeterminate", ["minus"]],
    [false, []],
  ] as const)("checked=%s draws %j", async (checked, expected) => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuCheckboxItem checked={checked}>
            Apple
          </ContextMenuCheckboxItem>
        </ContextMenuContent>
      </ContextMenu>,
    )
    fireEvent.contextMenu(screen.getByText("Right-click here"), {
      clientX: 100,
      clientY: 200,
    })
    expect(marks(await screen.findByRole("menuitemcheckbox"))).toEqual(expected)
  })
})

describe("ContextMenu disabled item", () => {
  it("ignores click, Enter and Space", async () => {
    const onSelect = vi.fn()
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem disabled onSelect={onSelect}>
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    )
    fireEvent.contextMenu(screen.getByText("Right-click here"))
    const del = await screen.findByRole("menuitem", { name: "Delete" })
    fireEvent.click(del)
    fireEvent.keyDown(del, { key: "Enter" })
    fireEvent.keyDown(del, { key: " " })
    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.getByRole("menu")).toBeInTheDocument()
  })
})

describe("ContextMenu disabled item and sub-trigger", () => {
  it("does not follow a disabled asChild link", async () => {
    const onSelect = vi.fn()
    const onLinkClick = vi.fn()
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem disabled asChild onSelect={onSelect}>
            <a href="#target" onClick={onLinkClick}>
              Docs
            </a>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    )
    fireEvent.contextMenu(screen.getByText("Right-click here"))
    const link = await screen.findByRole("menuitem", { name: "Docs" })
    const click = createEvent.click(link)
    fireEvent(link, click)
    expect(click.defaultPrevented).toBe(true)
    expect(onSelect).not.toHaveBeenCalled()
    expect(onLinkClick).not.toHaveBeenCalled()
  })

  it("blocks a middle-click on a disabled asChild link only", async () => {
    const onAuxClick = vi.fn()
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem disabled asChild onAuxClick={onAuxClick}>
            <a href="#docs">Docs</a>
          </ContextMenuItem>
          <ContextMenuItem asChild>
            <a href="#blog">Blog</a>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    )
    fireEvent.contextMenu(screen.getByText("Right-click here"))
    const docs = await screen.findByRole("menuitem", { name: "Docs" })
    const blog = screen.getByRole("menuitem", { name: "Blog" })
    const middle = () =>
      new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 })
    const blocked = middle()
    fireEvent(docs, blocked)
    expect(onAuxClick).toHaveBeenCalledTimes(1)
    expect(blocked.defaultPrevented).toBe(true)
    const allowed = middle()
    fireEvent(blog, allowed)
    expect(allowed.defaultPrevented).toBe(false)
  })

  it("does not open a disabled sub-trigger", async () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuSub>
            <ContextMenuSubTrigger disabled>More</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>Hidden</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>,
    )
    fireEvent.contextMenu(screen.getByText("Right-click here"))
    const more = await screen.findByRole("menuitem", { name: "More" })
    fireEvent.pointerEnter(more)
    fireEvent.click(more)
    fireEvent.keyDown(more, { key: "ArrowRight" })
    fireEvent.keyDown(more, { key: "Enter" })
    expect(more).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByText("Hidden")).toBeNull()
  })
})

describe("ContextMenu direction", () => {
  it("gives the content its trigger area's direction when dir is omitted", async () => {
    render(
      <div dir="rtl">
        <Basic />
      </div>,
    )
    fireEvent.contextMenu(screen.getByText("Right-click here"))
    expect(await screen.findByRole("menu")).toHaveAttribute("dir", "rtl")
  })

  it("writes the dir prop on the trigger area and the content", async () => {
    render(
      <ContextMenu dir="rtl">
        <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Edit</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    )
    const trigger = screen.getByText("Right-click here")
    expect(trigger).toHaveAttribute("dir", "rtl")
    fireEvent.contextMenu(trigger)
    expect(await screen.findByRole("menu")).toHaveAttribute("dir", "rtl")
  })
})

describe("ContextMenu submenus under RTL", () => {
  it("open with ArrowLeft and close with ArrowRight", async () => {
    render(
      <div dir="rtl">
        <ContextMenu>
          <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger>More</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>Nested</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      </div>,
    )
    fireEvent.contextMenu(screen.getByText("Right-click here"))
    const more = await screen.findByRole("menuitem", { name: "More" })
    fireEvent.keyDown(more, { key: "ArrowRight" })
    expect(more).toHaveAttribute("aria-expanded", "false")
    fireEvent.keyDown(more, { key: "ArrowLeft" })
    expect(more).toHaveAttribute("aria-expanded", "true")
    const nested = await screen.findByRole("menuitem", { name: "Nested" })
    fireEvent.keyDown(nested, { key: "ArrowRight" })
    expect(more).toHaveAttribute("aria-expanded", "false")
  })
})

describe("ContextMenu sub-trigger keys", () => {
  async function openMenu() {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Copy</ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>Email</ContextMenuItem>
              <ContextMenuItem>Link</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuItem>Last</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    )
    fireEvent.contextMenu(screen.getByText("Right-click here"), {
      clientX: 10,
      clientY: 10,
    })
    return screen.findByRole("menu")
  }

  it("ArrowDown from the item before a sub-trigger focuses the sub-trigger", async () => {
    const menu = await openMenu()
    const copy = screen.getByRole("menuitem", { name: "Copy" })
    fireEvent.keyDown(menu, { key: "Home" })
    await waitFor(() => expect(copy).toHaveFocus())
    fireEvent.keyDown(copy, { key: "ArrowDown" })
    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "Share" })).toHaveFocus(),
    )
  })

  it("ArrowRight on a sub-trigger focuses the first submenu item", async () => {
    await openMenu()
    const share = screen.getByRole("menuitem", { name: "Share" })
    share.focus()
    fireEvent.keyDown(share, { key: "ArrowRight" })
    const email = await screen.findByRole("menuitem", { name: "Email" })
    await waitFor(() => expect(email).toHaveFocus())
  })
})

describe("ContextMenu item disabled after mount", () => {
  function Menu({ disabled }: { disabled: boolean }) {
    return (
      <ContextMenu>
        <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Copy</ContextMenuItem>
          <ContextMenuItem disabled={disabled}>Paste</ContextMenuItem>
          <ContextMenuItem>Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  it("arrow keys skip an item disabled after mount and reach it once enabled", async () => {
    const { rerender } = render(<Menu disabled={false} />)
    fireEvent.contextMenu(screen.getByText("Right-click here"), {
      clientX: 10,
      clientY: 10,
    })
    const menu = await screen.findByRole("menu")
    const copy = screen.getByRole("menuitem", { name: "Copy" })
    const paste = screen.getByRole("menuitem", { name: "Paste" })
    const del = screen.getByRole("menuitem", { name: "Delete" })

    fireEvent.keyDown(menu, { key: "Home" })
    await waitFor(() => expect(copy).toHaveFocus())
    fireEvent.keyDown(copy, { key: "ArrowDown" })
    await waitFor(() => expect(paste).toHaveFocus())

    rerender(<Menu disabled />)
    expect(screen.getByRole("menuitem", { name: "Paste" })).toBe(paste)
    fireEvent.keyDown(menu, { key: "Home" })
    await waitFor(() => expect(copy).toHaveFocus())
    fireEvent.keyDown(copy, { key: "ArrowDown" })
    await waitFor(() => expect(del).toHaveFocus())

    rerender(<Menu disabled={false} />)
    expect(screen.getByRole("menuitem", { name: "Paste" })).toBe(paste)
    fireEvent.keyDown(menu, { key: "Home" })
    await waitFor(() => expect(copy).toHaveFocus())
    fireEvent.keyDown(copy, { key: "ArrowDown" })
    await waitFor(() => expect(paste).toHaveFocus())
  })
})

describe("ContextMenu item text changed after mount", () => {
  function Menu({ label }: { label: string }) {
    return (
      <ContextMenu>
        <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Copy</ContextMenuItem>
          <ContextMenuItem>{label}</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  it("typeahead finds an item by its new text, not its old one", async () => {
    const { rerender } = render(<Menu label="Paste" />)
    fireEvent.contextMenu(screen.getByText("Right-click here"), {
      clientX: 10,
      clientY: 10,
    })
    const menu = await screen.findByRole("menu")
    await waitFor(() => expect(menu).toHaveFocus())
    rerender(<Menu label="Rename" />)
    const renamed = screen.getByRole("menuitem", { name: "Rename" })

    fireEvent.keyDown(menu, { key: "p" })
    expect(renamed).not.toHaveFocus()
    await new Promise((resolve) => setTimeout(resolve, 600))
    fireEvent.keyDown(menu, { key: "r" })
    await waitFor(() => expect(renamed).toHaveFocus())
  })
})

describe("ContextMenu opened through its props", () => {
  function Harness() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Show menu
        </button>
        <ContextMenu open={open} onOpenChange={setOpen}>
          <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
          {/* jsdom's viewport has no size, so collision handling would move the menu. */}
          <ContextMenuContent avoidCollisions={false}>
            <ContextMenuItem>Edit</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </>
    )
  }

  it("anchors to its trigger, not the pointer of an earlier right-click", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const trigger = screen.getByText("Right-click here")
    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue(
      DOMRect.fromRect({ x: 200, y: 100, width: 80, height: 20 }),
    )

    fireEvent.contextMenu(trigger, { clientX: 10, clientY: 10 })
    const atPointer = await screen.findByRole("menu")
    await waitFor(() =>
      expect(atPointer).toHaveStyle({ left: "10px", top: "10px" }),
    )
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())

    await user.click(screen.getByRole("button", { name: "Show menu" }))
    const atTrigger = await screen.findByRole("menu")
    await waitFor(() =>
      expect(atTrigger).toHaveStyle({ left: "200px", top: "120px" }),
    )
  })
})
