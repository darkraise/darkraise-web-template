import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as React from "react"
import { CascadeSelect, type CascadeOption } from "./CascadeSelect"

const OPTIONS: CascadeOption[] = [
  {
    value: "us",
    label: "United States",
    children: [
      { value: "ca", label: "California" },
      { value: "ny", label: "New York" },
    ],
  },
  {
    value: "ca",
    label: "Canada",
    children: [{ value: "bc", label: "British Columbia" }],
  },
]

describe("CascadeSelect", () => {
  it("renders the trigger with placeholder", () => {
    render(<CascadeSelect options={OPTIONS} placeholder="Pick" />)
    expect(screen.getByRole("button", { name: /pick/i })).toBeInTheDocument()
  })

  it("renders a field trigger that marks its placeholder", () => {
    const { rerender } = render(
      <CascadeSelect options={OPTIONS} placeholder="Pick" />,
    )
    const trigger = screen.getByRole("button", { name: "Pick" })
    expect(trigger).toHaveClass("dr-cascade-trigger")
    expect(trigger).not.toHaveClass("dr-btn")
    expect(trigger).toHaveAttribute("data-placeholder", "")
    expect(trigger.firstElementChild?.tagName).toBe("SPAN")
    expect(trigger.lastElementChild?.tagName.toLowerCase()).toBe("svg")
    rerender(
      <CascadeSelect
        options={OPTIONS}
        value={["us", "ny"]}
        placeholder="Pick"
      />,
    )
    expect(
      screen.getByRole("button", { name: "New York" }),
    ).not.toHaveAttribute("data-placeholder")
  })

  it("opens the root listbox on trigger click", async () => {
    render(<CascadeSelect options={OPTIONS} placeholder="Pick" />)
    await userEvent.click(screen.getByRole("button", { name: /pick/i }))
    expect((await screen.findAllByRole("listbox")).length).toBeGreaterThan(0)
    expect(screen.getByText("United States")).toBeInTheDocument()
  })

  it("hovering a parent option opens the child listbox", async () => {
    render(<CascadeSelect options={OPTIONS} placeholder="Pick" />)
    await userEvent.click(screen.getByRole("button"))
    await userEvent.hover(screen.getByText("Canada"))
    expect(await screen.findByText("British Columbia")).toBeInTheDocument()
  })

  it("clicking a leaf commits the full path via onValueChange", async () => {
    const onValueChange = vi.fn()
    render(
      <CascadeSelect
        options={OPTIONS}
        placeholder="Pick"
        onValueChange={onValueChange}
      />,
    )
    await userEvent.click(screen.getByRole("button"))
    await userEvent.hover(screen.getByText("United States"))
    const ca = await screen.findByText("California")
    await userEvent.click(ca)
    expect(onValueChange).toHaveBeenCalledWith(["us", "ca"])
  })

  it("controlled value displays the selected leaf in the trigger", () => {
    render(
      <CascadeSelect
        options={OPTIONS}
        value={["us", "ny"]}
        onValueChange={() => {}}
        placeholder="Pick"
      />,
    )
    expect(screen.getByRole("button")).toHaveTextContent(/New York/)
  })

  it("Escape closes the popover", async () => {
    render(<CascadeSelect options={OPTIONS} placeholder="Pick" />)
    await userEvent.click(screen.getByRole("button"))
    await screen.findAllByRole("listbox")
    await userEvent.keyboard("{Escape}")
    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
    )
  })
})

const KEYED: CascadeOption[] = [
  {
    value: "us",
    label: "United States",
    children: [
      { value: "ca", label: "California" },
      { value: "tx", label: "Texas", disabled: true },
      { value: "ny", label: "New York" },
    ],
  },
  { value: "fr", label: "France", disabled: true },
  {
    value: "ca",
    label: "Canada",
    children: [{ value: "bc", label: "British Columbia" }],
  },
]

const option = (name: string) => screen.getByRole("option", { name })

async function openKeyed(
  props: Partial<React.ComponentProps<typeof CascadeSelect>> = {},
) {
  render(<CascadeSelect options={KEYED} placeholder="Pick" {...props} />)
  await userEvent.click(screen.getByRole("button"))
  await screen.findAllByRole("listbox")
}

describe("CascadeSelect keyboard", () => {
  it("focuses the first enabled item on open", async () => {
    await openKeyed()
    await waitFor(() => expect(option("United States")).toHaveFocus())
  })

  it("focuses the deepest item of the selected path on open", async () => {
    await openKeyed({ defaultValue: ["us", "ny"] })
    await waitFor(() => expect(option("New York")).toHaveFocus())
  })

  it("focuses the column's first enabled item when the selected path ends on a disabled one", async () => {
    await openKeyed({ defaultValue: ["us", "tx"] })
    await waitFor(() => expect(option("California")).toHaveFocus())
    const tabbable = screen
      .getAllByRole("option")
      .filter((item) => item.tabIndex === 0)
    expect(tabbable).toEqual([option("California")])
  })

  it("moves with Up, Down, Home and End and skips disabled items", async () => {
    await openKeyed()
    await waitFor(() => expect(option("United States")).toHaveFocus())
    await userEvent.keyboard("{ArrowDown}")
    expect(option("Canada")).toHaveFocus()
    await userEvent.keyboard("{ArrowDown}")
    expect(option("Canada")).toHaveFocus()
    await userEvent.keyboard("{Home}")
    expect(option("United States")).toHaveFocus()
    await userEvent.keyboard("{End}")
    expect(option("Canada")).toHaveFocus()
    await userEvent.keyboard("{ArrowUp}")
    expect(option("United States")).toHaveFocus()
  })

  it("opens a child column with Right or Enter and returns with Left", async () => {
    await openKeyed()
    await waitFor(() => expect(option("United States")).toHaveFocus())
    await userEvent.keyboard("{ArrowRight}")
    expect(option("California")).toHaveFocus()
    await userEvent.keyboard("{ArrowDown}")
    expect(option("New York")).toHaveFocus()
    await userEvent.keyboard("{ArrowLeft}")
    expect(option("United States")).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    expect(option("California")).toHaveFocus()
  })

  it("selects a leaf with Enter and returns focus to the trigger", async () => {
    const onValueChange = vi.fn()
    await openKeyed({ onValueChange })
    await waitFor(() => expect(option("United States")).toHaveFocus())
    await userEvent.keyboard("{ArrowRight}{ArrowDown}{Enter}")
    expect(onValueChange).toHaveBeenCalledWith(["us", "ny"])
    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
    )
    expect(screen.getByRole("button")).toHaveFocus()
  })

  it("selects a leaf with Space", async () => {
    const onValueChange = vi.fn()
    await openKeyed({ onValueChange })
    await waitFor(() => expect(option("United States")).toHaveFocus())
    await userEvent.keyboard("{ArrowRight}[Space]")
    expect(onValueChange).toHaveBeenCalledWith(["us", "ca"])
  })

  it("closes on Escape and returns focus to the trigger", async () => {
    await openKeyed()
    await waitFor(() => expect(option("United States")).toHaveFocus())
    await userEvent.keyboard("{Escape}")
    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
    )
    expect(screen.getByRole("button")).toHaveFocus()
  })

  it("keeps only the focused item in the tab order", async () => {
    await openKeyed()
    await waitFor(() => expect(option("United States")).toHaveFocus())
    await userEvent.keyboard("{ArrowDown}")
    const tabbable = screen
      .getAllByRole("option")
      .filter((item) => item.tabIndex === 0)
    expect(tabbable).toEqual([option("Canada")])
  })

  it("moves focus to a hovered item", async () => {
    await openKeyed()
    await waitFor(() => expect(option("United States")).toHaveFocus())
    await userEvent.hover(option("Canada"))
    expect(option("Canada")).toHaveFocus()
  })

  it("shows the selected path's columns when reopened", async () => {
    await openKeyed({ defaultValue: ["ca", "bc"] })
    expect(option("British Columbia")).toBeInTheDocument()
    await userEvent.keyboard("{Escape}")
    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
    )
    await userEvent.click(screen.getByRole("button"))
    await waitFor(() => expect(option("British Columbia")).toHaveFocus())
    expect(screen.getAllByRole("listbox")).toHaveLength(2)
  })

  it("leaves focus alone when the parent re-renders after focus moved out", async () => {
    const tree = () => (
      <>
        <input aria-label="Other" />
        <CascadeSelect options={KEYED} placeholder="Pick" />
      </>
    )
    const { rerender } = render(tree())
    await userEvent.click(screen.getByRole("button"))
    await waitFor(() => expect(option("United States")).toHaveFocus())
    screen.getByLabelText("Other").focus()
    rerender(tree())
    expect(screen.getByLabelText("Other")).toHaveFocus()
  })
})
