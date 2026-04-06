import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/core/lib/utils"
import { Button } from "@/core/components/ui/button"
import { Calendar } from "@/core/components/ui/calendar"

type View = "days" | "months" | "years"

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  className?: string
}

function DatePicker({ value, onChange, className }: DatePickerProps) {
  const [view, setView] = useState<View>("days")
  const [viewDate, setViewDate] = useState<Date>(() => value ?? new Date())

  const viewMonth = viewDate.getMonth()
  const viewYear = viewDate.getFullYear()

  const decadeStart = Math.floor(viewYear / 12) * 12

  const headerTitle =
    view === "days"
      ? `${MONTH_NAMES[viewMonth]} ${viewYear}`
      : view === "months"
        ? `${viewYear}`
        : `${decadeStart} – ${decadeStart + 11}`

  const handlePrev = () => {
    if (view === "days") {
      setViewDate(new Date(viewYear, viewMonth - 1, 1))
    } else if (view === "months") {
      setViewDate(new Date(viewYear - 1, viewMonth, 1))
    } else {
      setViewDate(new Date(viewYear - 12, viewMonth, 1))
    }
  }

  const handleNext = () => {
    if (view === "days") {
      setViewDate(new Date(viewYear, viewMonth + 1, 1))
    } else if (view === "months") {
      setViewDate(new Date(viewYear + 1, viewMonth, 1))
    } else {
      setViewDate(new Date(viewYear + 12, viewMonth, 1))
    }
  }

  const handleHeaderClick = () => {
    if (view === "days") setView("months")
    else if (view === "months") setView("years")
  }

  return (
    <div
      className={cn(
        "card-surface bg-card w-[272px] rounded-md border p-3",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handlePrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <button
          type="button"
          onClick={handleHeaderClick}
          disabled={view === "years"}
          className={cn(
            "text-sm font-medium",
            view !== "years" && "hover:text-primary cursor-pointer",
            view === "years" && "cursor-default",
          )}
        >
          {headerTitle}
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {view === "days" && (
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          month={new Date(viewYear, viewMonth)}
          onMonthChange={(m) => setViewDate(m)}
          classNames={{
            nav: "hidden",
            month_caption: "hidden",
          }}
          className="border-0 bg-transparent p-0 shadow-none"
        />
      )}

      {view === "months" && (
        <div className="grid grid-cols-4 gap-2 py-2">
          {MONTHS.map((month, i) => (
            <Button
              key={month}
              variant={
                i === viewMonth && viewYear === (value?.getFullYear() ?? -1)
                  ? "default"
                  : "ghost"
              }
              className="aspect-square h-auto w-full rounded-lg text-sm"
              onClick={() => {
                setViewDate(new Date(viewYear, i, 1))
                setView("days")
              }}
            >
              {month}
            </Button>
          ))}
        </div>
      )}

      {view === "years" && (
        <div className="grid grid-cols-4 gap-2 py-2">
          {Array.from({ length: 12 }, (_, i) => {
            const year = decadeStart + i
            return (
              <Button
                key={year}
                variant={
                  year === (value?.getFullYear() ?? -1) ? "default" : "ghost"
                }
                className="aspect-square h-auto w-full rounded-lg text-sm"
                onClick={() => {
                  setViewDate(new Date(year, viewMonth, 1))
                  setView("months")
                }}
              >
                {year}
              </Button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { DatePicker }
