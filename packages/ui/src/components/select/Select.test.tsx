import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
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

  it("forwards surfaceIntensity to the content surface", async () => {
    const user = userEvent.setup()
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent surfaceIntensity="flat">
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>,
    )
    await user.click(screen.getByRole("combobox"))
    expect(await screen.findByRole("listbox")).toHaveAttribute(
      "data-surface-intensity",
      "flat",
    )
  })

  it("emits the attribute for balanced, so it overrides an ancestor", async () => {
    const user = userEvent.setup()
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent surfaceIntensity="balanced">
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>,
    )
    await user.click(screen.getByRole("combobox"))
    expect(await screen.findByRole("listbox")).toHaveAttribute(
      "data-surface-intensity",
      "balanced",
    )
  })
})
