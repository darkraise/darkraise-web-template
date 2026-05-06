import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import {
  DayButton,
  DayPicker,
  type NextMonthButtonProps,
  type PreviousMonthButtonProps,
} from "react-day-picker"

import { cn } from "@lib/utils"
import { Button } from "@components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/select"
import "./calendar.css"

type CalendarView = "day" | "year" | "decade"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  components,
  month: monthProp,
  defaultMonth,
  onMonthChange,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const [view, setView] = React.useState<CalendarView>("day")
  const [internalMonth, setInternalMonth] = React.useState<Date>(
    monthProp ?? defaultMonth ?? new Date(),
  )
  const month = monthProp ?? internalMonth

  const setMonth = React.useCallback(
    (d: Date) => {
      setInternalMonth(d)
      onMonthChange?.(d)
    },
    [onMonthChange],
  )

  if (view === "year") {
    return (
      <YearGrid
        className={className}
        buttonVariant={buttonVariant}
        month={month}
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
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("dr-calendar", className)}
      captionLayout={captionLayout}
      month={month}
      onMonthChange={setMonth}
      classNames={{
        root: "dr-calendar-root",
        months: "dr-calendar-months",
        month: "dr-calendar-month",
        nav: "dr-calendar-nav",
        button_previous: "dr-btn dr-calendar-nav-btn",
        button_next: "dr-btn dr-calendar-nav-btn",
        month_caption: "dr-calendar-month-caption",
        caption_label: cn(
          "dr-calendar-caption-label",
          captionLayout !== "label" && "dr-calendar-caption-label--interactive",
        ),
        dropdowns: "dr-calendar-dropdowns",
        dropdown_root: "dr-calendar-dropdown-root",
        dropdown: "",
        table: "dr-calendar-table",
        weekdays: "dr-calendar-weekdays",
        weekday: "dr-calendar-weekday",
        week: "dr-calendar-week",
        week_number_header: "dr-calendar-week-number-header",
        week_number: "dr-calendar-week-number",
        day: "dr-calendar-day",
        range_start: "dr-calendar-range-start",
        range_middle: "dr-calendar-range-middle",
        range_end: "dr-calendar-range-end",
        today: "dr-calendar-today",
        outside: "dr-calendar-outside",
        disabled: "dr-calendar-disabled",
        hidden: "dr-calendar-hidden",
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => (
          <div
            data-slot="calendar"
            ref={rootRef}
            className={cn(className)}
            {...props}
          />
        ),
        Chevron: ({ className, orientation, ...props }) => {
          const Icon =
            orientation === "left" ? ChevronLeftIcon : ChevronRightIcon
          return <Icon className={cn("size-4", className)} {...props} />
        },
        Dropdown: CalendarDropdown,
        PreviousMonthButton: ({
          className,
          ...props
        }: PreviousMonthButtonProps) => (
          <button
            {...props}
            className={className}
            data-variant={buttonVariant}
            data-size="icon"
          />
        ),
        NextMonthButton: ({ className, ...props }: NextMonthButtonProps) => (
          <button
            {...props}
            className={className}
            data-variant={buttonVariant}
            data-size="icon"
          />
        ),
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => (
          <td {...props}>
            <div className="dr-calendar-week-number-cell">{children}</div>
          </td>
        ),
        CaptionLabel:
          captionLayout === "label"
            ? ({ children }) => (
                <button
                  type="button"
                  onClick={() => setView("year")}
                  className="dr-calendar-caption-label-btn"
                >
                  {children}
                </button>
              )
            : undefined,
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn("dr-calendar-day-btn", className)}
      {...props}
    />
  )
}

function CalendarDropdown({
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
}: React.ComponentProps<"select"> & {
  options?: { value: number; label: string; disabled: boolean }[]
}) {
  if (!options) return <span />
  return (
    <Select
      value={value !== undefined ? String(value) : undefined}
      onValueChange={(newValue) => {
        if (onChange) {
          const synthetic = {
            target: { value: newValue },
          } as unknown as React.ChangeEvent<HTMLSelectElement>
          onChange(synthetic)
        }
      }}
    >
      <SelectTrigger
        className="dr-calendar-dropdown-trigger"
        aria-label={ariaLabel}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="dr-calendar-dropdown-content">
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={String(opt.value)}
            disabled={opt.disabled}
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
  onPrev,
  onNext,
  onOpenDecade,
  onSelect,
}: {
  className?: string
  buttonVariant: React.ComponentProps<typeof Button>["variant"]
  month: Date
  onPrev: () => void
  onNext: () => void
  onOpenDecade: () => void
  onSelect: (d: Date) => void
}) {
  const year = month.getFullYear()
  const today = new Date()
  const monthFmt = React.useMemo(
    () => new Intl.DateTimeFormat(undefined, { month: "short" }),
    [],
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
              {monthFmt.format(cellDate)}
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

export { Calendar, CalendarDayButton }
