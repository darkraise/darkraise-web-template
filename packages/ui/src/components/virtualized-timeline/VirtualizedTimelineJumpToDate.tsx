"use client"

import * as React from "react"
import { CalendarDays } from "lucide-react"

import {
  DatePicker,
  DatePickerCalendar,
  DatePickerContent,
  DatePickerControl,
  DatePickerInput,
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
      placeholder="Jump to date"
      onValueChange={(next) => {
        setValue(next.value)
        if (next.value) onJump(next.value)
      }}
    >
      <DatePickerControl>
        <DatePickerInput aria-label="Jump to date" />
        <DatePickerTrigger>
          <CalendarDays />
        </DatePickerTrigger>
      </DatePickerControl>
      <DatePickerContent>
        <DatePickerCalendar />
      </DatePickerContent>
    </DatePicker>
  )
}
