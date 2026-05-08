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

  it("opens the root listbox on trigger click", async () => {
    render(<CascadeSelect options={OPTIONS} placeholder="Pick" />)
    await userEvent.click(screen.getByRole("button", { name: /pick/i }))
    expect(await screen.findByRole("listbox")).toBeInTheDocument()
    expect(screen.getByText("United States")).toBeInTheDocument()
  })

  it("hovering a parent option opens the child listbox", async () => {
    render(<CascadeSelect options={OPTIONS} placeholder="Pick" />)
    await userEvent.click(screen.getByRole("button"))
    await userEvent.hover(screen.getByText("United States"))
    expect(await screen.findByText("California")).toBeInTheDocument()
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
    await screen.findByRole("listbox")
    await userEvent.keyboard("{Escape}")
    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
    )
  })
})
