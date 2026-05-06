import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"
import { CalendarDays } from "lucide-react"
import { addDays, format, parse, startOfMonth } from "date-fns"

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
} from "./DatePicker"

const meta: Meta<typeof DatePicker> = {
  title: "UI/DatePicker",
  component: DatePicker,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof DatePicker>

export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState<Date | null>(null)
    return (
      <div className="w-72">
        <DatePicker
          mode="single"
          value={value}
          onValueChange={(d) => setValue(d.value)}
          placeholder="Pick a date"
        >
          <DatePickerLabel>Date</DatePickerLabel>
          <DatePickerControl>
            <DatePickerInput />
            <DatePickerTrigger>
              <CalendarDays className="h-4 w-4" />
            </DatePickerTrigger>
          </DatePickerControl>
          <DatePickerContent>
            <DatePickerCalendar />
          </DatePickerContent>
        </DatePicker>
      </div>
    )
  },
}

export const Range: Story = {
  render: () => {
    const [value, setValue] = React.useState<DatePickerRangeValue>({})
    return (
      <div className="w-80">
        <DatePicker
          mode="range"
          value={value}
          onValueChange={(d) => setValue(d.value)}
          placeholder="Pick a range"
        >
          <DatePickerLabel>Range</DatePickerLabel>
          <DatePickerControl>
            <DatePickerInput />
            <DatePickerTrigger>
              <CalendarDays className="h-4 w-4" />
            </DatePickerTrigger>
          </DatePickerControl>
          <DatePickerContent>
            <DatePickerCalendar numberOfMonths={2} />
          </DatePickerContent>
        </DatePicker>
      </div>
    )
  },
}

export const WithPresets: Story = {
  render: () => {
    const [value, setValue] = React.useState<Date | null>(null)
    return (
      <div className="w-72">
        <DatePicker
          mode="single"
          value={value}
          onValueChange={(d) => setValue(d.value)}
          placeholder="Pick a date"
          format={(d) => format(d, "PPP")}
          parse={(input) => {
            const parsed = parse(input, "yyyy-MM-dd", new Date())
            return Number.isNaN(parsed.getTime()) ? null : parsed
          }}
        >
          <DatePickerLabel>Deadline</DatePickerLabel>
          <DatePickerControl>
            <DatePickerInput />
            <DatePickerTrigger>
              <CalendarDays className="h-4 w-4" />
            </DatePickerTrigger>
          </DatePickerControl>
          <DatePickerContent>
            <DatePickerCalendar />
            <DatePickerPresets>
              <DatePickerPreset value={new Date()}>Today</DatePickerPreset>
              <DatePickerPreset value={addDays(new Date(), 1)}>
                Tomorrow
              </DatePickerPreset>
              <DatePickerPreset value={addDays(new Date(), 7)}>
                In a week
              </DatePickerPreset>
              <DatePickerPreset value={startOfMonth(new Date())}>
                Start of month
              </DatePickerPreset>
            </DatePickerPresets>
          </DatePickerContent>
        </DatePicker>
      </div>
    )
  },
}

export const MinMax: Story = {
  render: () => {
    const [value, setValue] = React.useState<Date | null>(null)
    const today = new Date()
    return (
      <div className="w-72">
        <DatePicker
          mode="single"
          value={value}
          onValueChange={(d) => setValue(d.value)}
          min={addDays(today, -7)}
          max={addDays(today, 14)}
        >
          <DatePickerLabel>Bookable date</DatePickerLabel>
          <DatePickerControl>
            <DatePickerInput />
            <DatePickerTrigger>
              <CalendarDays className="h-4 w-4" />
            </DatePickerTrigger>
          </DatePickerControl>
          <DatePickerContent>
            <DatePickerCalendar defaultMonth={today} />
          </DatePickerContent>
        </DatePicker>
      </div>
    )
  },
}
