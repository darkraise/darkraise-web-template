import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { TimePicker } from "./TimePicker"

describe("TimePicker", () => {
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
})
