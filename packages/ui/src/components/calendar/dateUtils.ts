export interface DateRange {
  from?: Date
  to?: Date
}

export type CalendarMatcher =
  | Date
  | { before: Date }
  | { after: Date }
  | { before: Date; after?: Date }
  | { from: Date; to: Date }
  | { dayOfWeek: number | number[] }
  | ((date: Date) => boolean)

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function addDays(d: Date, days: number): Date {
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  next.setDate(next.getDate() + days)
  return next
}

export function addMonths(d: Date, months: number): Date {
  const next = new Date(d.getFullYear(), d.getMonth() + months, 1)
  return next
}

function dayOfWeekIndex(d: Date, weekStartsOn: number): number {
  return (d.getDay() - weekStartsOn + 7) % 7
}

export function startOfWeek(d: Date, weekStartsOn = 0): Date {
  const offset = dayOfWeekIndex(d, weekStartsOn)
  return addDays(startOfDay(d), -offset)
}

export function endOfWeek(d: Date, weekStartsOn = 0): Date {
  return addDays(startOfWeek(d, weekStartsOn), 6)
}

export function isInRange(d: Date, range: DateRange): boolean {
  if (!range.from || !range.to) return false
  const t = startOfDay(d).getTime()
  const lo = Math.min(range.from.getTime(), range.to.getTime())
  const hi = Math.max(range.from.getTime(), range.to.getTime())
  return t >= lo && t <= hi
}

export function matchesMatcher(date: Date, matcher: CalendarMatcher): boolean {
  if (matcher instanceof Date) return isSameDay(date, matcher)
  if (typeof matcher === "function") return matcher(date)
  if ("dayOfWeek" in matcher) {
    const days = Array.isArray(matcher.dayOfWeek)
      ? matcher.dayOfWeek
      : [matcher.dayOfWeek]
    return days.includes(date.getDay())
  }
  if ("from" in matcher && "to" in matcher) {
    return isInRange(date, matcher)
  }
  if ("before" in matcher && matcher.before) {
    if (startOfDay(date).getTime() < startOfDay(matcher.before).getTime())
      return true
  }
  if ("after" in matcher && matcher.after) {
    if (startOfDay(date).getTime() > startOfDay(matcher.after).getTime())
      return true
  }
  return false
}

export function matchesAny(
  date: Date,
  matchers: CalendarMatcher | CalendarMatcher[] | undefined,
): boolean {
  if (!matchers) return false
  const list = Array.isArray(matchers) ? matchers : [matchers]
  return list.some((m) => matchesMatcher(date, m))
}

export function buildMonthMatrix(
  monthDate: Date,
  weekStartsOn: number,
): Date[][] {
  const first = startOfMonth(monthDate)
  const start = startOfWeek(first, weekStartsOn)
  const weeks: Date[][] = []
  let cursor = start
  for (let w = 0; w < 6; w++) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      week.push(cursor)
      cursor = addDays(cursor, 1)
    }
    weeks.push(week)
  }
  return weeks
}

export function clampDate(
  date: Date,
  min: Date | undefined,
  max: Date | undefined,
): Date {
  let next = date
  if (min && startOfDay(next).getTime() < startOfDay(min).getTime()) next = min
  if (max && startOfDay(next).getTime() > startOfDay(max).getTime()) next = max
  return next
}
