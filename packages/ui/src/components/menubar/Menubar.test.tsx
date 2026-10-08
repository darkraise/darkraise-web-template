import {
  createEvent,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarCheckboxItem,
  MenubarItem,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
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
    // The outgoing menu stays mounted with data-state="closed" until Presence
    // releases it on the next frame, so assert on the open one and wait for
    // the other to leave rather than counting nodes synchronously.
    await waitFor(() => {
      const menus = screen.getAllByRole("menu")
      expect(menus.length).toBe(1)
      expect(menus[0]).toHaveAttribute("data-state", "open")
    })
  })

  it("escape closes the open menu", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("menuitem", { name: "File" }))
    await screen.findByRole("menu")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
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

  it("forwards surface to the content surface", async () => {
    const user = userEvent.setup()
    render(
      <Menubar>
        <MenubarMenu value="file">
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent surface="page">
            <MenubarItem>New</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    )
    await user.click(screen.getByRole("menuitem", { name: "File" }))
    expect(await screen.findByRole("menu")).toHaveAttribute(
      "data-surface-fill",
      "page",
    )
  })

  it("emits the attribute for card, so it overrides an ancestor", async () => {
    const user = userEvent.setup()
    render(
      <Menubar>
        <MenubarMenu value="file">
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent surface="card">
            <MenubarItem>New</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    )
    await user.click(screen.getByRole("menuitem", { name: "File" }))
    expect(await screen.findByRole("menu")).toHaveAttribute(
      "data-surface-fill",
      "card",
    )
  })
})

describe("MenubarCheckboxItem mark", () => {
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
    const user = userEvent.setup()
    render(
      <Menubar>
        <MenubarMenu value="view">
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem checked={checked}>
              Status bar
            </MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    )
    await user.click(screen.getByRole("menuitem", { name: "View" }))
    expect(marks(await screen.findByRole("menuitemcheckbox"))).toEqual(expected)
  })
})

describe("Menubar disabled item", () => {
  it("ignores click, Enter and Space", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <Menubar>
        <MenubarMenu value="file">
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem disabled onSelect={onSelect}>
              Close
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    )
    await user.click(screen.getByRole("menuitem", { name: "File" }))
    const close = await screen.findByRole("menuitem", { name: "Close" })
    fireEvent.click(close)
    fireEvent.keyDown(close, { key: "Enter" })
    fireEvent.keyDown(close, { key: " " })
    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.getByRole("menu")).toBeInTheDocument()
  })
})

describe("Menubar disabled item and sub-trigger", () => {
  it("does not follow a disabled asChild link", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onLinkClick = vi.fn()
    render(
      <Menubar>
        <MenubarMenu value="file">
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem disabled asChild onSelect={onSelect}>
              <a href="#target" onClick={onLinkClick}>
                Docs
              </a>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    )
    await user.click(screen.getByRole("menuitem", { name: "File" }))
    const link = await screen.findByRole("menuitem", { name: "Docs" })
    const click = createEvent.click(link)
    fireEvent(link, click)
    expect(click.defaultPrevented).toBe(true)
    expect(onSelect).not.toHaveBeenCalled()
    expect(onLinkClick).not.toHaveBeenCalled()
  })

  it("blocks a middle-click on a disabled asChild link only", async () => {
    const user = userEvent.setup()
    const onAuxClick = vi.fn()
    render(
      <Menubar>
        <MenubarMenu value="file">
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem disabled asChild onAuxClick={onAuxClick}>
              <a href="#docs">Docs</a>
            </MenubarItem>
            <MenubarItem asChild>
              <a href="#blog">Blog</a>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    )
    await user.click(screen.getByRole("menuitem", { name: "File" }))
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
    const user = userEvent.setup()
    render(
      <Menubar>
        <MenubarMenu value="file">
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarSub>
              <MenubarSubTrigger disabled>More</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>Hidden</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    )
    await user.click(screen.getByRole("menuitem", { name: "File" }))
    const more = await screen.findByRole("menuitem", { name: "More" })
    fireEvent.pointerEnter(more)
    fireEvent.click(more)
    fireEvent.keyDown(more, { key: "ArrowRight" })
    fireEvent.keyDown(more, { key: "Enter" })
    expect(more).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByText("Hidden")).toBeNull()
  })
})

describe("Menubar direction", () => {
  it("gives the content its trigger's direction", async () => {
    const user = userEvent.setup()
    render(
      <div dir="rtl">
        <Basic />
      </div>,
    )
    await user.click(screen.getByRole("menuitem", { name: "File" }))
    expect(await screen.findByRole("menu")).toHaveAttribute("dir", "rtl")
  })
})

describe("Menubar keys under RTL", () => {
  it("moves to the next menu with ArrowLeft", async () => {
    const user = userEvent.setup()
    render(
      <div dir="rtl">
        <Menubar>
          {["File", "Edit", "View"].map((name) => (
            <MenubarMenu key={name} value={name}>
              <MenubarTrigger>{name}</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>{name} item</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          ))}
        </Menubar>
      </div>,
    )
    await user.click(screen.getByRole("menuitem", { name: "File" }))
    fireEvent.keyDown(screen.getByRole("menuitem", { name: "File" }), {
      key: "ArrowLeft",
    })
    expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveAttribute(
      "aria-expanded",
      "true",
    )
  })

  it("opens a submenu with ArrowLeft and closes it with ArrowRight", async () => {
    const user = userEvent.setup()
    render(
      <div dir="rtl">
        <Menubar>
          <MenubarMenu value="file">
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger>More</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>Nested</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>,
    )
    await user.click(screen.getByRole("menuitem", { name: "File" }))
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

describe("Menubar submenus", () => {
  function Nested() {
    return (
      <Menubar>
        <MenubarMenu value="file">
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Copy</MenubarItem>
            <MenubarSub>
              <MenubarSubTrigger>Share</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>Email</MenubarItem>
                <MenubarItem>Link</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSub>
              <MenubarSubTrigger>Export</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>PDF</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarItem>Last</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    )
  }

  async function openFile() {
    const user = userEvent.setup()
    render(<Nested />)
    await user.click(screen.getByRole("menuitem", { name: "File" }))
    return screen.findByRole("menu")
  }

  // A closed submenu may still be in the DOM (Presence holds it for the
  // exit animation) or already gone. Both mean "not showing".
  function stateOf(text: string) {
    const node = screen.queryByText(text)
    if (!node) return "closed"
    return node.closest("[role='menu']")?.getAttribute("data-state")
  }

  it("ArrowDown from the item before a sub-trigger focuses the sub-trigger", async () => {
    const menu = await openFile()
    const copy = screen.getByRole("menuitem", { name: "Copy" })
    fireEvent.keyDown(menu, { key: "Home" })
    await waitFor(() => expect(copy).toHaveFocus())
    fireEvent.keyDown(copy, { key: "ArrowDown" })
    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "Share" })).toHaveFocus(),
    )
  })

  it("ArrowRight on a sub-trigger focuses the first submenu item", async () => {
    await openFile()
    const share = screen.getByRole("menuitem", { name: "Share" })
    share.focus()
    fireEvent.keyDown(share, { key: "ArrowRight" })
    const email = await screen.findByRole("menuitem", { name: "Email" })
    await waitFor(() => expect(email).toHaveFocus())
  })

  it("opens a submenu on sub-trigger hover", async () => {
    await openFile()
    fireEvent.pointerEnter(screen.getByText("Share"))
    await screen.findByText("Email")
    expect(stateOf("Email")).toBe("open")
  })

  it("hovering a sibling sub-trigger closes the open submenu", async () => {
    await openFile()
    fireEvent.pointerEnter(screen.getByText("Share"))
    await screen.findByText("Email")
    fireEvent.pointerEnter(screen.getByText("Export"))
    await screen.findByText("PDF")
    expect(stateOf("PDF")).toBe("open")
    expect(stateOf("Email")).toBe("closed")
  })

  it("hovering a plain item closes the open submenu", async () => {
    await openFile()
    fireEvent.pointerEnter(screen.getByText("Share"))
    await screen.findByText("Email")
    fireEvent.pointerEnter(screen.getByText("Last"))
    expect(stateOf("Email")).toBe("closed")
  })
})
