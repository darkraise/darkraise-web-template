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
  /**
   * The largest value among the RENDERED days, not among every entry in
   * `values`. Scaling the ramp to a spike outside the range would flatten
   * every visible day with nothing on screen to explain why.
   */
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
 * Minimum week-columns a month must span to earn a label. A three-letter
 * abbreviation ("Sep") needs roughly three cell-widths to render without
 * touching its neighbour — the same rule GitHub's contribution graph uses
 * to drop a crowded leading or trailing month.
 */
const MIN_LABEL_SPAN_WEEKS = 3

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

  // Range membership is decided on the local `YYYY-MM-DD` key, never on the
  // timestamp. Where daylight saving springs forward AT MIDNIGHT
  // (America/Santiago, Asunción, Havana, Beirut, the Azores) local 00:00 does
  // not exist on the transition day, ECMAScript resolves it with the
  // pre-transition offset, and the cursor is bumped to 01:00 for the rest of
  // the walk — enough for a timestamp comparison to declare the end date out
  // of range and emit it as padding. Zero-padded ISO keys sort
  // lexicographically in calendar order, so comparing them is both correct
  // and immune to whatever offset a given day resolved to.
  const startKey = toISODateKey(start)
  const endKey = toISODateKey(end)

  const weeks: (ContributionGraphCell | null)[][] = []
  const months = new Map<string, ContributionGraphMonthLabel>()
  // Levels cannot be assigned during the walk: the thresholds depend on the
  // maximum, and the maximum is only known once every in-range day has been
  // visited. Collecting the cells lets the level pass run over the rendered
  // range rather than over the whole input map.
  const cells: ContributionGraphCell[] = []
  let maxValue = 0

  const cursor = startOfWeek(start, weekStartsOn)
  let weekIndex = 0

  while (toISODateKey(cursor) <= endKey) {
    const week: (ContributionGraphCell | null)[] = []
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const key = toISODateKey(cursor)
      if (key < startKey || key > endKey) {
        week.push(null)
      } else {
        // `startOfDay` rather than `new Date(cursor)`: once the cursor has
        // been bumped off midnight by a transition it stays there, and the
        // public `cell.date` should still read as the day's local midnight.
        const date = startOfDay(cursor)
        const value = values.get(key) ?? 0
        const cell: ContributionGraphCell = {
          date,
          key,
          value,
          level: 0, // resolved below, once the in-range maximum is known
          weekIndex,
          dayIndex,
        }
        week.push(cell)
        cells.push(cell)
        if (value > maxValue) maxValue = value

        const monthKey = `${date.getFullYear()}-${date.getMonth()}`
        if (!months.has(monthKey)) {
          months.set(monthKey, {
            label: MONTH_NAMES[date.getMonth()] ?? "",
            weekIndex,
            span: 0, // resolved below, once every month's start week is known
          })
        }
      }
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
    weekIndex++
  }

  const thresholds = options.thresholds ?? defaultThresholds(maxValue, levels)
  for (const cell of cells) {
    cell.level = levelFor(cell.value, thresholds)
  }

  // Each month's span runs from its own first week up to, but excluding,
  // the next month's first week — the last month runs to the end of the
  // grid. A single week column legitimately holds the last days of one
  // month and the first days of the next, so measuring a span inclusively
  // (through the shared column) let two labels claim the same column and
  // CSS Grid silently pushed the second one onto its own row instead of
  // rendering the overlap.
  const monthList = [...months.values()]
  for (const [index, month] of monthList.entries()) {
    const next = monthList[index + 1]
    month.span = (next ? next.weekIndex : weeks.length) - month.weekIndex
  }

  return {
    weeks,
    monthLabels: monthList.filter(
      (month) => month.span >= MIN_LABEL_SPAN_WEEKS,
    ),
    maxValue,
    thresholds,
  }
}
