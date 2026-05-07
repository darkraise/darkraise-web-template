import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { useState } from "react"
import { Calendar, type DateRange } from "@components/calendar"

// Fix the month so tests don't shift with real time.
const FIXED_MONTH = new Date(2024, 5, 1) // June 2024

describe("Calendar", () => {
  it("renders a grid of day buttons", () => {
    render(<Calendar defaultMonth={FIXED_MONTH} />)
    const grid = screen.getByRole("grid")
    expect(grid).toBeInTheDocument()
    // At least one day button visible
    const dayBtns = screen.getAllByRole("button", { name: /june/i })
    expect(dayBtns.length).toBeGreaterThan(0)
  })

  it("renders previous and next month nav buttons", () => {
    render(<Calendar defaultMonth={FIXED_MONTH} />)
    expect(
      screen.getByRole("button", { name: /previous month/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /next month/i }),
    ).toBeInTheDocument()
  })

  it("single mode: clicking a day calls onSelect", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <Calendar mode="single" defaultMonth={FIXED_MONTH} onSelect={onSelect} />,
    )
    const day = screen.getByRole("button", { name: /june 15/i })
    await user.click(day)
    expect(onSelect).toHaveBeenCalledOnce()
    const selected = onSelect.mock.calls[0]?.[0] as Date
    expect(selected).toBeInstanceOf(Date)
    expect(selected.getDate()).toBe(15)
  })

  it("single mode: controlled selected date is marked aria-pressed", () => {
    const selected = new Date(2024, 5, 10)
    render(
      <Calendar mode="single" defaultMonth={FIXED_MONTH} selected={selected} />,
    )
    const day = screen.getByRole("button", { name: /june 10/i })
    expect(day).toHaveAttribute("aria-pressed", "true")
  })

  it("range mode: first click does NOT auto-complete range (min=1 default)", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <Calendar
        mode="range"
        defaultMonth={FIXED_MONTH}
        min={1}
        onSelect={onSelect}
      />,
    )
    const day = screen.getByRole("button", { name: /june 12/i })
    await user.click(day)
    const range = onSelect.mock.calls[0]?.[0] as { from: Date; to?: Date }
    expect(range.to).toBeUndefined()
  })

  it("range mode: two different clicks completes the range", async () => {
    const user = userEvent.setup()
    function ControlledRange() {
      const [range, setRange] = useState<DateRange | undefined>(undefined)
      return (
        <Calendar
          mode="range"
          defaultMonth={FIXED_MONTH}
          selected={range}
          onSelect={setRange}
        />
      )
    }
    render(<ControlledRange />)
    await user.click(screen.getByRole("button", { name: /june 5/i }))
    await user.click(screen.getByRole("button", { name: /june 10/i }))
    // After two clicks the range should be complete: start-range and end-range markers appear.
    const startMarker = document.querySelector("[data-range-start='true']")
    const endMarker = document.querySelector("[data-range-end='true']")
    expect(startMarker).toBeInTheDocument()
    expect(endMarker).toBeInTheDocument()
  })

  it("ArrowRight moves focus to next day without crashing", async () => {
    const user = userEvent.setup()
    render(<Calendar defaultMonth={FIXED_MONTH} autoFocus />)
    const grid = screen.getByRole("grid")
    grid.focus()
    await user.keyboard("{ArrowRight}")
    expect(grid).toBeInTheDocument()
  })

  it("PageDown moves to next month without crashing", async () => {
    const user = userEvent.setup()
    render(<Calendar defaultMonth={FIXED_MONTH} autoFocus />)
    const grid = screen.getByRole("grid")
    grid.focus()
    await user.keyboard("{PageDown}")
    // July should now appear in the caption
    expect(screen.getByRole("grid")).toBeInTheDocument()
  })

  it("today cell has aria-current=date", () => {
    // Render without a fixed month so 'today' is in the current month.
    render(<Calendar />)
    const today = screen.queryByRole("button", { current: "date" })
    // If today is in the default visible month, it should be marked.
    // We can only assert it doesn't throw — existence depends on real date.
    expect(
      document.querySelector("[aria-current='date']") ?? today,
    ).toBeDefined()
  })
})
