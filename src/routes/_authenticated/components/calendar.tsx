import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import type { DateRange } from "react-day-picker"
import { CalendarDays } from "lucide-react"
import { PageHeader } from "@/core/layout"
import { Button } from "@/core/components/ui/button"
import { Calendar } from "@/core/components/ui/calendar"
import { DatePicker } from "@/core/components/ui/date-picker"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/core/components/ui/popover"
import { ShowcaseExample } from "./_components/-showcase-example"

export const Route = createFileRoute("/_authenticated/components/calendar")({
  component: CalendarPage,
})

function DatePickerPopoverExample() {
  const [date, setDate] = useState<Date | undefined>()
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-64 justify-start text-left font-normal"
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {date ? date.toLocaleDateString() : "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            setDate(d)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

function DateRangePickerPopoverExample() {
  const [range, setRange] = useState<DateRange | undefined>()
  const [open, setOpen] = useState(false)

  const label = range?.from
    ? range.to
      ? `${range.from.toLocaleDateString()} — ${range.to.toLocaleDateString()}`
      : range.from.toLocaleDateString()
    : "Pick a date range"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-72 justify-start text-left font-normal"
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={(r) => {
            setRange(r)
            if (r?.from && r?.to) setOpen(false)
          }}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  )
}

function CalendarPage() {
  const [selected, setSelected] = useState<Date | undefined>(new Date())
  const [range, setRange] = useState<DateRange | undefined>()
  const [pickerDate, setPickerDate] = useState<Date | undefined>(new Date())
  const [multiDates, setMultiDates] = useState<Date[] | undefined>()

  const today = new Date()
  const disabledDays = [
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2),
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3),
    { dayOfWeek: [0, 6] },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Components", href: "/components" },
          { label: "Calendar" },
        ]}
        title="Calendar"
        description="A date picker built on react-day-picker with full keyboard navigation."
      />

      <div className="space-y-6">
        <ShowcaseExample
          title="Basic calendar"
          code={`const [selected, setSelected] = useState<Date | undefined>(new Date())

<div className="space-y-3">
  <Calendar
    mode="single"
    selected={selected}
    onSelect={setSelected}
    className="rounded-md border"
  />
  {selected && (
    <p className="text-sm text-muted-foreground">
      Selected: {selected.toLocaleDateString()}
    </p>
  )}
</div>`}
        >
          <div className="space-y-3">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={setSelected}
              className="rounded-md border"
            />
            {selected && (
              <p className="text-muted-foreground text-sm">
                Selected: {selected.toLocaleDateString()}
              </p>
            )}
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Date range selection"
          code={`const [range, setRange] = useState<DateRange | undefined>()

<div className="space-y-3">
  <Calendar
    mode="range"
    selected={range}
    onSelect={setRange}
    className="rounded-md border"
  />
  {range?.from && (
    <p className="text-sm text-muted-foreground">
      From: {range.from.toLocaleDateString()}
      {range.to ? \` — To: \${range.to.toLocaleDateString()}\` : ""}
    </p>
  )}
</div>`}
        >
          <div className="space-y-3">
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              className="rounded-md border"
            />
            {range?.from && (
              <p className="text-muted-foreground text-sm">
                From: {range.from.toLocaleDateString()}
                {range.to ? ` — To: ${range.to.toLocaleDateString()}` : ""}
              </p>
            )}
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Multi-view date picker — click header to switch between day, month, and year views"
          code={`const [date, setDate] = useState<Date | undefined>(new Date())

<DatePicker value={date} onChange={setDate} />`}
        >
          <div className="space-y-3">
            <DatePicker value={pickerDate} onChange={setPickerDate} />
            {pickerDate && (
              <p className="text-muted-foreground text-sm">
                Selected: {pickerDate.toLocaleDateString()}
              </p>
            )}
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Disabled dates — weekends and next 3 days blocked"
          code={`<Calendar
  mode="single"
  disabled={[
    { dayOfWeek: [0, 6] },
    new Date(2026, 3, 7),
    new Date(2026, 3, 8),
    new Date(2026, 3, 9),
  ]}
  className="rounded-md border"
/>`}
        >
          <Calendar
            mode="single"
            disabled={disabledDays}
            className="rounded-md border"
          />
        </ShowcaseExample>

        <ShowcaseExample
          title="Multiple dates selection"
          code={`const [multiDates, setMultiDates] = useState<Date[] | undefined>()

<div className="space-y-3">
  <Calendar
    mode="multiple"
    selected={multiDates}
    onSelect={setMultiDates}
    className="rounded-md border"
  />
  <p className="text-sm text-muted-foreground">
    {multiDates?.length ? \`\${multiDates.length} date(s) selected\` : "No dates selected"}
  </p>
</div>`}
        >
          <div className="space-y-3">
            <Calendar
              mode="multiple"
              selected={multiDates}
              onSelect={setMultiDates}
              className="rounded-md border"
            />
            <p className="text-muted-foreground text-sm">
              {multiDates?.length
                ? `${multiDates.length} date(s) selected`
                : "No dates selected"}
            </p>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Calendar with dropdown navigation"
          code={`<Calendar
  mode="single"
  captionLayout="dropdown"
  fromYear={2020}
  toYear={2030}
  className="rounded-md border"
/>`}
        >
          <Calendar
            mode="single"
            captionLayout="dropdown"
            fromYear={2020}
            toYear={2030}
            className="rounded-md border"
          />
        </ShowcaseExample>

        <ShowcaseExample
          title="Two months side by side"
          code={`<Calendar
  mode="range"
  numberOfMonths={2}
  className="rounded-md border"
/>`}
        >
          <Calendar
            mode="range"
            numberOfMonths={2}
            className="rounded-md border"
          />
        </ShowcaseExample>

        <ShowcaseExample
          title="Custom start of week"
          code={`<div className="space-y-3">
  <Calendar
    mode="single"
    weekStartsOn={1}
    className="rounded-md border"
  />
  <p className="text-sm text-muted-foreground">
    weekStartsOn={1} shifts the first column to Monday (0 = Sunday, 1 = Monday, … 6 = Saturday).
  </p>
</div>`}
        >
          <div className="space-y-3">
            <Calendar
              mode="single"
              weekStartsOn={1}
              className="rounded-md border"
            />
            <p className="text-muted-foreground text-sm">
              {"weekStartsOn={1}"} shifts the first column to Monday (0 =
              Sunday, 1 = Monday, … 6 = Saturday).
            </p>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Date picker in popover"
          code={`function DatePickerPopoverExample() {
  const [date, setDate] = useState<Date | undefined>()
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-64 justify-start text-left font-normal">
          <CalendarDays className="mr-2 h-4 w-4" />
          {date ? date.toLocaleDateString() : "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => { setDate(d); setOpen(false) }}
        />
      </PopoverContent>
    </Popover>
  )
}`}
        >
          <DatePickerPopoverExample />
        </ShowcaseExample>

        <ShowcaseExample
          title="Date range picker in popover"
          code={`function DateRangePickerPopoverExample() {
  const [range, setRange] = useState<DateRange | undefined>()
  const [open, setOpen] = useState(false)

  const label = range?.from
    ? range.to
      ? \`\${range.from.toLocaleDateString()} — \${range.to.toLocaleDateString()}\`
      : range.from.toLocaleDateString()
    : "Pick a date range"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-72 justify-start text-left font-normal">
          <CalendarDays className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={(r) => {
            setRange(r)
            if (r?.from && r?.to) setOpen(false)
          }}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  )
}`}
        >
          <DateRangePickerPopoverExample />
        </ShowcaseExample>
      </div>
    </div>
  )
}
