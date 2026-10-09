import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
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

  it("selects with the checked fill when filled and a ring when outline", () => {
    const css = listboxCss.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ")
    expect(css).toMatch(
      /\.dr-listbox-item\[data-selected="true"\] \{[^}]*background-color: var\(--selected-check-bg\);/,
    )
    expect(css).toMatch(
      /\.dr-listbox\[data-variant="outline"\] \.dr-listbox-item\[data-selected="true"\],[^{]*\{[^}]*background-color: transparent;[^}]*inset 0 0 0 1px hsl\(var\(--primary-text\)\)/,
    )
  })
})

describe("Listbox disabled", () => {
  it("ignores clicks on its options", async () => {
    const onValueChange = vi.fn()
    render(
      <Listbox disabled onValueChange={onValueChange} aria-label="x">
        <ListboxItem value="a">Apple</ListboxItem>
      </Listbox>,
    )
    await userEvent.click(screen.getByText("Apple"))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("does not highlight an option under the pointer", async () => {
    render(
      <Listbox disabled aria-label="x">
        <ListboxItem value="a">Apple</ListboxItem>
      </Listbox>,
    )
    await userEvent.hover(screen.getByText("Apple"))
    expect(screen.getByRole("option")).not.toHaveAttribute("data-focused")
  })

  it("leaves the tab order and ignores arrows, Enter and Space", () => {
    const onValueChange = vi.fn()
    render(
      <Listbox disabled onValueChange={onValueChange} aria-label="x">
        <ListboxItem value="a">Apple</ListboxItem>
      </Listbox>,
    )
    const listbox = screen.getByRole("listbox")
    expect(listbox).toHaveAttribute("tabindex", "-1")
    fireEvent.keyDown(listbox, { key: "ArrowDown" })
    fireEvent.keyDown(listbox, { key: "Enter" })
    fireEvent.keyDown(listbox, { key: " " })
    expect(onValueChange).not.toHaveBeenCalled()
  })
})

describe("Listbox focus tracking", () => {
  function Fruits({
    bananaDisabled = false,
    withCherry = true,
    onValueChange,
  }: {
    bananaDisabled?: boolean
    withCherry?: boolean
    onValueChange?: (value: string | string[]) => void
  }) {
    return (
      <Listbox aria-label="Fruit" onValueChange={onValueChange}>
        <ListboxItem value="apple">Apple</ListboxItem>
        <ListboxItem value="banana" disabled={bananaDisabled}>
          Banana
        </ListboxItem>
        {withCherry ? <ListboxItem value="cherry">Cherry</ListboxItem> : null}
      </Listbox>
    )
  }

  function activeOption() {
    const id = screen.getByRole("listbox").getAttribute("aria-activedescendant")
    return id ? document.getElementById(id) : null
  }

  it("skips an item disabled after mount, and stops skipping it once enabled", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Fruits bananaDisabled />)
    const banana = screen.getByRole("option", { name: "Banana" })
    screen.getByRole("listbox").focus()
    await user.keyboard("{ArrowDown}{ArrowDown}")
    expect(activeOption()).toHaveTextContent("Cherry")

    rerender(<Fruits />)
    await user.keyboard("{Home}{ArrowDown}")
    expect(activeOption()).toBe(banana)
    expect(banana).toHaveAttribute("data-focused", "true")

    rerender(<Fruits bananaDisabled />)
    await user.keyboard("{Home}{ArrowDown}")
    expect(activeOption()).toHaveTextContent("Cherry")
    expect(screen.getByRole("option", { name: "Banana" })).toBe(banana)
  })

  it("restarts from the first enabled item when the focused one is disabled", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender } = render(<Fruits onValueChange={onValueChange} />)
    screen.getByRole("listbox").focus()
    await user.keyboard("{ArrowDown}{ArrowDown}")
    expect(activeOption()).toHaveTextContent("Banana")

    rerender(<Fruits bananaDisabled onValueChange={onValueChange} />)
    await user.keyboard("{Enter}")
    expect(onValueChange).not.toHaveBeenCalled()
    await user.keyboard("{ArrowDown}")
    expect(activeOption()).toHaveTextContent("Apple")
  })

  it("continues from the item that took a removed focused item's place", async () => {
    const user = userEvent.setup()
    function Four({
      withBanana,
      withDate,
    }: {
      withBanana: boolean
      withDate: boolean
    }) {
      return (
        <Listbox aria-label="Fruit">
          <ListboxItem value="apple">Apple</ListboxItem>
          {withBanana ? <ListboxItem value="banana">Banana</ListboxItem> : null}
          <ListboxItem value="cherry">Cherry</ListboxItem>
          {withDate ? <ListboxItem value="date">Date</ListboxItem> : null}
        </Listbox>
      )
    }
    const { rerender } = render(<Four withBanana withDate />)
    screen.getByRole("listbox").focus()
    await user.keyboard("{Home}{ArrowDown}")
    expect(activeOption()).toHaveTextContent("Banana")

    rerender(<Four withBanana={false} withDate />)
    await user.keyboard("{ArrowDown}")
    expect(activeOption()).toHaveTextContent("Date")

    rerender(<Four withBanana={false} withDate={false} />)
    await user.keyboard("{ArrowDown}")
    expect(activeOption()).toHaveTextContent("Apple")
  })

  it("matches typeahead against an item's current text", async () => {
    const user = userEvent.setup()
    function Labelled({ label }: { label: string }) {
      return (
        <Listbox aria-label="Fruit">
          <ListboxItem value="a">Apple</ListboxItem>
          <ListboxItem value="b">{label}</ListboxItem>
        </Listbox>
      )
    }
    const { rerender } = render(<Labelled label="Banana" />)
    rerender(<Labelled label="Mango" />)
    screen.getByRole("listbox").focus()
    await user.keyboard("m")
    expect(activeOption()).toHaveTextContent("Mango")
  })
})
