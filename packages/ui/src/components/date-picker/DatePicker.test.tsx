import * as React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { format, parse as dfParse } from "date-fns"

import {
  DatePicker,
  DatePickerCalendar,
  DatePickerContent,
  DatePickerControl,
  DatePickerInput,
  DatePickerLabel,
  DatePickerPreset,
  DatePickerPresets,
  DatePickerTrigger,
  type DatePickerRangeValue,
  type DatePickerSingleValue,
  type DatePickerValueChangeDetails,
} from "./DatePicker"

const FIXED = new Date(2024, 5, 15)

interface SingleProps {
  initial?: Date | null
  disabled?: boolean
  min?: Date
  max?: Date
  onChange?: (
    details: DatePickerValueChangeDetails<DatePickerSingleValue>,
  ) => void
  parseInput?: boolean
}

function SingleHarness({
  initial = null,
  disabled,
  min,
  max,
  onChange,
  parseInput,
}: SingleProps) {
  const [value, setValue] = React.useState<Date | null>(initial)
  return (
    <DatePicker
      mode="single"
      value={value}
      onValueChange={(d) => {
        setValue(d.value)
        onChange?.(d)
      }}
      disabled={disabled}
      min={min}
      max={max}
      placeholder="Pick a date"
      format={(d) => format(d, "yyyy-MM-dd")}
      parse={
        parseInput
          ? (input) => {
              const parsed = dfParse(input, "yyyy-MM-dd", new Date())
              return Number.isNaN(parsed.getTime()) ? null : parsed
            }
          : undefined
      }
    >
      <DatePickerLabel>Date</DatePickerLabel>
      <DatePickerControl>
        <DatePickerInput />
        <DatePickerTrigger>open</DatePickerTrigger>
      </DatePickerControl>
      <DatePickerContent>
        <DatePickerCalendar
          defaultMonth={min ?? max ?? FIXED}
          captionLayout="label"
        />
        <DatePickerPresets>
          <DatePickerPreset value={FIXED}>Fixed day</DatePickerPreset>
        </DatePickerPresets>
      </DatePickerContent>
    </DatePicker>
  )
}

interface RangeHarnessProps {
  onChange?: (
    details: DatePickerValueChangeDetails<DatePickerRangeValue>,
  ) => void
}

function RangeHarness({ onChange }: RangeHarnessProps) {
  const [value, setValue] = React.useState<DatePickerRangeValue>({})
  return (
    <DatePicker
      mode="range"
      value={value}
      onValueChange={(d) => {
        setValue(d.value)
        onChange?.(d)
      }}
    >
      <DatePickerControl>
        <DatePickerInput />
        <DatePickerTrigger>open</DatePickerTrigger>
      </DatePickerControl>
      <DatePickerContent>
        <DatePickerCalendar defaultMonth={FIXED} />
      </DatePickerContent>
    </DatePicker>
  )
}

async function openTrigger(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /open date picker/i }))
}

describe("DatePicker", () => {
  it("renders input and trigger", () => {
    render(<SingleHarness />)
    expect(screen.getByText("Date")).toBeInTheDocument()
    const input = screen.getByPlaceholderText("Pick a date")
    expect(input).toBeInTheDocument()
    const trigger = screen.getByRole("button", { name: /open date picker/i })
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog")
    expect(trigger).toHaveAttribute("aria-expanded", "false")
  })

  it("trigger click opens the popover", async () => {
    const user = userEvent.setup()
    render(<SingleHarness />)
    await openTrigger(user)
    const dialog = await screen.findByRole("dialog")
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getAllByRole("gridcell").length).toBeGreaterThan(0)
  })

  it("selecting a day in single mode commits and closes", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<SingleHarness onChange={spy} />)
    await openTrigger(user)
    const dialog = await screen.findByRole("dialog")
    const day = within(dialog).getByRole("button", { name: /June 15th, 2024/i })
    await user.click(day)
    expect(spy).toHaveBeenCalled()
    const last = spy.mock.calls[spy.mock.calls.length - 1]?.[0]
    expect(last.value).toBeInstanceOf(Date)
    expect((last.value as Date).getFullYear()).toBe(2024)
    expect((last.value as Date).getMonth()).toBe(5)
    expect((last.value as Date).getDate()).toBe(15)
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("range mode: two clicks set from then to", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<RangeHarness onChange={spy} />)
    await openTrigger(user)
    let dialog = await screen.findByRole("dialog")
    const first = within(dialog).getByRole("button", {
      name: /June 10th, 2024/i,
    })
    await user.click(first)
    let last = spy.mock.calls[spy.mock.calls.length - 1]?.[0]
    expect(last.value.from).toBeInstanceOf(Date)
    expect((last.value.from as Date).getDate()).toBe(10)
    expect(last.value.to).toBeUndefined()

    dialog = await screen.findByRole("dialog")
    const second = within(dialog).getByRole("button", {
      name: /June 20th, 2024/i,
    })
    await user.click(second)
    last = spy.mock.calls[spy.mock.calls.length - 1]?.[0]
    expect((last.value.from as Date).getDate()).toBe(10)
    expect((last.value.to as Date).getDate()).toBe(20)
  })

  it("preset click commits and closes", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<SingleHarness onChange={spy} />)
    await openTrigger(user)
    const preset = await screen.findByRole("button", { name: "Fixed day" })
    await user.click(preset)
    const last = spy.mock.calls[spy.mock.calls.length - 1]?.[0]
    expect(last.value).toBeInstanceOf(Date)
    expect((last.value as Date).getDate()).toBe(15)
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("min disables out-of-range days", async () => {
    const user = userEvent.setup()
    const min = new Date(2024, 5, 10)
    render(<SingleHarness min={min} />)
    await openTrigger(user)
    const dialog = await screen.findByRole("dialog")
    const dayBefore = within(dialog).getByRole("button", {
      name: /June 9th, 2024/i,
    })
    expect(dayBefore).toBeDisabled()
    const dayAfter = within(dialog).getByRole("button", {
      name: /June 11th, 2024/i,
    })
    expect(dayAfter).not.toBeDisabled()
  })

  it("disabled prevents trigger click from opening", async () => {
    const user = userEvent.setup()
    render(<SingleHarness disabled />)
    const trigger = screen.getByRole("button", { name: /open date picker/i })
    expect(trigger).toBeDisabled()
    await user.click(trigger)
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("typing a parseable date in single mode commits on blur", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<SingleHarness parseInput onChange={spy} />)
    const input = screen.getByPlaceholderText("Pick a date")
    await user.click(input)
    await user.type(input, "2024-06-15")
    await user.tab()
    const last = spy.mock.calls[spy.mock.calls.length - 1]?.[0]
    expect(last.value).toBeInstanceOf(Date)
    expect((last.value as Date).getFullYear()).toBe(2024)
    expect((last.value as Date).getMonth()).toBe(5)
    expect((last.value as Date).getDate()).toBe(15)
  })

  it("range mode input is read-only", () => {
    render(<RangeHarness />)
    const inputs = screen
      .getAllByRole("textbox")
      .filter((el) => el.tagName === "INPUT")
    expect(inputs.length).toBeGreaterThan(0)
    expect(inputs[0]).toHaveAttribute("readonly")
  })
})
