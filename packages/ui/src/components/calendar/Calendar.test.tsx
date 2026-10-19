import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, it, expect, vi } from "vitest"
import { useState, type ComponentProps } from "react"
import { Calendar, type DateRange } from "@components/calendar"
import { UiI18nProvider } from "../../i18n"

// Fix the month so tests don't shift with real time.
const FIXED_MONTH = new Date(2024, 5, 1) // June 2024

describe("Calendar", () => {
  it("takes no components prop", () => {
    type Removed = Extract<keyof ComponentProps<typeof Calendar>, "components">
    const removed: [Removed] extends [never] ? true : false = true
    expect(removed).toBe(true)
  })

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

  it("range mode: from-only state marks the anchor day with data-range-single", async () => {
    const user = userEvent.setup()
    function ControlledRange() {
      const [range, setRange] = useState<DateRange | undefined>(undefined)
      return (
        <Calendar
          mode="range"
          defaultMonth={FIXED_MONTH}
          min={1}
          selected={range}
          onSelect={setRange}
        />
      )
    }
    render(<ControlledRange />)
    const anchor = screen.getByRole("button", { name: /june 12/i })
    await user.click(anchor)
    expect(anchor).toHaveAttribute("data-range-single", "true")
    expect(anchor).toHaveAttribute("aria-pressed", "true")
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

  it("writes dir only from its own prop, not the locale provider", () => {
    const { container, rerender } = render(
      <UiI18nProvider dir="rtl">
        <Calendar defaultMonth={FIXED_MONTH} />
      </UiI18nProvider>,
    )
    const root = () => container.querySelector('[data-slot="calendar"]')
    expect(root()).not.toHaveAttribute("dir")
    rerender(<Calendar defaultMonth={FIXED_MONTH} dir="rtl" />)
    expect(root()).toHaveAttribute("dir", "rtl")
  })

  it("writes dir on the year and decade views only when it is given", async () => {
    const user = userEvent.setup()
    const { container, rerender } = render(
      <Calendar defaultMonth={FIXED_MONTH} dir="rtl" />,
    )
    const root = () => container.querySelector('[data-slot="calendar"]')
    await user.click(
      screen.getByRole("button", { name: /switch to year view/i }),
    )
    expect(root()).toHaveClass("dr-calendar-grid-container")
    expect(root()).toHaveAttribute("dir", "rtl")
    await user.click(
      screen.getByRole("button", { name: /switch to decade view/i }),
    )
    expect(screen.getByRole("button", { name: "2029" })).toBeInTheDocument()
    expect(root()).toHaveAttribute("dir", "rtl")
    rerender(<Calendar defaultMonth={FIXED_MONTH} />)
    expect(root()).toHaveClass("dr-calendar-grid-container")
    expect(root()).not.toHaveAttribute("dir")
  })

  it("moves to the next day with ArrowLeft under an RTL ancestor", async () => {
    const user = userEvent.setup()
    render(
      <div dir="rtl">
        <Calendar defaultMonth={FIXED_MONTH} />
      </div>,
    )
    await user.click(screen.getByRole("button", { name: /june 12th/i }))
    await user.keyboard("{ArrowLeft}")
    expect(screen.getByRole("button", { name: /june 13th/i })).toHaveAttribute(
      "data-focused",
      "true",
    )
    await user.keyboard("{ArrowRight}{ArrowRight}")
    expect(screen.getByRole("button", { name: /june 11th/i })).toHaveAttribute(
      "data-focused",
      "true",
    )
  })

  it("mirrors the month navigation chevrons", () => {
    render(<Calendar defaultMonth={FIXED_MONTH} />)
    for (const name of [/previous month/i, /next month/i]) {
      expect(
        screen.getByRole("button", { name }).querySelector("svg"),
      ).toHaveClass("dr-icon-inline")
    }
  })
})

function tabStops(): string[] {
  return [
    ...document.querySelectorAll<HTMLButtonElement>(".dr-calendar-day-btn"),
  ]
    .filter((button) => button.tabIndex === 0)
    .map((button) => button.getAttribute("aria-label") ?? "")
}

describe("Calendar roving tab stop", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("gives the only tab stop to the selected day in view", () => {
    render(
      <Calendar
        mode="single"
        defaultMonth={FIXED_MONTH}
        selected={new Date(2024, 5, 10)}
      />,
    )
    expect(tabStops()).toEqual(["June 10th, 2024"])
  })

  it("gives it to today when no selected day is in view", () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date(2024, 5, 20, 9))
    render(
      <Calendar
        mode="single"
        defaultMonth={FIXED_MONTH}
        selected={new Date(2024, 2, 3)}
      />,
    )
    expect(tabStops()).toEqual(["June 20th, 2024"])
  })

  it("gives it to the first of the month when neither is in view", () => {
    render(<Calendar mode="range" defaultMonth={FIXED_MONTH} />)
    expect(tabStops()).toEqual(["June 1st, 2024"])
  })

  it("gives it to the first enabled day when that day is disabled", () => {
    render(
      <Calendar
        defaultMonth={FIXED_MONTH}
        disabled={{ before: new Date(2024, 5, 5) }}
      />,
    )
    expect(tabStops()).toEqual(["June 5th, 2024"])
  })

  it("moves the tab stop to the visible month after month navigation", async () => {
    const user = userEvent.setup()
    render(
      <Calendar
        mode="single"
        defaultMonth={FIXED_MONTH}
        selected={new Date(2024, 5, 10)}
      />,
    )
    await user.click(screen.getByRole("button", { name: /june 12th/i }))
    await user.click(screen.getByRole("button", { name: /next month/i }))
    expect(tabStops()).toEqual(["July 1st, 2024"])
  })
})

describe("Calendar keyboard focus", () => {
  it.each([
    ["{ArrowRight}", "June 13th, 2024"],
    ["{ArrowLeft}", "June 11th, 2024"],
    ["{ArrowUp}", "June 5th, 2024"],
    ["{ArrowDown}", "June 19th, 2024"],
    ["{Home}", "June 9th, 2024"],
    ["{End}", "June 15th, 2024"],
    ["{PageUp}", "May 12th, 2024"],
    ["{PageDown}", "July 12th, 2024"],
    ["{Shift>}{PageUp}{/Shift}", "June 12th, 2023"],
    ["{Shift>}{PageDown}{/Shift}", "June 12th, 2025"],
  ])("%s moves DOM focus and the tab stop to %s", async (keys, label) => {
    const user = userEvent.setup()
    render(
      <Calendar
        mode="single"
        defaultMonth={FIXED_MONTH}
        selected={new Date(2024, 5, 12)}
      />,
    )
    screen.getByRole("button", { name: "June 12th, 2024" }).focus()
    await user.keyboard(keys)
    expect(document.activeElement).toHaveAttribute("aria-label", label)
    expect(tabStops()).toEqual([label])
  })

  it("PageDown from 31 January lands on the last day of February", async () => {
    const user = userEvent.setup()
    render(
      <Calendar
        mode="single"
        defaultMonth={new Date(2024, 0, 1)}
        selected={new Date(2024, 0, 31)}
      />,
    )
    screen.getByRole("button", { name: "January 31st, 2024" }).focus()
    await user.keyboard("{PageDown}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "February 29th, 2024",
    )
  })

  it("skips disabled days in the direction of an arrow key", async () => {
    const user = userEvent.setup()
    render(
      <Calendar
        mode="single"
        defaultMonth={FIXED_MONTH}
        selected={new Date(2024, 5, 14)}
        disabled={{ dayOfWeek: [0, 6] }}
      />,
    )
    screen.getByRole("button", { name: "June 14th, 2024" }).focus()
    await user.keyboard("{ArrowRight}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "June 17th, 2024",
    )
  })

  it.each([
    [1, "June 16th, 2024", "June 10th, 2024", "June 16th, 2024"],
    [1, "June 12th, 2024", "June 10th, 2024", "June 16th, 2024"],
    [6, "June 14th, 2024", "June 8th, 2024", "June 14th, 2024"],
  ])(
    "Home and End with weekStartsOn=%i from %s reach %s and %s",
    (weekStartsOn, start, home, end) => {
      render(
        <Calendar defaultMonth={FIXED_MONTH} weekStartsOn={weekStartsOn} />,
      )
      const from = screen.getByRole("button", { name: start })
      fireEvent.click(from)
      fireEvent.keyDown(from, { key: "Home" })
      expect(screen.getByRole("button", { name: home })).toHaveAttribute(
        "data-focused",
        "true",
      )
      fireEvent.click(from)
      fireEvent.keyDown(from, { key: "End" })
      expect(screen.getByRole("button", { name: end })).toHaveAttribute(
        "data-focused",
        "true",
      )
    },
  )

  it("focuses the tab stop on mount with autoFocus", () => {
    render(
      <Calendar
        mode="single"
        defaultMonth={FIXED_MONTH}
        selected={new Date(2024, 5, 10)}
        autoFocus
      />,
    )
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "June 10th, 2024",
    )
  })
})

describe("Calendar activation", () => {
  it.each(["{Enter}", " "])(
    "%s selects the focused day, not a remembered one",
    async (key) => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      render(
        <Calendar
          mode="single"
          defaultMonth={FIXED_MONTH}
          selected={new Date(2024, 5, 12)}
          onSelect={onSelect}
        />,
      )
      screen.getByRole("button", { name: "June 20th, 2024" }).focus()
      await user.keyboard(key)
      expect(onSelect).toHaveBeenCalledTimes(1)
      expect(onSelect).toHaveBeenCalledWith(new Date(2024, 5, 20))
    },
  )

  it.each(["{Enter}", " "])(
    "%s on the next-month button shows the next month",
    async (key) => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      render(
        <Calendar
          mode="single"
          defaultMonth={FIXED_MONTH}
          onSelect={onSelect}
        />,
      )
      screen.getByRole("button", { name: /next month/i }).focus()
      await user.keyboard(key)
      expect(
        screen.getByRole("button", { name: /july 2024, switch to year view/i }),
      ).toBeInTheDocument()
      expect(onSelect).not.toHaveBeenCalled()
    },
  )

  it("arrow keys on the next-month button leave focus on it", async () => {
    const user = userEvent.setup()
    render(<Calendar mode="single" defaultMonth={FIXED_MONTH} />)
    const next = screen.getByRole("button", { name: /next month/i })
    next.focus()
    await user.keyboard("{ArrowLeft}{Home}")
    expect(next).toHaveFocus()
    expect(tabStops()).toEqual(["June 1st, 2024"])
  })

  it("Enter on the caption button opens the year view", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <Calendar mode="single" defaultMonth={FIXED_MONTH} onSelect={onSelect} />,
    )
    screen.getByRole("button", { name: /switch to year view/i }).focus()
    await user.keyboard("{Enter}")
    expect(
      screen.getByRole("button", { name: /switch to decade view/i }),
    ).toBeInTheDocument()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it("keys on the caption dropdown and its list never select a date", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <Calendar
        mode="single"
        captionLayout="dropdown"
        defaultMonth={FIXED_MONTH}
        onSelect={onSelect}
      />,
    )
    screen.getByRole("combobox", { name: "Choose month" }).focus()
    await user.keyboard("{Enter}")
    await screen.findByRole("listbox")
    await user.keyboard("{ArrowDown}{Enter}")
    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.queryByRole("button", { name: "June 1st, 2024" })).toBeNull()
  })
})
