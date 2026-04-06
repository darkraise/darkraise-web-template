import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { addDays, format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { CalendarDays } from "lucide-react"
import { PageHeader } from "@/core/layout"
import { Button } from "@/core/components/ui/button"
import { Calendar } from "@/core/components/ui/calendar"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/core/components/ui/popover"
import { ShowcaseExample } from "./_components/-showcase-example"

export const Route = createFileRoute("/_authenticated/components/calendar")({
  component: CalendarPage,
})

function CalendarWithPresets() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  const presets = [
    { label: "Today", days: 0 },
    { label: "Tomorrow", days: 1 },
    { label: "In 3 days", days: 3 },
    { label: "In a week", days: 7 },
    { label: "In 2 weeks", days: 14 },
  ]

  const isPresetSelected = (days: number) => {
    if (!date) return false
    const preset = addDays(new Date(), days)
    return (
      date.getFullYear() === preset.getFullYear() &&
      date.getMonth() === preset.getMonth() &&
      date.getDate() === preset.getDate()
    )
  }

  return (
    <div className="flex rounded-md border">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        month={date}
        className="border-0"
      />
      <div className="flex flex-col gap-1 border-l p-3">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant={isPresetSelected(preset.days) ? "default" : "ghost"}
            size="sm"
            className="justify-start"
            onClick={() => setDate(addDays(new Date(), preset.days))}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

function DateTimePicker() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("17:00")

  return (
    <div className="rounded-md border">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="border-0"
      />
      <div className="space-y-2 border-t p-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="start" className="w-20 text-xs">
            Start Time
          </Label>
          <Input
            id="start"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="end" className="w-20 text-xs">
            End Time
          </Label>
          <Input
            id="end"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="h-8"
          />
        </div>
      </div>
    </div>
  )
}

function DatePickerPopover() {
  const [date, setDate] = useState<Date | undefined>()
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="data-[empty]:text-muted-foreground w-64 justify-start text-left font-normal"
          data-empty={!date ? "" : undefined}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : "Pick a date"}
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

function DateRangePickerPopover() {
  const [range, setRange] = useState<DateRange | undefined>()
  const [open, setOpen] = useState(false)

  const label = range?.from
    ? range.to
      ? `${format(range.from, "LLL dd, y")} — ${format(range.to, "LLL dd, y")}`
      : format(range.from, "LLL dd, y")
    : "Pick a date range"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="data-[empty]:text-muted-foreground w-72 justify-start text-left font-normal"
          data-empty={!range?.from ? "" : undefined}
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

function DateOfBirthPicker() {
  const [date, setDate] = useState<Date | undefined>()
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="data-[empty]:text-muted-foreground w-64 justify-start text-left font-normal"
          data-empty={!date ? "" : undefined}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : "Date of birth"}
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
          captionLayout="dropdown"
          fromYear={1900}
          toYear={new Date().getFullYear()}
        />
      </PopoverContent>
    </Popover>
  )
}

function CalendarPage() {
  const [selected, setSelected] = useState<Date | undefined>(new Date())
  const [range, setRange] = useState<DateRange | undefined>()

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
      Selected: {format(selected, "PPP")}
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
                Selected: {format(selected, "PPP")}
              </p>
            )}
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Range calendar"
          code={`const [range, setRange] = useState<DateRange | undefined>()

<Calendar
  mode="range"
  selected={range}
  onSelect={setRange}
  numberOfMonths={2}
  className="rounded-md border"
/>`}
        >
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            numberOfMonths={2}
            className="rounded-md border"
          />
        </ShowcaseExample>

        <ShowcaseExample
          title="Month and year selector"
          code={`<Calendar
  mode="single"
  captionLayout="dropdown"
  fromYear={2000}
  toYear={2030}
  className="rounded-md border"
/>`}
        >
          <Calendar
            mode="single"
            captionLayout="dropdown"
            fromYear={2000}
            toYear={2030}
            className="rounded-md border"
          />
        </ShowcaseExample>

        <ShowcaseExample
          title="Presets"
          code={`function CalendarWithPresets() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  const presets = [
    { label: "Today", days: 0 },
    { label: "Tomorrow", days: 1 },
    { label: "In 3 days", days: 3 },
    { label: "In a week", days: 7 },
    { label: "In 2 weeks", days: 14 },
  ]

  return (
    <div className="flex rounded-md border">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        month={date}
        className="border-0"
      />
      <div className="flex flex-col gap-1 border-l p-3">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={() => setDate(addDays(new Date(), preset.days))}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  )
}`}
        >
          <CalendarWithPresets />
        </ShowcaseExample>

        <ShowcaseExample
          title="Date and time picker"
          code={`function DateTimePicker() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("17:00")

  return (
    <div className="rounded-md border">
      <Calendar mode="single" selected={date} onSelect={setDate} className="border-0" />
      <div className="border-t p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="start" className="w-20 text-xs">Start Time</Label>
          <Input id="start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-8" />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="end" className="w-20 text-xs">End Time</Label>
          <Input id="end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-8" />
        </div>
      </div>
    </div>
  )
}`}
        >
          <DateTimePicker />
        </ShowcaseExample>

        <ShowcaseExample
          title="Custom cell size"
          code={`<Calendar
  mode="single"
  className="rounded-md border [--cell-size:2.75rem]"
/>`}
        >
          <Calendar
            mode="single"
            className="rounded-md border [--cell-size:2.75rem]"
          />
        </ShowcaseExample>

        <ShowcaseExample
          title="Week numbers"
          code={`<Calendar
  mode="single"
  showWeekNumber
  className="rounded-md border"
/>`}
        >
          <Calendar
            mode="single"
            showWeekNumber
            className="rounded-md border"
          />
        </ShowcaseExample>

        <ShowcaseExample
          title="Date picker in popover"
          code={`function DatePickerPopover() {
  const [date, setDate] = useState<Date | undefined>()
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-64 justify-start text-left font-normal data-[empty]:text-muted-foreground"
          data-empty={!date ? "" : undefined}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : "Pick a date"}
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
          <DatePickerPopover />
        </ShowcaseExample>

        <ShowcaseExample
          title="Date range picker in popover"
          code={`function DateRangePickerPopover() {
  const [range, setRange] = useState<DateRange | undefined>()
  const [open, setOpen] = useState(false)

  const label = range?.from
    ? range.to
      ? \`\${format(range.from, "LLL dd, y")} — \${format(range.to, "LLL dd, y")}\`
      : format(range.from, "LLL dd, y")
    : "Pick a date range"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-72 justify-start text-left font-normal data-[empty]:text-muted-foreground"
          data-empty={!range?.from ? "" : undefined}
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
}`}
        >
          <DateRangePickerPopover />
        </ShowcaseExample>

        <ShowcaseExample
          title="Date of birth picker"
          code={`function DateOfBirthPicker() {
  const [date, setDate] = useState<Date | undefined>()
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-64 justify-start text-left font-normal data-[empty]:text-muted-foreground"
          data-empty={!date ? "" : undefined}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : "Date of birth"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => { setDate(d); setOpen(false) }}
          captionLayout="dropdown"
          fromYear={1900}
          toYear={new Date().getFullYear()}
        />
      </PopoverContent>
    </Popover>
  )
}`}
        >
          <DateOfBirthPicker />
        </ShowcaseExample>
      </div>
    </div>
  )
}
