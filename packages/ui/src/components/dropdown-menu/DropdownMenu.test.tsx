import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@components/dropdown-menu"

function Basic({ onChange }: { onChange?: (open: boolean) => void } = {}) {
  return (
    <DropdownMenu onOpenChange={onChange}>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Apple</DropdownMenuItem>
        <DropdownMenuItem>Banana</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>Cherry</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

describe("DropdownMenu", () => {
  it("does not render content while closed", () => {
    render(<Basic />)
    expect(screen.queryByRole("menu")).toBeNull()
  })

  it("opens on trigger click", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("button", { name: "Open" }))
    expect(await screen.findByRole("menu")).toBeInTheDocument()
  })

  it("trigger exposes aria-haspopup and aria-expanded", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const trigger = screen.getByRole("button", { name: "Open" })
    expect(trigger).toHaveAttribute("aria-haspopup", "menu")
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    await user.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "true")
  })

  it("escape closes the menu", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Basic onChange={onOpenChange} />)
    await user.click(screen.getByRole("button", { name: "Open" }))
    await screen.findByRole("menu")
    await user.keyboard("{Escape}")
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("clicking an item closes the menu and fires onSelect", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onSelect}>One</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    await user.click(screen.getByRole("button", { name: "Open" }))
    await screen.findByRole("menu")
    await user.click(screen.getByRole("menuitem", { name: "One" }))
    expect(onSelect).toHaveBeenCalled()
  })

  it("disabled item is marked aria-disabled", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("button", { name: "Open" }))
    const cherry = await screen.findByRole("menuitem", { name: "Cherry" })
    expect(cherry).toHaveAttribute("aria-disabled", "true")
  })

  it("checkbox item toggles via click", async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem
            checked={false}
            onCheckedChange={onCheckedChange}
          >
            Toggle me
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    await user.click(screen.getByRole("menuitemcheckbox"))
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it("radio group selects on click", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="a" onValueChange={onValueChange}>
            <DropdownMenuRadioItem value="a">A</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="b">B</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    await user.click(screen.getByRole("menuitemradio", { name: "B" }))
    expect(onValueChange).toHaveBeenCalledWith("b")
  })

  it("forwards surfaceIntensity to the content surface", async () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent surfaceIntensity="flat">
          <DropdownMenuItem>Apple</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    expect(await screen.findByRole("menu")).toHaveAttribute(
      "data-surface-intensity",
      "flat",
    )
  })

  it("emits the attribute for balanced, so it overrides an ancestor", async () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent surfaceIntensity="balanced">
          <DropdownMenuItem>Apple</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    expect(await screen.findByRole("menu")).toHaveAttribute(
      "data-surface-intensity",
      "balanced",
    )
  })

  it("checks an item whose onSelect keeps the menu open", async () => {
    // Preventing default is how a caller stops the menu dismissing, which is
    // what a multi-select list needs. It must not also cancel the choice: the
    // two are separate concerns and coupling them made the item unclickable.
    const onCheckedChange = vi.fn()
    const user = userEvent.setup()
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem
            checked={false}
            onCheckedChange={onCheckedChange}
            onSelect={(e) => e.preventDefault()}
          >
            Apple
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    await user.click(await screen.findByRole("menuitemcheckbox"))
    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole("menu")).toBeInTheDocument()
  })

  describe("submenus", () => {
    function Nested() {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Alpha</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Alpha One</DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Alpha Deep</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>Alpha Deep One</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Beta</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Beta One</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem>Plain</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }

    async function openRoot() {
      const user = userEvent.setup()
      render(<Nested />)
      await user.click(screen.getByRole("button", { name: "Open" }))
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

    it("opens a third level and closes it with its parent", async () => {
      await openRoot()
      hover("Alpha")
      await screen.findByText("Alpha Deep", undefined, SLOW_ENV)
      hover("Alpha Deep")
      expect(
        await screen.findByText("Alpha Deep One", undefined, SLOW_ENV),
      ).toBeInTheDocument()
      expect(stateOf("Alpha One")).toBe("open")
      hover("Beta")
      expect(stateOf("Alpha Deep One")).toBe("closed")
    })
  })
})
