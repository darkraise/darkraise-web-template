"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "@lib/utils"
import { Button } from "@components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/select"
import {
  type CalendarMatcher,
  type DateRange,
  addDays,
  addMonths,
  buildMonthMatrix,
  getISOWeek,
  isSameDay,
  matchesAny,
  startOfDay,
  startOfMonth,
} from "./dateUtils"
import "./calendar.css"

export type { CalendarMatcher as Matcher, DateRange }

type CalendarMode = "single" | "multi" | "range"
type CalendarView = "day" | "year" | "decade"
type CaptionLayout = "label" | "dropdown" | "dropdown-months" | "dropdown-years"

type CalendarSelected = Date | Date[] | DateRange | undefined

interface BaseProps {
  className?: string
  classNames?: Partial<Record<string, string>>
  showOutsideDays?: boolean
  showWeekNumber?: boolean
  captionLayout?: CaptionLayout
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
  components?: unknown
  month?: Date
  defaultMonth?: Date
  onMonthChange?: (d: Date) => void
  numberOfMonths?: number
  disabled?: CalendarMatcher | CalendarMatcher[]
  weekStartsOn?: number
  autoFocus?: boolean
  /** RTL support — reverses arrow-key direction */
  dir?: "ltr" | "rtl"
  fromYear?: number
  toYear?: number
  locale?: string | string[]
}

interface SingleProps extends BaseProps {
  mode?: "single"
  selected?: Date | undefined
  onSelect?: (date: Date | undefined) => void
}

interface MultiProps extends BaseProps {
  mode: "multi"
  selected?: Date[]
  onSelect?: (dates: Date[]) => void
}

interface RangeProps extends BaseProps {
  mode: "range"
  selected?: DateRange | undefined
  onSelect?: (range: DateRange | undefined) => void
  /** minimum days required between from and to. min=1 means a 2nd click is needed. */
  min?: number
}

export type CalendarProps = SingleProps | MultiProps | RangeProps

const DEFAULT_WEEK_STARTS_ON = 0

function getWeekdayNames(
  weekStartsOn: number,
  locale?: string | string[],
): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" })
  const ref = new Date(2024, 5, 2) // Sunday June 2 2024
  const out: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = addDays(ref, (i + weekStartsOn) % 7)
    out.push(fmt.format(d))
  }
  return out
}

function getMonthFormatter(locale?: string | string[]): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" })
}

function getDayLabelFormatter(locale?: string | string[]): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
    weekday: "long",
  })
}

function ordinalDayLabel(date: Date, locale?: string | string[]): string {
  // We previously used react-day-picker's "June 15th, 2024" style; mimic it by
  // appending an English ordinal suffix when locale is unspecified or English.
  const langs = Array.isArray(locale) ? locale : locale ? [locale] : ["en-US"]
  const isEnglish = langs.some((l) => l.toLowerCase().startsWith("en"))
  if (!isEnglish) {
    return getDayLabelFormatter(locale).format(date)
  }
  const monthFmt = new Intl.DateTimeFormat(locale, { month: "long" })
  const yearFmt = new Intl.DateTimeFormat(locale, { year: "numeric" })
  const day = date.getDate()
  const suffix =
    day % 100 >= 11 && day % 100 <= 13
      ? "th"
      : day % 10 === 1
        ? "st"
        : day % 10 === 2
          ? "nd"
          : day % 10 === 3
            ? "rd"
            : "th"
  return `${monthFmt.format(date)} ${day}${suffix}, ${yearFmt.format(date)}`
}

function Calendar(props: CalendarProps) {
  const {
    className,
    classNames,
    showOutsideDays = true,
    showWeekNumber = false,
    captionLayout = "label",
    buttonVariant = "ghost",
    month: monthProp,
    defaultMonth,
    onMonthChange,
    numberOfMonths = 1,
    disabled,
    weekStartsOn = DEFAULT_WEEK_STARTS_ON,
    autoFocus,
    dir = "ltr",
    fromYear,
    toYear,
    locale,
  } = props

  const mode: CalendarMode = (props.mode ?? "single") as CalendarMode

  const [view, setView] = React.useState<CalendarView>("day")
  const [internalMonth, setInternalMonth] = React.useState<Date>(() =>
    startOfMonth(monthProp ?? defaultMonth ?? new Date()),
  )
  const month = monthProp ? startOfMonth(monthProp) : internalMonth

  React.useEffect(() => {
    if (monthProp) setInternalMonth(startOfMonth(monthProp))
  }, [monthProp])

  const setMonth = React.useCallback(
    (d: Date) => {
      const stamp = startOfMonth(d)
      if (!monthProp) setInternalMonth(stamp)
      onMonthChange?.(stamp)
    },
    [monthProp, onMonthChange],
  )

  // Year/decade subviews — same as previous wrapper.
  if (view === "year") {
    return (
      <YearGrid
        className={className}
        buttonVariant={buttonVariant}
        month={month}
        locale={locale}
        onPrev={() =>
          setMonth(new Date(month.getFullYear() - 1, month.getMonth(), 1))
        }
        onNext={() =>
          setMonth(new Date(month.getFullYear() + 1, month.getMonth(), 1))
        }
        onOpenDecade={() => setView("decade")}
        onSelect={(d) => {
          setMonth(d)
          setView("day")
        }}
      />
    )
  }
  if (view === "decade") {
    return (
      <DecadeGrid
        className={className}
        buttonVariant={buttonVariant}
        month={month}
        onPrev={() =>
          setMonth(new Date(month.getFullYear() - 10, month.getMonth(), 1))
        }
        onNext={() =>
          setMonth(new Date(month.getFullYear() + 10, month.getMonth(), 1))
        }
        onSelect={(year) => {
          setMonth(new Date(year, month.getMonth(), 1))
          setView("year")
        }}
      />
    )
  }

  return (
    <DayView
      mode={mode}
      props={props}
      month={month}
      setMonth={setMonth}
      classNames={classNames}
      className={className}
      showOutsideDays={showOutsideDays}
      showWeekNumber={showWeekNumber}
      captionLayout={captionLayout}
      buttonVariant={buttonVariant}
      numberOfMonths={numberOfMonths}
      disabled={disabled}
      weekStartsOn={weekStartsOn}
      autoFocus={autoFocus}
      dir={dir}
      fromYear={fromYear}
      toYear={toYear}
      locale={locale}
      onOpenYearView={() => setView("year")}
    />
  )
}

interface DayViewProps {
  mode: CalendarMode
  props: CalendarProps
  month: Date
  setMonth: (d: Date) => void
  className?: string
  classNames?: Partial<Record<string, string>>
  showOutsideDays: boolean
  showWeekNumber: boolean
  captionLayout: CaptionLayout
  buttonVariant: React.ComponentProps<typeof Button>["variant"]
  numberOfMonths: number
  disabled?: CalendarMatcher | CalendarMatcher[]
  weekStartsOn: number
  autoFocus?: boolean
  dir: "ltr" | "rtl"
  fromYear?: number
  toYear?: number
  locale?: string | string[]
  onOpenYearView: () => void
}

function isDateSelectedInValue(
  date: Date,
  mode: CalendarMode,
  value: CalendarSelected,
): boolean {
  if (!value) return false
  if (mode === "single") return value instanceof Date && isSameDay(date, value)
  if (mode === "multi")
    return Array.isArray(value) && value.some((d) => isSameDay(d, date))
  if (mode === "range") {
    const range = value as DateRange
    if (range.from && isSameDay(range.from, date)) return true
    if (range.to && isSameDay(range.to, date)) return true
  }
  return false
}

function getRangeRole(
  date: Date,
  range: DateRange | undefined,
): "start" | "middle" | "end" | "single" | null {
  if (!range || !range.from) return null
  if (!range.to) {
    if (isSameDay(range.from, date)) return "single"
    return null
  }
  const t = startOfDay(date).getTime()
  const lo = Math.min(range.from.getTime(), range.to.getTime())
  const hi = Math.max(range.from.getTime(), range.to.getTime())
  const fromT = range.from.getTime()
  const toT = range.to.getTime()
  if (t === fromT && t === toT) return "single"
  if (t === Math.min(fromT, toT)) return "start"
  if (t === Math.max(fromT, toT)) return "end"
  if (t > lo && t < hi) return "middle"
  return null
}

function DayView({
  mode,
  props,
  month,
  setMonth,
  classNames,
  className,
  showOutsideDays,
  showWeekNumber,
  captionLayout,
  buttonVariant,
  numberOfMonths,
  disabled,
  weekStartsOn,
  autoFocus,
  dir,
  fromYear,
  toYear,
  locale,
  onOpenYearView,
}: DayViewProps) {
  // Manage focused date — keyboard navigation cursor.
  const initialFocus = React.useMemo(() => {
    if (mode === "single") {
      const single = (props as SingleProps).selected
      return single ?? month
    }
    if (mode === "multi") {
      const multi = (props as MultiProps).selected
      return multi?.[0] ?? month
    }
    const range = (props as RangeProps).selected
    return range?.from ?? month
  }, [mode, props, month])

  const [focusedDate, setFocusedDate] = React.useState<Date>(initialFocus)
  const [hasUserFocus, setHasUserFocus] = React.useState(false)
  const [hoveredDate, setHoveredDate] = React.useState<Date | null>(null)
  const tableRef = React.useRef<HTMLDivElement | null>(null)

  // Keep focused date in view: if selected month moves, snap focused date.
  React.useEffect(() => {
    if (
      focusedDate.getMonth() !== month.getMonth() ||
      focusedDate.getFullYear() !== month.getFullYear()
    ) {
      // only snap if user navigated by month controls and focus is far away
      if (!hasUserFocus) {
        setFocusedDate(startOfMonth(month))
      }
    }
  }, [month, focusedDate, hasUserFocus])

  React.useEffect(() => {
    if (!autoFocus) return
    setHasUserFocus(true)
  }, [autoFocus])

  const isDisabled = React.useCallback(
    (date: Date) => matchesAny(date, disabled),
    [disabled],
  )

  const today = React.useMemo(() => startOfDay(new Date()), [])

  const commit = (date: Date) => {
    if (isDisabled(date)) return
    if (mode === "single") {
      const callback = (props as SingleProps).onSelect
      const current = (props as SingleProps).selected
      if (current && isSameDay(current, date)) {
        callback?.(undefined)
      } else {
        callback?.(date)
      }
      return
    }
    if (mode === "multi") {
      const callback = (props as MultiProps).onSelect
      const current = (props as MultiProps).selected ?? []
      const exists = current.find((d) => isSameDay(d, date))
      const next = exists
        ? current.filter((d) => !isSameDay(d, date))
        : [...current, date]
      callback?.(next)
      return
    }
    const rangeProps = props as RangeProps
    const callback = rangeProps.onSelect
    const current = rangeProps.selected
    const min = rangeProps.min ?? 0
    if (!current || !current.from || (current.from && current.to)) {
      // start a new range
      callback?.({ from: date, to: undefined })
      return
    }
    // we have from but not to
    const from = current.from
    const fromT = startOfDay(from).getTime()
    const dateT = startOfDay(date).getTime()
    if (dateT < fromT) {
      callback?.({ from: date, to: from })
      return
    }
    if (dateT === fromT) {
      // Range first-click gotcha: with min>=1, a same-day click should NOT
      // auto-complete the range. Reset to single anchor.
      if (min >= 1) {
        callback?.({ from: date, to: undefined })
        return
      }
      callback?.({ from: date, to: date })
      return
    }
    callback?.({ from, to: date })
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const isRtl = dir === "rtl"
    let next: Date | null
    switch (event.key) {
      case "ArrowLeft":
        next = addDays(focusedDate, isRtl ? 1 : -1)
        break
      case "ArrowRight":
        next = addDays(focusedDate, isRtl ? -1 : 1)
        break
      case "ArrowUp":
        next = addDays(focusedDate, -7)
        break
      case "ArrowDown":
        next = addDays(focusedDate, 7)
        break
      case "Home":
        next = addDays(focusedDate, -focusedDate.getDay() + weekStartsOn)
        break
      case "End":
        next = addDays(focusedDate, 6 - focusedDate.getDay() + weekStartsOn)
        break
      case "PageUp":
        if (event.shiftKey) {
          next = new Date(
            focusedDate.getFullYear() - 1,
            focusedDate.getMonth(),
            focusedDate.getDate(),
          )
        } else {
          next = new Date(
            focusedDate.getFullYear(),
            focusedDate.getMonth() - 1,
            focusedDate.getDate(),
          )
        }
        break
      case "PageDown":
        if (event.shiftKey) {
          next = new Date(
            focusedDate.getFullYear() + 1,
            focusedDate.getMonth(),
            focusedDate.getDate(),
          )
        } else {
          next = new Date(
            focusedDate.getFullYear(),
            focusedDate.getMonth() + 1,
            focusedDate.getDate(),
          )
        }
        break
      case "Enter":
      case " ": {
        event.preventDefault()
        commit(focusedDate)
        return
      }
      default:
        return
    }
    if (next) {
      event.preventDefault()
      setFocusedDate(next)
      setHasUserFocus(true)
      // ensure the focused month is in view
      if (
        next.getMonth() !== month.getMonth() ||
        next.getFullYear() !== month.getFullYear()
      ) {
        setMonth(startOfMonth(next))
      }
    }
  }

  const monthsToShow = React.useMemo(() => {
    const list: Date[] = []
    for (let i = 0; i < numberOfMonths; i++) {
      list.push(addMonths(month, i))
    }
    return list
  }, [month, numberOfMonths])

  const cls = (key: string, fallback: string) => classNames?.[key] ?? fallback

  const monthFmt = React.useMemo(() => getMonthFormatter(locale), [locale])
  const weekdays = React.useMemo(
    () => getWeekdayNames(weekStartsOn, locale),
    [weekStartsOn, locale],
  )

  const handleDayClick = (date: Date) => {
    setFocusedDate(date)
    setHasUserFocus(true)
    commit(date)
  }

  return (
    <div
      data-slot="calendar"
      ref={tableRef}
      dir={dir}
      onKeyDown={onKeyDown}
      onMouseLeave={() => setHoveredDate(null)}
      className={cn("dr-calendar", cls("root", "dr-calendar-root"), className)}
    >
      <div className={cls("months", "dr-calendar-months")}>
        {monthsToShow.map((m, idx) => (
          <MonthBlock
            key={`${m.getFullYear()}-${m.getMonth()}`}
            month={m}
            isFirst={idx === 0}
            isLast={idx === monthsToShow.length - 1}
            classNames={classNames}
            captionLayout={captionLayout}
            buttonVariant={buttonVariant}
            showOutsideDays={showOutsideDays}
            showWeekNumber={showWeekNumber}
            weekStartsOn={weekStartsOn}
            weekdays={weekdays}
            monthFmt={monthFmt}
            mode={mode}
            props={props}
            disabled={disabled}
            today={today}
            focusedDate={focusedDate}
            hasUserFocus={hasUserFocus}
            hoveredDate={hoveredDate}
            onDayHover={setHoveredDate}
            onDayClick={handleDayClick}
            onPrev={() => setMonth(addMonths(month, -1))}
            onNext={() => setMonth(addMonths(month, 1))}
            onOpenYearView={onOpenYearView}
            fromYear={fromYear}
            toYear={toYear}
            onYearChange={(y) => setMonth(new Date(y, m.getMonth(), 1))}
            onMonthIndexChange={(monthIdx) =>
              setMonth(new Date(m.getFullYear(), monthIdx, 1))
            }
            locale={locale}
          />
        ))}
      </div>
    </div>
  )
}

interface MonthBlockProps {
  month: Date
  isFirst: boolean
  isLast: boolean
  classNames?: Partial<Record<string, string>>
  captionLayout: CaptionLayout
  buttonVariant: React.ComponentProps<typeof Button>["variant"]
  showOutsideDays: boolean
  showWeekNumber: boolean
  weekStartsOn: number
  weekdays: string[]
  monthFmt: Intl.DateTimeFormat
  mode: CalendarMode
  props: CalendarProps
  disabled?: CalendarMatcher | CalendarMatcher[]
  today: Date
  focusedDate: Date
  hasUserFocus: boolean
  hoveredDate: Date | null
  onDayHover: (date: Date | null) => void
  onDayClick: (date: Date) => void
  onPrev: () => void
  onNext: () => void
  onOpenYearView: () => void
  onYearChange: (y: number) => void
  onMonthIndexChange: (monthIdx: number) => void
  fromYear?: number
  toYear?: number
  locale?: string | string[]
}

function MonthBlock({
  month,
  isFirst,
  isLast,
  classNames,
  captionLayout,
  buttonVariant,
  showOutsideDays,
  showWeekNumber,
  weekStartsOn,
  weekdays,
  monthFmt,
  mode,
  props,
  disabled,
  today,
  focusedDate,
  hasUserFocus,
  hoveredDate,
  onDayHover,
  onDayClick,
  onPrev,
  onNext,
  onOpenYearView,
  onYearChange,
  onMonthIndexChange,
  fromYear,
  toYear,
  locale,
}: MonthBlockProps) {
  const cls = (key: string, fallback: string) => classNames?.[key] ?? fallback

  const matrix = React.useMemo(
    () => buildMonthMatrix(month, weekStartsOn),
    [month, weekStartsOn],
  )

  const value =
    mode === "single"
      ? (props as SingleProps).selected
      : mode === "multi"
        ? (props as MultiProps).selected
        : (props as RangeProps).selected

  const range =
    mode === "range" ? ((value as DateRange) ?? undefined) : undefined

  // Hover preview: when the user has picked a start date but not yet an end
  // date, treat the currently hovered day as the provisional end so the
  // range cells visually fill from `from` → hoveredDate. Click commits.
  const previewRange: DateRange | undefined = React.useMemo(() => {
    if (mode !== "range") return undefined
    if (!range || !range.from || range.to) return range
    if (!hoveredDate) return range
    const fromT = startOfDay(range.from).getTime()
    const hoverT = startOfDay(hoveredDate).getTime()
    if (hoverT === fromT) return range
    return hoverT < fromT
      ? { from: hoveredDate, to: range.from }
      : { from: range.from, to: hoveredDate }
  }, [mode, range, hoveredDate])

  const isPreviewing = previewRange !== range

  return (
    <div className={cls("month", "dr-calendar-month")}>
      <div className={cls("month_caption", "dr-calendar-month-caption")}>
        {captionLayout === "label" ? (
          <button
            type="button"
            onClick={onOpenYearView}
            className={cn(
              "dr-calendar-caption-label",
              "dr-calendar-caption-label-btn",
            )}
          >
            {monthFmt.format(month)}
          </button>
        ) : (
          <DropdownCaption
            month={month}
            captionLayout={captionLayout}
            fromYear={fromYear}
            toYear={toYear}
            locale={locale}
            onYearChange={onYearChange}
            onMonthIndexChange={onMonthIndexChange}
          />
        )}
      </div>

      <div
        className={cls("nav", "dr-calendar-nav")}
        aria-hidden={!isFirst && !isLast}
      >
        {isFirst ? (
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous month"
            data-variant={buttonVariant}
            data-size="icon"
            className={cn(
              "dr-btn",
              "dr-calendar-nav-btn",
              cls("button_previous", ""),
            )}
          >
            <ChevronLeftIcon className="size-4" />
          </button>
        ) : (
          <span />
        )}
        {isLast ? (
          <button
            type="button"
            onClick={onNext}
            aria-label="Next month"
            data-variant={buttonVariant}
            data-size="icon"
            className={cn(
              "dr-btn",
              "dr-calendar-nav-btn",
              cls("button_next", ""),
            )}
          >
            <ChevronRightIcon className="size-4" />
          </button>
        ) : (
          <span />
        )}
      </div>

      <div role="grid" className={cls("table", "dr-calendar-table")}>
        <div className={cls("weekdays", "dr-calendar-weekdays")} role="row">
          {showWeekNumber && (
            <div
              role="columnheader"
              aria-label="Week number"
              className={cls(
                "week_number_header",
                "dr-calendar-week-number-header",
              )}
            />
          )}
          {weekdays.map((label, idx) => (
            <div
              key={idx}
              role="columnheader"
              className={cls("weekday", "dr-calendar-weekday")}
            >
              {label}
            </div>
          ))}
        </div>
        {matrix.map((week, weekIdx) => (
          <div
            key={weekIdx}
            role="row"
            className={cls("week", "dr-calendar-week")}
          >
            {showWeekNumber && week[0] && (
              <div
                role="rowheader"
                className={cls("week_number", "dr-calendar-week-number")}
              >
                <div className="dr-calendar-week-number-cell">
                  {getISOWeek(week[0])}
                </div>
              </div>
            )}
            {week.map((date) => {
              const inMonth =
                date.getMonth() === month.getMonth() &&
                date.getFullYear() === month.getFullYear()
              const dayDisabled = matchesAny(date, disabled)
              const isToday = isSameDay(date, today)
              const focused = hasUserFocus && isSameDay(date, focusedDate)
              const selected = isDateSelectedInValue(date, mode, value)
              const rangeRole = getRangeRole(date, previewRange)
              if (!inMonth && !showOutsideDays) {
                return (
                  <div
                    key={date.toISOString()}
                    role="gridcell"
                    className={cn(
                      cls("day", "dr-calendar-day"),
                      cls("hidden", "dr-calendar-hidden"),
                    )}
                  />
                )
              }
              return (
                <div
                  key={date.toISOString()}
                  role="gridcell"
                  className={cn(
                    cls("day", "dr-calendar-day"),
                    !inMonth && cls("outside", "dr-calendar-outside"),
                    isToday && cls("today", "dr-calendar-today"),
                    rangeRole === "start" &&
                      cls("range_start", "dr-calendar-range-start"),
                    rangeRole === "middle" &&
                      cls("range_middle", "dr-calendar-range-middle"),
                    rangeRole === "end" &&
                      cls("range_end", "dr-calendar-range-end"),
                    dayDisabled && cls("disabled", "dr-calendar-disabled"),
                  )}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={ordinalDayLabel(date, locale)}
                    aria-pressed={selected || undefined}
                    aria-current={isToday ? "date" : undefined}
                    disabled={dayDisabled}
                    data-day={date.toLocaleDateString()}
                    data-selected-single={
                      mode !== "range" && selected ? "true" : undefined
                    }
                    data-range-start={
                      rangeRole === "start" ? "true" : undefined
                    }
                    data-range-middle={
                      rangeRole === "middle" ? "true" : undefined
                    }
                    data-range-end={rangeRole === "end" ? "true" : undefined}
                    data-range-preview={
                      isPreviewing && rangeRole !== null ? "true" : undefined
                    }
                    data-focused={focused ? "true" : undefined}
                    onClick={() => onDayClick(date)}
                    onMouseEnter={
                      mode === "range" ? () => onDayHover(date) : undefined
                    }
                    className="dr-calendar-day-btn"
                  >
                    {date.getDate()}
                  </Button>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

interface DropdownCaptionProps {
  month: Date
  captionLayout: CaptionLayout
  fromYear?: number
  toYear?: number
  locale?: string | string[]
  onYearChange: (y: number) => void
  onMonthIndexChange: (m: number) => void
}

function DropdownCaption({
  month,
  captionLayout,
  fromYear,
  toYear,
  locale,
  onYearChange,
  onMonthIndexChange,
}: DropdownCaptionProps) {
  const monthShortFmt = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long" }),
    [locale],
  )

  const showMonth =
    captionLayout === "dropdown" || captionLayout === "dropdown-months"
  const showYear =
    captionLayout === "dropdown" || captionLayout === "dropdown-years"

  const startYear = fromYear ?? month.getFullYear() - 50
  const endYear = toYear ?? month.getFullYear() + 50
  const yearOptions: number[] = []
  for (let y = startYear; y <= endYear; y++) yearOptions.push(y)

  return (
    <div className="dr-calendar-dropdowns">
      {showMonth && (
        <div className="dr-calendar-dropdown-root">
          <Select
            value={String(month.getMonth())}
            onValueChange={(v) => onMonthIndexChange(parseInt(v, 10))}
          >
            <SelectTrigger
              className="dr-calendar-dropdown-trigger"
              aria-label="Choose month"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="dr-calendar-dropdown-content">
              {Array.from({ length: 12 }, (_, i) => i).map((idx) => (
                <SelectItem key={idx} value={String(idx)}>
                  {monthShortFmt.format(new Date(2024, idx, 1))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {showYear && (
        <div className="dr-calendar-dropdown-root">
          <Select
            value={String(month.getFullYear())}
            onValueChange={(v) => onYearChange(parseInt(v, 10))}
          >
            <SelectTrigger
              className="dr-calendar-dropdown-trigger"
              aria-label="Choose year"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="dr-calendar-dropdown-content">
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

interface GridHeaderProps {
  label: React.ReactNode
  onPrev: () => void
  onNext: () => void
  buttonVariant: React.ComponentProps<typeof Button>["variant"]
  prevLabel: string
  nextLabel: string
}

function GridHeader({
  label,
  onPrev,
  onNext,
  buttonVariant,
  prevLabel,
  nextLabel,
}: GridHeaderProps) {
  return (
    <div className="dr-calendar-grid-header">
      <Button
        type="button"
        variant={buttonVariant}
        size="icon"
        className="dr-calendar-nav-btn"
        onClick={onPrev}
        aria-label={prevLabel}
      >
        <ChevronLeftIcon className="size-4" />
      </Button>
      {label}
      <Button
        type="button"
        variant={buttonVariant}
        size="icon"
        className="dr-calendar-nav-btn"
        onClick={onNext}
        aria-label={nextLabel}
      >
        <ChevronRightIcon className="size-4" />
      </Button>
    </div>
  )
}

function YearGrid({
  className,
  buttonVariant,
  month,
  locale,
  onPrev,
  onNext,
  onOpenDecade,
  onSelect,
}: {
  className?: string
  buttonVariant: React.ComponentProps<typeof Button>["variant"]
  month: Date
  locale?: string | string[]
  onPrev: () => void
  onNext: () => void
  onOpenDecade: () => void
  onSelect: (d: Date) => void
}) {
  const year = month.getFullYear()
  const today = new Date()
  const monthShortFmt = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "short" }),
    [locale],
  )

  return (
    <div
      data-slot="calendar"
      className={cn("dr-calendar-grid-container", className)}
    >
      <GridHeader
        buttonVariant={buttonVariant}
        prevLabel="Previous year"
        nextLabel="Next year"
        onPrev={onPrev}
        onNext={onNext}
        label={
          <button
            type="button"
            onClick={onOpenDecade}
            className="dr-calendar-caption-label-btn"
          >
            {year}
          </button>
        }
      />
      <div className="dr-calendar-grid">
        {Array.from({ length: 12 }, (_, i) => i).map((m) => {
          const cellDate = new Date(year, m, 1)
          const isCurrent =
            year === today.getFullYear() && m === today.getMonth()
          return (
            <Button
              key={m}
              type="button"
              variant="ghost"
              onClick={() => onSelect(cellDate)}
              className="dr-calendar-grid-cell"
              data-current={isCurrent ? "true" : undefined}
            >
              {monthShortFmt.format(cellDate)}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

function DecadeGrid({
  className,
  buttonVariant,
  month,
  onPrev,
  onNext,
  onSelect,
}: {
  className?: string
  buttonVariant: React.ComponentProps<typeof Button>["variant"]
  month: Date
  onPrev: () => void
  onNext: () => void
  onSelect: (year: number) => void
}) {
  const currentYear = month.getFullYear()
  const decadeStart = Math.floor(currentYear / 10) * 10
  const thisYear = new Date().getFullYear()
  const years = Array.from({ length: 12 }, (_, i) => decadeStart - 1 + i)

  return (
    <div
      data-slot="calendar"
      className={cn("dr-calendar-grid-container", className)}
    >
      <GridHeader
        buttonVariant={buttonVariant}
        prevLabel="Previous decade"
        nextLabel="Next decade"
        onPrev={onPrev}
        onNext={onNext}
        label={
          <span className="text-sm font-medium select-none">
            {decadeStart} – {decadeStart + 9}
          </span>
        }
      />
      <div className="dr-calendar-grid">
        {years.map((y) => {
          const isOutside = y < decadeStart || y > decadeStart + 9
          const isCurrent = y === thisYear
          return (
            <Button
              key={y}
              type="button"
              variant="ghost"
              onClick={() => onSelect(y)}
              className="dr-calendar-grid-cell"
              data-current={isCurrent ? "true" : undefined}
              data-outside={isOutside ? "true" : undefined}
            >
              {y}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export { Calendar }
