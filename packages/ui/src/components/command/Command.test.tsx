import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import {
  Command,
  CommandDialog,
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

  it("forwards surfaceIntensity to the root surface", () => {
    const { container } = render(
      <Command surfaceIntensity="flat">
        <CommandInput placeholder="Type..." aria-label="Search" />
        <CommandList>
          <CommandItem value="apple">Apple</CommandItem>
        </CommandList>
      </Command>,
    )
    expect(container.firstChild).toHaveAttribute(
      "data-surface-intensity",
      "flat",
    )
  })

  it("emits the attribute for balanced, so it overrides an ancestor", () => {
    const { container } = render(
      <Command surfaceIntensity="balanced">
        <CommandInput placeholder="Type..." aria-label="Search" />
        <CommandList>
          <CommandItem value="apple">Apple</CommandItem>
        </CommandList>
      </Command>,
    )
    expect(container.firstChild).toHaveAttribute(
      "data-surface-intensity",
      "balanced",
    )
  })
})

describe("CommandDialog close-button alignment", () => {
  const commandCss = readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), "command.css"),
    "utf8",
  )

  /** Body of the first rule matching `selector`, or "" when absent. */
  function ruleBody(selector: RegExp): string {
    return commandCss.match(selector)?.[1] ?? ""
  }

  it("tags the dialog surface so the close button can be re-aligned", () => {
    render(
      <CommandDialog open>
        <CommandInput placeholder="Type..." aria-label="Search" />
        <CommandList />
      </CommandDialog>,
    )
    // The re-alignment is a child-combinator override, so the button has to
    // be a direct child of the tagged surface for the `>` selector to match.
    expect(
      document.querySelector(
        ".dr-command-dialog-content > .dr-overlay-close-btn",
      ),
    ).not.toBeNull()
  })

  it("re-centres the close button on the search row instead of top-4", () => {
    const body = ruleBody(
      /\.dr-command-dialog-content\s*>\s*\.dr-overlay-close-btn\s*\{([^}]*)\}/,
    )
    expect(body).toMatch(/top:\s*calc\([^;]*--dr-command-row-h/)
  })

  it("derives the search-row height from the font-size and density axes", () => {
    const body = ruleBody(/\.dr-command-dialog-content\s*\{([^}]*)\}/)
    // A fixed px height here would drift the moment either axis moves.
    expect(body).toMatch(/--dr-command-row-h:/)
    expect(body).toMatch(/--text-sm/)
    expect(body).toMatch(/--density-input-py/)
  })
})
