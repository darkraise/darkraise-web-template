import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
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

  it("forwards surface to the root surface", () => {
    const { container } = render(
      <Command surface="page">
        <CommandInput placeholder="Type..." aria-label="Search" />
        <CommandList>
          <CommandItem value="apple">Apple</CommandItem>
        </CommandList>
      </Command>,
    )
    expect(container.firstChild).toHaveAttribute("data-surface-fill", "page")
  })

  it("emits the attribute for card, so it overrides an ancestor", () => {
    const { container } = render(
      <Command surface="card">
        <CommandInput placeholder="Type..." aria-label="Search" />
        <CommandList>
          <CommandItem value="apple">Apple</CommandItem>
        </CommandList>
      </Command>,
    )
    expect(container.firstChild).toHaveAttribute("data-surface-fill", "card")
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
    expect(body).toMatch(/--field-py/)
  })
})

describe("Command disabled item", () => {
  it("ignores a click", () => {
    const onSelect = vi.fn()
    render(
      <Command>
        <CommandInput aria-label="Search" />
        <CommandList>
          <CommandItem value="apple" disabled onSelect={onSelect}>
            Apple
          </CommandItem>
        </CommandList>
      </Command>,
    )
    fireEvent.click(screen.getByRole("option", { name: "Apple" }))
    expect(onSelect).not.toHaveBeenCalled()
  })
})

describe("Command item registration", () => {
  function Fruits({ appleDisabled = false }: { appleDisabled?: boolean }) {
    return (
      <Command>
        <CommandInput aria-label="Search" />
        <CommandList>
          <CommandItem value="apple" disabled={appleDisabled}>
            Apple
          </CommandItem>
          <CommandItem value="banana">Banana</CommandItem>
          <CommandItem value="cherry">Cherry</CommandItem>
        </CommandList>
      </Command>
    )
  }

  function activeOption() {
    const id = screen
      .getByRole("combobox")
      .getAttribute("aria-activedescendant")
    return id ? document.getElementById(id) : null
  }

  it("follows an item's disabled state when it changes after mount", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Fruits appleDisabled />)
    const appleId = screen.getByRole("option", { name: "Apple" }).id
    expect(activeOption()).toHaveTextContent("Banana")

    rerender(<Fruits />)
    await user.click(screen.getByRole("combobox"))
    await user.keyboard("{Home}")
    expect(activeOption()).toHaveAttribute("id", appleId)
    await user.keyboard("{ArrowDown}")
    expect(activeOption()).toHaveTextContent("Banana")
    await user.keyboard("{ArrowDown}")
    expect(activeOption()).toHaveTextContent("Cherry")
    // "a" hides only Cherry, so the first enabled match becomes active.
    await user.keyboard("a")
    expect(activeOption()).toHaveAttribute("id", appleId)

    await user.keyboard("{Backspace}")
    rerender(<Fruits appleDisabled />)
    await user.keyboard("{Home}")
    expect(activeOption()).toHaveAttribute("id", appleId)
    await user.keyboard("{End}a")
    expect(activeOption()).toHaveTextContent("Banana")
  })

  it("filters an item without a value by its current text", async () => {
    const user = userEvent.setup()
    function Labelled({ label }: { label: string }) {
      return (
        <Command>
          <CommandInput aria-label="Search" />
          <CommandList>
            <CommandItem value="apple">Apple</CommandItem>
            <CommandItem>{label}</CommandItem>
          </CommandList>
        </Command>
      )
    }
    const { rerender } = render(<Labelled label="Banana" />)
    rerender(<Labelled label="Mango" />)
    await user.type(screen.getByRole("combobox"), "man")
    expect(screen.getAllByRole("option")).toHaveLength(1)
    expect(screen.getByRole("option")).toHaveTextContent("Mango")
  })

  it("reads the text of an item that mounts while filtered out once shown", async () => {
    const user = userEvent.setup()
    function Dynamic({ withExtra }: { withExtra: boolean }) {
      return (
        <Command>
          <CommandInput aria-label="Search" />
          <CommandList>
            <CommandItem value="apple">Apple</CommandItem>
            {withExtra ? <CommandItem>Xylophone</CommandItem> : null}
          </CommandList>
        </Command>
      )
    }
    const { rerender } = render(<Dynamic withExtra={false} />)
    const input = screen.getByRole("combobox")
    await user.type(input, "app")
    rerender(<Dynamic withExtra />)
    await user.clear(input)
    expect(screen.getAllByRole("option")).toHaveLength(2)
    await user.type(input, "xyl")
    expect(screen.getAllByRole("option")).toHaveLength(1)
    expect(screen.getByRole("option")).toHaveTextContent("Xylophone")
  })
})

describe("CommandInput ref", () => {
  it("hands the input to an object ref and a callback ref", () => {
    const objectRef = React.createRef<HTMLInputElement>()
    const callbackRef = vi.fn()
    render(
      <>
        <Command>
          <CommandInput aria-label="Object" ref={objectRef} />
        </Command>
        <Command>
          <CommandInput aria-label="Callback" ref={callbackRef} />
        </Command>
      </>,
    )
    expect(objectRef.current).toBe(
      screen.getByRole("combobox", { name: "Object" }),
    )
    expect(callbackRef).toHaveBeenLastCalledWith(
      screen.getByRole("combobox", { name: "Callback" }),
    )
  })

  it("keeps a callback ref attached while the input re-renders", async () => {
    const user = userEvent.setup()
    const callbackRef = vi.fn()
    render(
      <Command>
        <CommandInput aria-label="Search" ref={callbackRef} />
      </Command>,
    )
    await user.type(screen.getByRole("combobox"), "ab")
    expect(callbackRef).toHaveBeenCalledTimes(1)
    expect(callbackRef).not.toHaveBeenCalledWith(null)
  })
})
