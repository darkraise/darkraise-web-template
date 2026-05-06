import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
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
} from "darkraise-ui/components/date-picker"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/date-picker")({
  component: DatePickerPage,
})

function SingleWithMask() {
  const [value, setValue] = useState<Date | null>(null)
  return (
    <div className="w-72">
      <DatePicker
        mode="single"
        value={value}
        onValueChange={(d) => setValue(d.value)}
        placeholder="yyyy-MM-dd"
        format={(d) => format(d, "yyyy-MM-dd")}
        parse={(input) => {
          const parsed = parse(input, "yyyy-MM-dd", new Date())
          return Number.isNaN(parsed.getTime()) ? null : parsed
        }}
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
}

function RangeTwoMonths() {
  const [value, setValue] = useState<DatePickerRangeValue>({})
  return (
    <div className="w-80">
      <DatePicker
        mode="range"
        value={value}
        onValueChange={(d) => setValue(d.value)}
        placeholder="Pick a range"
      >
        <DatePickerLabel>Stay</DatePickerLabel>
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
}

function WithPresets() {
  const [value, setValue] = useState<Date | null>(null)
  return (
    <div className="w-72">
      <DatePicker
        mode="single"
        value={value}
        onValueChange={(d) => setValue(d.value)}
        placeholder="Pick a date"
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
}

function ConstrainedRange() {
  const [value, setValue] = useState<Date | null>(null)
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
}

function DatePickerPage() {
  return (
    <ShowcasePage
      title="DatePicker"
      description="A date input with a calendar popover. Composes Popover, Input, and Calendar with single-date plus range plus preset support."
    >
      <ShowcaseExample
        title="Single date with input mask"
        code={`const [value, setValue] = useState<Date | null>(null)

<DatePicker
  mode="single"
  value={value}
  onValueChange={(d) => setValue(d.value)}
  placeholder="yyyy-MM-dd"
  format={(d) => format(d, "yyyy-MM-dd")}
  parse={(input) => {
    const parsed = parse(input, "yyyy-MM-dd", new Date())
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }}
>
  <DatePickerLabel>Date</DatePickerLabel>
  <DatePickerControl>
    <DatePickerInput />
    <DatePickerTrigger><CalendarDays className="h-4 w-4" /></DatePickerTrigger>
  </DatePickerControl>
  <DatePickerContent>
    <DatePickerCalendar />
  </DatePickerContent>
</DatePicker>`}
      >
        <SingleWithMask />
      </ShowcaseExample>

      <ShowcaseExample
        title="Range with two-month view"
        code={`const [value, setValue] = useState<DatePickerRangeValue>({})

<DatePicker mode="range" value={value} onValueChange={(d) => setValue(d.value)}>
  <DatePickerLabel>Stay</DatePickerLabel>
  <DatePickerControl>
    <DatePickerInput />
    <DatePickerTrigger><CalendarDays className="h-4 w-4" /></DatePickerTrigger>
  </DatePickerControl>
  <DatePickerContent>
    <DatePickerCalendar numberOfMonths={2} />
  </DatePickerContent>
</DatePicker>`}
      >
        <RangeTwoMonths />
      </ShowcaseExample>

      <ShowcaseExample
        title="With presets"
        code={`<DatePicker mode="single" value={value} onValueChange={(d) => setValue(d.value)}>
  ...
  <DatePickerContent>
    <DatePickerCalendar />
    <DatePickerPresets>
      <DatePickerPreset value={new Date()}>Today</DatePickerPreset>
      <DatePickerPreset value={addDays(new Date(), 1)}>Tomorrow</DatePickerPreset>
      <DatePickerPreset value={addDays(new Date(), 7)}>In a week</DatePickerPreset>
      <DatePickerPreset value={startOfMonth(new Date())}>Start of month</DatePickerPreset>
    </DatePickerPresets>
  </DatePickerContent>
</DatePicker>`}
      >
        <WithPresets />
      </ShowcaseExample>

      <ShowcaseExample
        title="Min/max constraints"
        code={`<DatePicker
  mode="single"
  value={value}
  onValueChange={(d) => setValue(d.value)}
  min={addDays(today, -7)}
  max={addDays(today, 14)}
>
  ...
  <DatePickerContent>
    <DatePickerCalendar defaultMonth={today} />
  </DatePickerContent>
</DatePicker>`}
      >
        <ConstrainedRange />
      </ShowcaseExample>
    </ShowcasePage>
  )
}
