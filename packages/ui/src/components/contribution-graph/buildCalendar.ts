export interface ContributionGraphDatum {
  /** ISO calendar date, `YYYY-MM-DD`. */
  date: string
  value: number
}

export interface ContributionGraphCell {
  date: Date
  /** `YYYY-MM-DD`, the key used to match against the data. */
  key: string
  value: number
  /** 0 = empty, 1..levels = intensity. */
  level: number
  weekIndex: number
  dayIndex: number
}

export interface ContributionGraphMonthLabel {
  label: string
  weekIndex: number
  span: number
}

export interface Calendar {
  /** `weeks[weekIndex][dayIndex]`; `null` marks a padding day outside the range. */
  weeks: (ContributionGraphCell | null)[][]
  monthLabels: ContributionGraphMonthLabel[]
  maxValue: number
  thresholds: number[]
}

export interface BuildCalendarOptions {
  startDate: Date
  endDate: Date
  weekStartsOn: number
  values: Map<string, number>
  levels: number
  thresholds?: number[]
}

const MONTH_NAMES = [
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

/**
 * Parses `YYYY-MM-DD` as a LOCAL date. `new Date("2026-07-24")` parses as UTC
 * midnight, which renders as the previous day for every user west of
 * Greenwich — a silent off-by-one across the entire graph.
 */
export function parseISODate(value: string): Date {
  const parts = value.split("-").map(Number)
  const [year, month, day] = parts
  if (
    parts.length !== 3 ||
    !year ||
    !month ||
    !day ||
    parts.some((part) => Number.isNaN(part))
  ) {
    throw new Error(`Expected a YYYY-MM-DD date, received "${value}"`)
  }
  return new Date(year, month - 1, day)
}

export function toISODateKey(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function toDate(value: Date | string): Date {
  return typeof value === "string" ? parseISODate(value) : startOfDay(value)
}

export function addDays(date: Date, days: number): Date {
  const result = startOfDay(date)
  result.setDate(result.getDate() + days)
  return result
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfWeek(date: Date, weekStartsOn: number): Date {
  const result = startOfDay(date)
  const offset = (result.getDay() - weekStartsOn + 7) % 7
  result.setDate(result.getDate() - offset)
  return result
}

/**
 * Quartiles of the maximum value, with the first bound pinned at 1 so any
 * non-zero value lands on at least level 1 — a single contribution must never
 * render as an empty day.
 */
export function defaultThresholds(maxValue: number, levels: number): number[] {
  return Array.from({ length: levels }, (_, index) =>
    index === 0
      ? 1
      : // The floor of 1 keeps the bounds non-decreasing when maxValue is 0
        // or very small, which would otherwise produce a ramp like [1,0,0,0].
        Math.max(1, Math.ceil((maxValue * (index + 1)) / levels)),
  )
}

export function levelFor(value: number, thresholds: number[]): number {
  if (value <= 0) return 0
  let level = 1
  for (const [index, threshold] of thresholds.entries()) {
    if (value >= threshold) level = index + 1
  }
  return level
}

export function buildCalendar(options: BuildCalendarOptions): Calendar {
  const { weekStartsOn, values, levels } = options
  const start = startOfDay(options.startDate)
  const end = startOfDay(options.endDate)

  const maxValue = values.size === 0 ? 0 : Math.max(...values.values())
  const thresholds = options.thresholds ?? defaultThresholds(maxValue, levels)

  const weeks: (ContributionGraphCell | null)[][] = []
  const months = new Map<string, ContributionGraphMonthLabel>()

  const cursor = startOfWeek(start, weekStartsOn)
  let weekIndex = 0

  while (cursor <= end) {
    const week: (ContributionGraphCell | null)[] = []
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      if (cursor < start || cursor > end) {
        week.push(null)
      } else {
        const date = new Date(cursor)
        const key = toISODateKey(date)
        const value = values.get(key) ?? 0
        week.push({
          date,
          key,
          value,
          level: levelFor(value, thresholds),
          weekIndex,
          dayIndex,
        })

        const monthKey = `${date.getFullYear()}-${date.getMonth()}`
        const existing = months.get(monthKey)
        if (existing) {
          existing.span = weekIndex - existing.weekIndex + 1
        } else {
          months.set(monthKey, {
            label: MONTH_NAMES[date.getMonth()] ?? "",
            weekIndex,
            span: 1,
          })
        }
      }
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
    weekIndex++
  }

  return {
    weeks,
    // A label narrower than two columns overlaps its neighbour, so months
    // that never span a second week column go unlabelled.
    monthLabels: [...months.values()].filter((month) => month.span > 1),
    maxValue,
    thresholds,
  }
}
