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

function headingShown(text: string): boolean {
  const heading = screen.queryByText(text)
  return heading !== null && heading.closest("[hidden]") === null
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
    expect(headingShown("Fruits")).toBe(false)
    expect(headingShown("Veggies")).toBe(true)
  })

  it("hides every group heading when the search matches nothing", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.type(screen.getByRole("combobox"), "zzz")
    expect(headingShown("Fruits")).toBe(false)
    expect(headingShown("Veggies")).toBe(false)
  })

  it("shows a hidden group again when the search is cleared", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const input = screen.getByRole("combobox")
    await user.type(input, "carrot")
    await user.clear(input)
    expect(headingShown("Fruits")).toBe(true)
    expect(screen.getAllByRole("option")).toHaveLength(3)
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

describe("Command keyboard navigation", () => {
  function Fruits({
    disabledAt = [],
    loop,
    onSelect,
  }: {
    disabledAt?: number[]
    loop?: boolean
    onSelect?: (value: string) => void
  }) {
    return (
      <Command loop={loop}>
        <CommandInput aria-label="Search" />
        <CommandList>
          {["Apple", "Banana", "Cherry"].map((name, n) => (
            <CommandItem
              key={name}
              value={name.toLowerCase()}
              disabled={disabledAt.includes(n)}
              onSelect={onSelect}
            >
              {name}
            </CommandItem>
          ))}
        </CommandList>
      </Command>
    )
  }

  function activeText() {
    const id = screen
      .getByRole("combobox")
      .getAttribute("aria-activedescendant")
    return id ? document.getElementById(id)?.textContent : null
  }

  it.each([
    {
      position: "first",
      disabledAt: 0,
      start: "Banana",
      steps: [
        ["{ArrowUp}", "Cherry"],
        ["{ArrowDown}", "Banana"],
        ["{End}", "Cherry"],
        ["{Home}", "Banana"],
      ],
    },
    {
      position: "middle",
      disabledAt: 1,
      start: "Apple",
      steps: [
        ["{ArrowDown}", "Cherry"],
        ["{ArrowUp}", "Apple"],
        ["{End}", "Cherry"],
        ["{Home}", "Apple"],
      ],
    },
    {
      position: "last",
      disabledAt: 2,
      start: "Apple",
      steps: [
        ["{ArrowUp}", "Banana"],
        ["{ArrowDown}", "Apple"],
        ["{End}", "Banana"],
        ["{Home}", "Apple"],
      ],
    },
  ])(
    "skips a disabled $position item with the arrows, Home and End",
    async ({ disabledAt, start, steps }) => {
      const user = userEvent.setup()
      render(<Fruits disabledAt={[disabledAt]} />)
      await user.click(screen.getByRole("combobox"))
      expect(activeText()).toBe(start)
      for (const [key, expected] of steps) {
        await user.keyboard(key as string)
        expect(activeText()).toBe(expected)
      }
    },
  )

  it("moves nothing when every item is disabled", async () => {
    const user = userEvent.setup()
    render(<Fruits disabledAt={[0, 1, 2]} />)
    await user.click(screen.getByRole("combobox"))
    for (const key of ["{ArrowDown}", "{ArrowUp}", "{Home}", "{End}"]) {
      await user.keyboard(key)
      expect(screen.getByRole("combobox")).not.toHaveAttribute(
        "aria-activedescendant",
      )
    }
  })

  it("never confirms an active item that becomes disabled", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const { rerender } = render(<Fruits onSelect={onSelect} />)
    await user.click(screen.getByRole("combobox"))
    await user.keyboard("{ArrowDown}")
    expect(activeText()).toBe("Banana")
    rerender(<Fruits disabledAt={[1]} onSelect={onSelect} />)
    expect(activeText()).toBe("Apple")
    await user.keyboard("{Enter}")
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith("apple")
  })

  it("wraps at both ends by default", async () => {
    const user = userEvent.setup()
    render(<Fruits />)
    await user.click(screen.getByRole("combobox"))
    await user.keyboard("{ArrowUp}")
    expect(activeText()).toBe("Cherry")
    await user.keyboard("{ArrowDown}")
    expect(activeText()).toBe("Apple")
  })

  it("stops at the first and last enabled item when loop is false", async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Fruits loop={false} />)
    await user.click(screen.getByRole("combobox"))
    await user.keyboard("{ArrowUp}")
    expect(activeText()).toBe("Apple")
    await user.keyboard("{End}{ArrowDown}")
    expect(activeText()).toBe("Cherry")
    unmount()

    render(<Fruits loop={false} disabledAt={[0, 2]} />)
    await user.click(screen.getByRole("combobox"))
    await user.keyboard("{ArrowDown}")
    expect(activeText()).toBe("Banana")
    await user.keyboard("{ArrowUp}")
    expect(activeText()).toBe("Banana")
  })

  it.each([true, false])("keeps loop=%s off the root element", (loop) => {
    const { container } = render(<Fruits loop={loop} />)
    expect(container.firstChild).not.toHaveAttribute("loop")
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
    expect(activeOption()).toHaveTextContent("Banana")
    await user.keyboard("{End}a")
    expect(activeOption()).toHaveTextContent("Banana")
  })

  it("moves off the active item when it becomes disabled", () => {
    function Pair({ disabled }: { disabled: "none" | "apple" | "both" }) {
      return (
        <Command>
          <CommandInput aria-label="Search" />
          <CommandList>
            <CommandItem value="apple" disabled={disabled !== "none"}>
              Apple
            </CommandItem>
            <CommandItem value="banana" disabled={disabled === "both"}>
              Banana
            </CommandItem>
          </CommandList>
        </Command>
      )
    }

    const { rerender } = render(<Pair disabled="none" />)
    expect(activeOption()).toHaveTextContent("Apple")

    rerender(<Pair disabled="apple" />)
    expect(activeOption()).toHaveTextContent("Banana")

    rerender(<Pair disabled="both" />)
    expect(activeOption()).toBeNull()
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

describe("Command items that mount during a search", () => {
  function Late({ label }: { label: string | null }) {
    return (
      <Command>
        <CommandInput aria-label="Search" />
        <CommandList>
          <CommandItem value="apple">Apple</CommandItem>
          <CommandGroup heading="Late">
            {label === null ? null : <CommandItem>{label}</CommandItem>}
          </CommandGroup>
        </CommandList>
      </Command>
    )
  }

  it("matches an item without a value by its text", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Late label={null} />)
    await user.type(screen.getByRole("combobox"), "xyl")
    rerender(<Late label="Xylophone" />)
    expect(screen.getAllByRole("option")).toHaveLength(1)
    expect(screen.getByRole("option")).toHaveTextContent("Xylophone")
    expect(headingShown("Late")).toBe(true)
  })

  it("hides the group of an item that mounts without matching", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Late label={null} />)
    await user.type(screen.getByRole("combobox"), "app")
    rerender(<Late label="Xylophone" />)
    expect(screen.getAllByRole("option")).toHaveLength(1)
    expect(screen.getByRole("option")).toHaveTextContent("Apple")
    expect(headingShown("Late")).toBe(false)
  })
})

describe("CommandDialog filtering options", () => {
  function Dialog(props: {
    shouldFilter?: boolean
    filter?: (value: string, search: string) => number
    loop?: boolean
  }) {
    return (
      <CommandDialog open {...props}>
        <CommandInput aria-label="Search" />
        <CommandList>
          <CommandItem value="apple">Apple</CommandItem>
          <CommandItem value="banana">Banana</CommandItem>
        </CommandList>
      </CommandDialog>
    )
  }

  it("forwards shouldFilter", async () => {
    const user = userEvent.setup()
    render(<Dialog shouldFilter={false} />)
    await user.type(screen.getByRole("combobox"), "zzz")
    expect(screen.getAllByRole("option")).toHaveLength(2)
  })

  it("forwards filter", async () => {
    const user = userEvent.setup()
    render(<Dialog filter={(value, search) => (value[0] === search ? 1 : 0)} />)
    await user.type(screen.getByRole("combobox"), "a")
    expect(screen.getAllByRole("option")).toHaveLength(1)
    expect(screen.getByRole("option")).toHaveTextContent("Apple")
  })

  it("forwards loop", async () => {
    const user = userEvent.setup()
    render(<Dialog loop={false} />)
    const input = screen.getByRole("combobox")
    await user.click(input)
    await user.keyboard("{ArrowUp}")
    const active = input.getAttribute("aria-activedescendant")
    expect(active && document.getElementById(active)).toHaveTextContent("Apple")
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

describe("Command refs", () => {
  it("keeps callback refs on the root and an item attached across re-renders", () => {
    const rootRef = vi.fn()
    const itemRef = vi.fn()
    function Palette({ tick }: { tick: number }) {
      return (
        <Command ref={rootRef} data-tick={tick}>
          <CommandInput aria-label="Search" />
          <CommandList>
            <CommandItem value="apple" ref={itemRef}>
              Apple
            </CommandItem>
          </CommandList>
        </Command>
      )
    }
    const { container, rerender } = render(<Palette tick={0} />)
    for (const tick of [1, 2, 3]) rerender(<Palette tick={tick} />)
    expect(container.firstChild).toHaveAttribute("data-tick", "3")
    expect(rootRef).toHaveBeenCalledTimes(1)
    expect(rootRef).toHaveBeenCalledWith(container.firstChild)
    expect(itemRef).toHaveBeenCalledTimes(1)
    expect(itemRef).toHaveBeenCalledWith(
      screen.getByRole("option", { name: "Apple" }),
    )
  })
})
