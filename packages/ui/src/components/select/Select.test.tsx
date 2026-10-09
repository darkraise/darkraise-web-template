import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { isProgrammaticFocus } from "@primitives/focus-trap"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@components/select"

function Basic({
  onChange,
}: {
  onChange?: (value: string) => void
} = {}) {
  return (
    <Select onValueChange={onChange}>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Pick one" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="cherry" disabled>
          Cherry
        </SelectItem>
      </SelectContent>
    </Select>
  )
}

describe("Select", () => {
  it("renders the trigger as a combobox", () => {
    render(<Basic />)
    const trigger = screen.getByRole("combobox")
    expect(trigger).toHaveAttribute("aria-expanded", "false")
  })

  it("opens content on trigger click", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("combobox"))
    expect(await screen.findByRole("listbox")).toBeInTheDocument()
  })

  it("shows placeholder when no value", () => {
    render(<Basic />)
    expect(screen.getByText("Pick one")).toBeInTheDocument()
  })

  it("clicking an option commits and closes", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Basic onChange={onChange} />)
    await user.click(screen.getByRole("combobox"))
    await screen.findByRole("listbox")
    await user.click(screen.getByRole("option", { name: "Banana" }))
    expect(onChange).toHaveBeenCalledWith("banana")
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
  })

  it("disabled item is marked aria-disabled", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("combobox"))
    const cherry = await screen.findByRole("option", { name: "Cherry" })
    expect(cherry).toHaveAttribute("aria-disabled", "true")
  })

  it("escape closes the listbox", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("combobox"))
    await screen.findByRole("listbox")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
  })

  it("hidden form field receives the chosen value", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Select name="fruit">
        <SelectTrigger>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>,
    )
    await user.click(screen.getByRole("combobox"))
    await user.click(await screen.findByRole("option", { name: "Apple" }))
    const select = container.querySelector("select[name=fruit]")
    expect(select).toBeTruthy()
    expect((select as HTMLSelectElement).value).toBe("apple")
  })

  it("shows the item's label for a controlled value before the menu is opened", () => {
    render(
      <Select value="banana">
        <SelectTrigger>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>,
    )
    expect(screen.getByRole("combobox")).toHaveTextContent("Banana")
  })

  it("prefers an item's textValue over its rendered children", () => {
    render(
      <Select value="banana">
        <SelectTrigger>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="banana" textValue="Chuối">
            <span aria-hidden>🍌</span> Banana
          </SelectItem>
        </SelectContent>
      </Select>,
    )
    expect(screen.getByRole("combobox")).toHaveTextContent("Chuối")
  })

  it("falls back to the placeholder when no item matches the value", () => {
    render(
      <Select value="durian">
        <SelectTrigger>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>,
    )
    expect(screen.getByRole("combobox")).toHaveTextContent("durian")
  })

  it("forwards surface to the content surface", async () => {
    const user = userEvent.setup()
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent surface="page">
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>,
    )
    await user.click(screen.getByRole("combobox"))
    expect(await screen.findByRole("listbox")).toHaveAttribute(
      "data-surface-fill",
      "page",
    )
  })

  it("emits the attribute for card, so it overrides an ancestor", async () => {
    const user = userEvent.setup()
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent surface="card">
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>,
    )
    await user.click(screen.getByRole("combobox"))
    expect(await screen.findByRole("listbox")).toHaveAttribute(
      "data-surface-fill",
      "card",
    )
  })

  it("marks the focus it returns to the trigger as programmatic", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const trigger = screen.getByRole("combobox")
    await user.click(trigger)
    await screen.findByRole("listbox")
    const marks: boolean[] = []
    trigger.addEventListener("focus", () => marks.push(isProgrammaticFocus()))

    await user.keyboard("{Escape}")
    await waitFor(() => expect(document.activeElement).toBe(trigger))

    expect(marks).toEqual([true])
  })
})

describe("Select disabled item", () => {
  it("ignores a click", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Basic onChange={onChange} />)
    await user.click(screen.getByRole("combobox"))
    fireEvent.click(await screen.findByRole("option", { name: "Cherry" }))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole("listbox")).toBeInTheDocument()
  })
})

describe("Select direction", () => {
  it("gives the content its trigger's direction when dir is omitted", async () => {
    const user = userEvent.setup()
    render(
      <div dir="rtl">
        <Basic />
      </div>,
    )
    await user.click(screen.getByRole("combobox"))
    expect(await screen.findByRole("listbox")).toHaveAttribute("dir", "rtl")
  })

  it("writes the dir prop on the trigger and the content", async () => {
    const user = userEvent.setup()
    render(
      <Select dir="rtl">
        <SelectTrigger>
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>,
    )
    const trigger = screen.getByRole("combobox")
    expect(trigger).toHaveAttribute("dir", "rtl")
    await user.click(trigger)
    expect(await screen.findByRole("listbox")).toHaveAttribute("dir", "rtl")
  })
})

describe("Select keyboard", () => {
  function Fruit({
    disabled,
    onChange,
  }: {
    disabled: boolean
    onChange?: (value: string) => void
  }) {
    return (
      <Select onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana" disabled={disabled}>
            Banana
          </SelectItem>
          <SelectItem value="cherry">Cherry</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  it("arrow keys skip an option disabled after mount and reach it once enabled", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Fruit disabled={false} />)
    await user.click(screen.getByRole("combobox"))
    const listbox = await screen.findByRole("listbox")
    const apple = screen.getByRole("option", { name: "Apple" })
    const banana = screen.getByRole("option", { name: "Banana" })
    const cherry = screen.getByRole("option", { name: "Cherry" })

    fireEvent.keyDown(listbox, { key: "Home" })
    await waitFor(() => expect(apple).toHaveFocus())
    fireEvent.keyDown(apple, { key: "ArrowDown" })
    await waitFor(() => expect(banana).toHaveFocus())

    rerender(<Fruit disabled />)
    expect(screen.getByRole("option", { name: "Banana" })).toBe(banana)
    fireEvent.keyDown(listbox, { key: "Home" })
    await waitFor(() => expect(apple).toHaveFocus())
    fireEvent.keyDown(apple, { key: "ArrowDown" })
    await waitFor(() => expect(cherry).toHaveFocus())

    rerender(<Fruit disabled={false} />)
    expect(screen.getByRole("option", { name: "Banana" })).toBe(banana)
    fireEvent.keyDown(listbox, { key: "Home" })
    await waitFor(() => expect(apple).toHaveFocus())
    fireEvent.keyDown(apple, { key: "ArrowDown" })
    await waitFor(() => expect(banana).toHaveFocus())
  })

  it("Enter commits the focused option", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Fruit disabled={false} onChange={onChange} />)
    await user.click(screen.getByRole("combobox"))
    const listbox = await screen.findByRole("listbox")
    const apple = screen.getByRole("option", { name: "Apple" })
    const banana = screen.getByRole("option", { name: "Banana" })

    fireEvent.keyDown(listbox, { key: "Home" })
    await waitFor(() => expect(apple).toHaveFocus())
    fireEvent.keyDown(apple, { key: "ArrowDown" })
    await waitFor(() => expect(banana).toHaveFocus())
    fireEvent.keyDown(banana, { key: "Enter" })
    expect(onChange).toHaveBeenCalledWith("banana")
  })
})

describe("Select option text changed after mount", () => {
  function Fruit({ label }: { label: string }) {
    return (
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="other">{label}</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  it("typeahead finds an option by its new text, not its old one", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Fruit label="Pear" />)
    await user.click(screen.getByRole("combobox"))
    const listbox = await screen.findByRole("listbox")
    await waitFor(() => expect(listbox).toHaveFocus())
    rerender(<Fruit label="Quince" />)
    const quince = screen.getByRole("option", { name: "Quince" })

    fireEvent.keyDown(listbox, { key: "p" })
    expect(quince).not.toHaveFocus()
    await new Promise((resolve) => setTimeout(resolve, 600))
    fireEvent.keyDown(listbox, { key: "q" })
    await waitFor(() => expect(quince).toHaveFocus())
  })
})
