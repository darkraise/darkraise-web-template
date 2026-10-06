import { beforeAll, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TimePicker } from "./TimePicker"

describe("TimePicker", () => {
  beforeAll(() => {
    // jsdom has no scrollIntoView; each column scrolls its value into view.
    HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  it("renders a field trigger with its value in a span", () => {
    render(<TimePicker value="09:30" format="24h" />)
    const trigger = screen.getByRole("button", { name: "09:30" })
    expect(trigger).toHaveClass("dr-time-picker-trigger")
    expect(trigger).not.toHaveClass("dr-btn")
    expect(trigger).not.toHaveAttribute("data-placeholder")
    expect(trigger.firstElementChild?.tagName).toBe("SPAN")
    expect(trigger.firstElementChild).toHaveTextContent("09:30")
    expect(trigger.lastElementChild?.tagName.toLowerCase()).toBe("svg")
  })

  it("marks the placeholder when the value is empty", () => {
    render(<TimePicker value="" placeholder="Pick a time" />)
    const trigger = screen.getByRole("button", { name: "Pick a time" })
    expect(trigger).toHaveAttribute("data-placeholder", "")
    expect(trigger.firstElementChild).toHaveTextContent("Pick a time")
  })

  it("starts at 12:00 when no value is given", () => {
    render(<TimePicker format="24h" />)
    expect(screen.getByRole("button", { name: "12:00" })).toBeInTheDocument()
  })

  it("starts from defaultValue and keeps the picked time when uncontrolled", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <TimePicker
        defaultValue="09:30"
        format="24h"
        onValueChange={onValueChange}
      />,
    )
    await user.click(screen.getByRole("button", { name: "09:30" }))
    await user.click(await screen.findByRole("button", { name: "Hour 14" }))
    expect(onValueChange).toHaveBeenCalledWith("14:30")
    expect(screen.getByRole("button", { name: "14:30" })).toBeInTheDocument()
  })

  it("reports picks through onValueChange and follows value when controlled", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <TimePicker value="09:30" format="24h" onValueChange={onValueChange} />,
    )
    await user.click(screen.getByRole("button", { name: "09:30" }))
    await user.click(await screen.findByRole("button", { name: "Minute 45" }))
    expect(onValueChange).toHaveBeenCalledWith("09:45")
    expect(screen.getByRole("button", { name: "09:30" })).toBeInTheDocument()
  })
})
