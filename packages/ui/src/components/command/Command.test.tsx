import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@components/command"

function Basic({ onSelect }: { onSelect?: (v: string) => void } = {}) {
  return (
    <Command>
      <CommandInput placeholder="Type..." aria-label="Search" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Fruits">
          <CommandItem value="apple" onSelect={onSelect}>
            Apple
          </CommandItem>
          <CommandItem value="banana" onSelect={onSelect}>
            Banana
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Veggies">
          <CommandItem value="carrot" onSelect={onSelect}>
            Carrot
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

describe("Command", () => {
  it("renders the input as combobox and the list as listbox", () => {
    render(<Basic />)
    expect(screen.getByRole("combobox")).toBeInTheDocument()
    expect(screen.getByRole("listbox")).toBeInTheDocument()
    expect(screen.getAllByRole("option")).toHaveLength(3)
  })

  it("filters items by typed search", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.type(screen.getByRole("combobox"), "app")
    expect(screen.queryByRole("option", { name: "Banana" })).toBeNull()
    expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument()
  })

  it("shows the empty state when no items match", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.type(screen.getByRole("combobox"), "zzz")
    expect(screen.getByText("No results.")).toBeInTheDocument()
  })

  it("Enter triggers onSelect for the active item", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<Basic onSelect={onSelect} />)
    const input = screen.getByRole("combobox")
    await user.click(input)
    // First match is Apple by default. ArrowDown then Enter selects Banana.
    await user.keyboard("{ArrowDown}{Enter}")
    expect(onSelect).toHaveBeenCalledWith("banana")
  })

  it("clicking item triggers onSelect", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<Basic onSelect={onSelect} />)
    await user.click(screen.getByRole("option", { name: "Carrot" }))
    expect(onSelect).toHaveBeenCalledWith("carrot")
  })

  it("groups hide when no children match the search", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.type(screen.getByRole("combobox"), "carrot")
    expect(screen.queryByText("Fruits")).toBeNull()
    expect(screen.getByText("Veggies")).toBeInTheDocument()
  })
})
