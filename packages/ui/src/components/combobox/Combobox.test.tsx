import * as React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"

import {
  Combobox,
  ComboboxClearTrigger,
  ComboboxContent,
  ComboboxControl,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxItemText,
  ComboboxLabel,
  ComboboxList,
  ComboboxTrigger,
  type ComboboxItemData,
  type ComboboxInputValueChangeDetails,
  type ComboboxValueChangeDetails,
} from "./Combobox"

const COUNTRIES: ComboboxItemData[] = [
  { value: "us", label: "United States" },
  { value: "ca", label: "Canada" },
  { value: "mx", label: "Mexico" },
  { value: "br", label: "Brazil" },
]

interface BasicProps {
  multiple?: boolean
  initialItems?: ComboboxItemData[]
  onValueChangeSpy?: (details: ComboboxValueChangeDetails) => void
  onInputValueChangeSpy?: (details: ComboboxInputValueChangeDetails) => void
}

function Basic({
  multiple = false,
  initialItems = COUNTRIES,
  onValueChangeSpy,
  onInputValueChangeSpy,
}: BasicProps) {
  const [query, setQuery] = React.useState("")
  const [single, setSingle] = React.useState<string | null>(null)
  const [many, setMany] = React.useState<string[]>([])

  const filtered = React.useMemo(
    () =>
      initialItems.filter((it) =>
        it.label.toLowerCase().includes(query.toLowerCase()),
      ),
    [initialItems, query],
  )

  return (
    <Combobox
      items={filtered}
      inputValue={query}
      onInputValueChange={(d) => {
        setQuery(d.value)
        onInputValueChangeSpy?.(d)
      }}
      value={multiple ? many : single}
      onValueChange={(d) => {
        if (multiple) {
          setMany(d.value)
        } else {
          setSingle(d.value[0] ?? null)
        }
        onValueChangeSpy?.(d)
      }}
      multiple={multiple}
      placeholder="Search..."
    >
      <ComboboxLabel>Country</ComboboxLabel>
      <ComboboxControl>
        <ComboboxInput />
        <ComboboxClearTrigger>x</ComboboxClearTrigger>
        <ComboboxTrigger>v</ComboboxTrigger>
      </ComboboxControl>
      <ComboboxContent>
        <ComboboxList>
          {filtered.map((item) => (
            <ComboboxItem key={item.value} item={item}>
              <ComboboxItemText>{item.label}</ComboboxItemText>
              <ComboboxItemIndicator>*</ComboboxItemIndicator>
            </ComboboxItem>
          ))}
        </ComboboxList>
        <ComboboxEmpty>No results</ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  )
}

describe("Combobox", () => {
  it("renders input and label", () => {
    render(<Basic />)
    expect(screen.getByText("Country")).toBeInTheDocument()
    const input = screen.getByRole("combobox")
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute("aria-expanded", "false")
  })

  it("typing fires onInputValueChange", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Basic onInputValueChangeSpy={spy} />)
    const input = screen.getByRole("combobox")
    await user.click(input)
    await user.type(input, "Can")
    expect(spy).toHaveBeenCalled()
    const calls = spy.mock.calls.map((c) => c[0].value)
    expect(calls).toContain("C")
    expect(calls[calls.length - 1]).toBe("Can")
  })

  it("opens on focus", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const input = screen.getByRole("combobox")
    expect(input).toHaveAttribute("aria-expanded", "false")
    await user.click(input)
    expect(input).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("listbox")).toBeInTheDocument()
  })

  it("closes on Escape", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const input = screen.getByRole("combobox")
    await user.click(input)
    expect(input).toHaveAttribute("aria-expanded", "true")
    await user.keyboard("{Escape}")
    expect(input).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("listbox")).toBeNull()
  })

  it("ArrowDown highlights first item", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const input = screen.getByRole("combobox")
    await user.click(input)
    await user.keyboard("{ArrowDown}")
    const list = screen.getByRole("listbox")
    const options = within(list).getAllByRole("option")
    expect(options[0]).toHaveAttribute("data-highlighted", "true")
  })

  it("Enter selects highlighted item", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Basic onValueChangeSpy={spy} />)
    const input = screen.getByRole("combobox")
    await user.click(input)
    await user.keyboard("{ArrowDown}")
    await user.keyboard("{ArrowDown}")
    await user.keyboard("{Enter}")
    expect(spy).toHaveBeenCalled()
    const lastCall = spy.mock.calls[spy.mock.calls.length - 1]?.[0]
    expect(lastCall.value).toEqual(["ca"])
  })

  it("clicking an item selects it", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Basic onValueChangeSpy={spy} />)
    const input = screen.getByRole("combobox")
    await user.click(input)
    const list = screen.getByRole("listbox")
    const mexico = within(list).getByText("Mexico")
    await user.click(mexico)
    const lastCall = spy.mock.calls[spy.mock.calls.length - 1]?.[0]
    expect(lastCall.value).toEqual(["mx"])
  })

  it("renders empty state when items list is empty", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const input = screen.getByRole("combobox")
    await user.click(input)
    await user.type(input, "zzz")
    expect(screen.queryByRole("listbox")).toBeInTheDocument()
    expect(screen.getByText("No results")).toBeInTheDocument()
  })

  it("multi-select keeps both selected and toggles off on second click", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Basic multiple onValueChangeSpy={spy} />)
    const input = screen.getByRole("combobox")
    await user.click(input)
    let list = screen.getByRole("listbox")
    await user.click(within(list).getByText("United States"))
    list = screen.getByRole("listbox")
    await user.click(within(list).getByText("Canada"))
    let lastCall = spy.mock.calls[spy.mock.calls.length - 1]?.[0]
    expect(lastCall.value).toEqual(["us", "ca"])

    list = screen.getByRole("listbox")
    await user.click(within(list).getByText("United States"))
    lastCall = spy.mock.calls[spy.mock.calls.length - 1]?.[0]
    expect(lastCall.value).toEqual(["ca"])
  })

  it("clears all selections when clearAll is invoked in multi-select mode", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    const items: ComboboxItemData[] = [
      { value: "a", label: "Apple" },
      { value: "b", label: "Banana" },
    ]
    render(
      <Combobox
        items={items}
        multiple
        value={["a", "b"]}
        defaultInputValue="x"
        onValueChange={spy}
      >
        <ComboboxControl>
          <ComboboxInput />
          <ComboboxClearTrigger data-testid="clear">x</ComboboxClearTrigger>
        </ComboboxControl>
      </Combobox>,
    )
    await user.click(screen.getByTestId("clear"))
    const lastCall = spy.mock.calls[spy.mock.calls.length - 1]?.[0]
    expect(lastCall.value).toEqual([])
  })

  it("closes on outside click", async () => {
    const user = userEvent.setup()
    render(
      <div>
        <Basic />
        <button type="button">outside</button>
      </div>,
    )
    const input = screen.getByRole("combobox")
    await user.click(input)
    expect(input).toHaveAttribute("aria-expanded", "true")
    await user.click(screen.getByRole("button", { name: "outside" }))
    expect(input).toHaveAttribute("aria-expanded", "false")
  })
})
