"use client"

import * as React from "react"
import { CalendarDays } from "lucide-react"

import {
  DatePicker,
  DatePickerCalendar,
  DatePickerContent,
  DatePickerTrigger,
} from "@components/date-picker"

export interface VirtualizedTimelineJumpToDateProps {
  min?: Date
  max?: Date
  onJump: (date: Date) => void
}

export function VirtualizedTimelineJumpToDate({
  min,
  max,
  onJump,
}: VirtualizedTimelineJumpToDateProps) {
  const [value, setValue] = React.useState<Date | null>(null)
  return (
    <DatePicker
      mode="single"
      value={value}
      min={min}
      max={max}
      onValueChange={(next) => {
        setValue(next.value)
        if (next.value) onJump(next.value)
      }}
    >
      {/* Trigger only, no DatePickerInput: without a `parse` the input is
          read-only and silently swallows every keystroke — a broken
          affordance, worse than no input. The dr-btn classes restyle the
          trigger as a toolbar button (see virtualized-timeline.css). */}
      <DatePickerTrigger
        aria-label="Jump to date"
        className="dr-btn"
        data-variant="outline"
        data-size="sm"
      >
        <CalendarDays />
        Jump to date
      </DatePickerTrigger>
      <DatePickerContent>
        <DatePickerCalendar />
      </DatePickerContent>
    </DatePicker>
  )
}
