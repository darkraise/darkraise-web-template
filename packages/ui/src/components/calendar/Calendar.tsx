import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import {
  DayButton,
  DayPicker,
  type NextMonthButtonProps,
  type PreviousMonthButtonProps,
} from "react-day-picker"

import { cn } from "../../lib/utils"
import { Button } from "../button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select"

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
      className={cn("glass bg-card p-3", className)}
      captionLayout={captionLayout}
      month={month}
      onMonthChange={setMonth}
      classNames={{
        root: "w-fit",
        months: "relative flex flex-col gap-4 md:flex-row",
        month: "flex w-full flex-col gap-4",
        nav: "pointer-events-none absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
        button_previous: cn(
          "dr-btn",
          "pointer-events-auto aspect-square w-[var(--density-cell)] select-none p-0 aria-disabled:opacity-50",
        ),
        button_next: cn(
          "dr-btn",
          "pointer-events-auto aspect-square w-[var(--density-cell)] select-none p-0 aria-disabled:opacity-50",
        ),
        month_caption: "flex h-8 w-full items-center justify-center px-8",
        caption_label: cn(
          "select-none text-sm font-medium",
          captionLayout !== "label" &&
            "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 [&>svg]:size-3.5",
        ),
        dropdowns:
          "flex h-8 w-full items-center justify-center gap-1.5 text-sm font-medium",
        dropdown_root: "relative",
        dropdown: "",
        table: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-muted-foreground w-[var(--density-cell)] select-none rounded-md text-[0.8rem] font-normal text-center",
        week: "mt-2 flex w-full",
        week_number_header: "w-[var(--density-cell)] select-none",
        week_number: "text-muted-foreground select-none text-[0.8rem]",
        day: "relative aspect-square w-[var(--density-cell)] select-none p-0 text-center",
        range_start: "bg-accent rounded-l-md",
        range_middle: "rounded-none",
        range_end: "bg-accent rounded-r-md",
        today:
          "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
        outside:
          "text-muted-foreground aria-selected:text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
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
            <div className="flex aspect-square w-[var(--density-cell)] items-center justify-center text-center">
              {children}
            </div>
          </td>
        ),
        CaptionLabel:
          captionLayout === "label"
            ? ({ children }) => (
                <button
                  type="button"
                  onClick={() => setView("year")}
                  className="hover:text-primary cursor-pointer rounded-md text-sm font-medium transition-colors select-none"
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
      className={cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 flex aspect-square w-[var(--density-cell)] flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md [&>span]:text-xs [&>span]:opacity-70",
        className,
      )}
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
        className="h-7 w-auto gap-1 px-2 text-sm font-medium shadow-none"
        aria-label={ariaLabel}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-60">
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
    <div className="mb-4 flex h-8 items-center justify-between">
      <Button
        type="button"
        variant={buttonVariant}
        size="icon"
        className="aspect-square w-[var(--density-cell)] p-0"
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
        className="aspect-square w-[var(--density-cell)] p-0"
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
      className={cn("glass bg-card w-[16rem] p-3", className)}
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
            className="hover:text-primary cursor-pointer rounded-md text-sm font-medium transition-colors select-none"
          >
            {year}
          </button>
        }
      />
      <div className="grid grid-cols-3 gap-2">
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
              className={cn(
                "h-12 w-full text-sm font-normal",
                isCurrent && "bg-accent text-accent-foreground",
              )}
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
      className={cn("glass bg-card w-[16rem] p-3", className)}
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
      <div className="grid grid-cols-3 gap-2">
        {years.map((y) => {
          const isOutside = y < decadeStart || y > decadeStart + 9
          const isCurrent = y === thisYear
          return (
            <Button
              key={y}
              type="button"
              variant="ghost"
              onClick={() => onSelect(y)}
              className={cn(
                "h-12 w-full text-sm font-normal",
                isOutside && "text-muted-foreground opacity-50",
                isCurrent && "bg-accent text-accent-foreground",
              )}
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
