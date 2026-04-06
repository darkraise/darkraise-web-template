import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import type { DateRange } from "react-day-picker"
import { PageHeader } from "@/core/layout"
import { Calendar } from "@/core/components/ui/calendar"
import { DatePicker } from "@/core/components/ui/date-picker"
import { ShowcaseExample } from "./_components/-showcase-example"

export const Route = createFileRoute("/_authenticated/components/calendar")({
  component: CalendarPage,
})

function CalendarPage() {
  const [selected, setSelected] = useState<Date | undefined>(new Date())
  const [range, setRange] = useState<DateRange | undefined>()
  const [pickerDate, setPickerDate] = useState<Date | undefined>(new Date())

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
      </div>
    </div>
  )
}
