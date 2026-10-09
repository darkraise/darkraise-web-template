import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@components/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/dropdown-menu"
import { Listbox, ListboxItem } from "@components/listbox"

// Items without `textValue` register the text their node renders, read from
// a ref in a layout effect. These pin that the ref is attached by then, on
// the very first render or open.
describe("registered item text", () => {
  it("Listbox typeahead matches an item's rendered text on the first render", async () => {
    const user = userEvent.setup()
    render(
      <Listbox aria-label="Fruit">
        <ListboxItem value="a">Apple</ListboxItem>
        <ListboxItem value="b">Banana</ListboxItem>
      </Listbox>,
    )
    const listbox = screen.getByRole("listbox")
    listbox.focus()
    await user.keyboard("b")
    expect(listbox).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Banana" }).id,
    )
  })

  it("Command filters an item by its rendered text on the first render", async () => {
    const user = userEvent.setup()
    render(
      <Command>
        <CommandInput aria-label="Search" />
        <CommandList>
          <CommandItem>Apple</CommandItem>
          <CommandItem>Banana</CommandItem>
        </CommandList>
      </Command>,
    )
    await user.type(screen.getByRole("combobox"), "ban")
    expect(screen.getAllByRole("option")).toHaveLength(1)
    expect(screen.getByRole("option")).toHaveTextContent("Banana")
  })

  it("DropdownMenu typeahead matches an item's rendered text on the first open", async () => {
    const user = userEvent.setup()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Copy</DropdownMenuItem>
          <DropdownMenuItem>Paste</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    await user.click(screen.getByRole("button", { name: "Open" }))
    const menu = await screen.findByRole("menu")
    await waitFor(() => expect(menu).toHaveFocus())
    fireEvent.keyDown(menu, { key: "p" })
    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "Paste" })).toHaveFocus(),
    )
  })
})
