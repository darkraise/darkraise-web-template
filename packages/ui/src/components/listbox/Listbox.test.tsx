import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as React from "react"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { Listbox, ListboxItem } from "./Listbox"

describe("Listbox single mode", () => {
  it("renders role=listbox with options", () => {
    render(
      <Listbox value="a" onValueChange={() => {}} aria-label="Fruit">
        <ListboxItem value="a">Apple</ListboxItem>
        <ListboxItem value="b">Banana</ListboxItem>
      </Listbox>,
    )
    expect(screen.getByRole("listbox", { name: "Fruit" })).toBeInTheDocument()
    expect(screen.getAllByRole("option")).toHaveLength(2)
  })

  it("marks the selected option with aria-selected=true", () => {
    render(
      <Listbox value="b" onValueChange={() => {}} aria-label="x">
        <ListboxItem value="a">Apple</ListboxItem>
        <ListboxItem value="b">Banana</ListboxItem>
      </Listbox>,
    )
    expect(screen.getByText("Banana").closest("[role=option]")).toHaveAttribute(
      "aria-selected",
      "true",
    )
    expect(screen.getByText("Apple").closest("[role=option]")).toHaveAttribute(
      "aria-selected",
      "false",
    )
  })

  it("ArrowDown moves focus and Enter selects", async () => {
    const onValueChange = vi.fn()
    function Wrapper() {
      const [v, setV] = React.useState<string | undefined>(undefined)
      return (
        <Listbox
          value={v}
          onValueChange={(next) => {
            setV(next as string)
            onValueChange(next)
          }}
          aria-label="x"
        >
          <ListboxItem value="a">Apple</ListboxItem>
          <ListboxItem value="b">Banana</ListboxItem>
          <ListboxItem value="c">Cherry</ListboxItem>
        </Listbox>
      )
    }
    render(<Wrapper />)
    const listbox = screen.getByRole("listbox")
    listbox.focus()
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}")
    expect(onValueChange).toHaveBeenLastCalledWith("b")
  })

  it("clicking an option selects it", async () => {
    const onValueChange = vi.fn()
    render(
      <Listbox value={undefined} onValueChange={onValueChange} aria-label="x">
        <ListboxItem value="a">Apple</ListboxItem>
      </Listbox>,
    )
    await userEvent.click(screen.getByText("Apple"))
    expect(onValueChange).toHaveBeenCalledWith("a")
  })

  it("disabled option is skipped by keyboard nav and click", async () => {
    const onValueChange = vi.fn()
    render(
      <Listbox value={undefined} onValueChange={onValueChange} aria-label="x">
        <ListboxItem value="a">Apple</ListboxItem>
        <ListboxItem value="b" disabled>
          Banana
        </ListboxItem>
        <ListboxItem value="c">Cherry</ListboxItem>
      </Listbox>,
    )
    await userEvent.click(screen.getByText("Banana"))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("Home/End jump to first/last enabled option", async () => {
    const onValueChange = vi.fn()
    function Wrapper() {
      const [v, setV] = React.useState<string | undefined>("b")
      return (
        <Listbox
          value={v}
          onValueChange={(next) => {
            setV(next as string)
            onValueChange(next)
          }}
          aria-label="x"
        >
          <ListboxItem value="a">Apple</ListboxItem>
          <ListboxItem value="b">Banana</ListboxItem>
          <ListboxItem value="c">Cherry</ListboxItem>
        </Listbox>
      )
    }
    render(<Wrapper />)
    screen.getByRole("listbox").focus()
    await userEvent.keyboard("{End}{Enter}")
    expect(onValueChange).toHaveBeenLastCalledWith("c")
    await userEvent.keyboard("{Home}{Enter}")
    expect(onValueChange).toHaveBeenLastCalledWith("a")
  })
})

describe("Listbox multi mode", () => {
  it("toggles selection of multiple values", async () => {
    const onValueChange = vi.fn()
    function Wrapper() {
      const [v, setV] = React.useState<string[]>([])
      return (
        <Listbox
          mode="multi"
          value={v}
          onValueChange={(next) => {
            setV(next as string[])
            onValueChange(next)
          }}
          aria-label="x"
        >
          <ListboxItem value="a">Apple</ListboxItem>
          <ListboxItem value="b">Banana</ListboxItem>
        </Listbox>
      )
    }
    render(<Wrapper />)
    await userEvent.click(screen.getByText("Apple"))
    await userEvent.click(screen.getByText("Banana"))
    expect(onValueChange).toHaveBeenLastCalledWith(["a", "b"])
    await userEvent.click(screen.getByText("Apple"))
    expect(onValueChange).toHaveBeenLastCalledWith(["b"])
  })
})

describe("Listbox variant", () => {
  const listboxCss = readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), "listbox.css"),
    "utf8",
  )

  function renderVariant(variant?: "filled" | "outline") {
    render(
      <Listbox
        value="a"
        onValueChange={() => {}}
        aria-label="x"
        variant={variant}
      >
        <ListboxItem value="a">Apple</ListboxItem>
      </Listbox>,
    )
    return screen.getByRole("listbox")
  }

  it("defaults to the filled selected style", () => {
    expect(renderVariant().getAttribute("data-variant")).toBe("filled")
  })

  it("reflects variant=outline on the root", () => {
    expect(renderVariant("outline").getAttribute("data-variant")).toBe(
      "outline",
    )
  })

  it("styles the selected item from the root variant, not the item", () => {
    // The rule has to be scoped by the root so a single prop drives every
    // item; an item-level selector would need the prop threaded per item.
    const rule = listboxCss.match(
      /\.dr-listbox\[data-variant="outline"\][^{]*\[data-selected="true"\][^{]*\{([^}]*)\}/,
    )
    expect(rule?.[1], "no outline selected rule found").toBeDefined()
    // Outlined means a ring and no solid fill.
    expect(rule?.[1]).toMatch(/inset 0 0 0 1px/)
    expect(rule?.[1]).toMatch(/bg-transparent/)
  })
})
