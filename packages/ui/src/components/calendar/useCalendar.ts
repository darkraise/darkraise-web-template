"use client"

import * as React from "react"

import { useControllableState } from "@primitives/state"
import {
  type CalendarMatcher,
  addMonths,
  buildMonthMatrix,
  matchesAny,
  startOfMonth,
} from "./dateUtils"

export type CalendarMode = "single" | "multi" | "range"

export interface UseCalendarOptions {
  month?: Date
  defaultMonth?: Date
  onMonthChange?: (d: Date) => void
  weekStartsOn?: number
  disabled?: CalendarMatcher | CalendarMatcher[]
}

export interface UseCalendarReturn {
  month: Date
  setMonth: (d: Date) => void
  goPrev: () => void
  goNext: () => void
  matrix: ReturnType<typeof buildMonthMatrix>
  isDisabled: (date: Date) => boolean
}

export function useCalendar(
  options: UseCalendarOptions = {},
): UseCalendarReturn {
  const {
    month: monthProp,
    defaultMonth,
    onMonthChange,
    weekStartsOn = 0,
    disabled,
  } = options

  const [month, setMonth] = useControllableState<Date>({
    value: monthProp,
    defaultValue: defaultMonth ?? startOfMonth(new Date()),
    onChange: onMonthChange,
  })

  const goPrev = React.useCallback(() => {
    setMonth(addMonths(month, -1))
  }, [month, setMonth])

  const goNext = React.useCallback(() => {
    setMonth(addMonths(month, 1))
  }, [month, setMonth])

  const matrix = React.useMemo(
    () => buildMonthMatrix(month, weekStartsOn),
    [month, weekStartsOn],
  )

  const isDisabled = React.useCallback(
    (date: Date) => {
      if (!disabled) return false
      const matchers = Array.isArray(disabled) ? disabled : [disabled]
      return matchesAny(date, matchers)
    },
    [disabled],
  )

  return { month, setMonth, goPrev, goNext, matrix, isDisabled }
}
