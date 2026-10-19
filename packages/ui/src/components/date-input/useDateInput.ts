import * as React from "react"
import { useUiLocale } from "../../i18n/context"
import { useControllableState } from "@primitives/state"

export type DateInputFormat = "ymd" | "mdy" | "dmy"

export interface UseDateInputOptions {
  value?: Date | null
  defaultValue?: Date | null
  onValueChange?: (date: Date | null) => void
  /** Called when the typed date becomes, or stops being, one that does not exist. */
  onInvalidChange?: (invalid: boolean) => void
  format?: DateInputFormat
}

interface Parts {
  year: string
  month: string
  day: string
}

const SEGMENT_MAX = { month: 12, day: 31 } as const

function partsFromDate(d: Date | null | undefined): Parts {
  if (!d) return { year: "", month: "", day: "" }
  return {
    year: String(d.getFullYear()).padStart(4, "0"),
    month: String(d.getMonth() + 1).padStart(2, "0"),
    day: String(d.getDate()).padStart(2, "0"),
  }
}

function partsToDate(p: Parts): Date | null {
  const y = Number.parseInt(p.year, 10)
  const m = Number.parseInt(p.month, 10)
  const d = Number.parseInt(p.day, 10)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return null
  }
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  const date = new Date(y, m - 1, d)
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null
  }
  return date
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function wrap(n: number, max: number): number {
  if (n > max) return 1
  if (n < 1) return max
  return n
}

function isImpossible(p: Parts): boolean {
  const complete =
    p.year.length === 4 && p.month.length === 2 && p.day.length === 2
  return complete && partsToDate(p) === null
}

/**
 * Applies the digits a segment now holds. A month or day that cannot grow
 * any further completes with what was typed, and a digit that would push it
 * past its maximum starts the next segment instead.
 */
function typeDigits(
  parts: Parts,
  order: Array<keyof Parts>,
  key: keyof Parts,
  digits: string,
): { parts: Parts; focus: keyof Parts | null; carried?: boolean } {
  const following = order[order.indexOf(key) + 1] ?? null
  if (key === "year") {
    return {
      parts: { ...parts, year: digits },
      focus: digits.length === 4 ? following : null,
    }
  }
  const max = SEGMENT_MAX[key]
  const [first = "", second] = digits
  if (second === undefined) {
    if (Number(first) * 10 > max) {
      return { parts: { ...parts, [key]: `0${first}` }, focus: following }
    }
    return { parts: { ...parts, [key]: first }, focus: null }
  }
  const n = Number(digits)
  if (n === 0) return { parts, focus: null }
  if (n <= max) return { parts: { ...parts, [key]: digits }, focus: following }
  const completed = { ...parts, [key]: `0${first}` }
  if (!following) return { parts: completed, focus: null }
  const carried = typeDigits(completed, order, following, second)
  if (carried.focus) return carried
  return { parts: carried.parts, focus: following, carried: true }
}

function datesEqual(
  a: Date | null | undefined,
  b: Date | null | undefined,
): boolean {
  if (!a && !b) return true
  if (!a || !b) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function partsEqualDate(p: Parts, d: Date | null | undefined): boolean {
  if (!d) return p.year === "" && p.month === "" && p.day === ""
  const fromParts = partsToDate(p)
  return datesEqual(fromParts, d)
}

export function useDateInput(options: UseDateInputOptions) {
  const uiLocale = useUiLocale()
  const [value, setValue] = useControllableState<Date | null | undefined>({
    value: options.value,
    defaultValue: options.defaultValue ?? null,
    onChange: options.onValueChange as (next: Date | null | undefined) => void,
  })

  const [parts, setParts] = React.useState<Parts>(() =>
    partsFromDate(value ?? null),
  )

  // Mirror controlled value into local parts when the value reflects a
  // different state than what the user is typing. Echoed-null from our own
  // intermediate commits (parts that don't yet form a valid date) must not
  // wipe in-progress input — but an external null (parent calling
  // `setD(null)` on a previously complete date) must still propagate.
  // Distinguish them: the partial-input case has `partsToDate(prev) === null`,
  // while a complete-but-being-cleared case has `partsToDate(prev) !== null`.
  React.useEffect(() => {
    setParts((prev) => {
      if (partsEqualDate(prev, value ?? null)) return prev
      const partsEmpty =
        prev.year === "" && prev.month === "" && prev.day === ""
      const partsAreComplete = partsToDate(prev) !== null
      if ((value ?? null) === null && !partsEmpty && !partsAreComplete) {
        return prev
      }
      return partsFromDate(value ?? null)
    })
  }, [value])

  // Committing from the handler, not from an effect on `parts`, orders the
  // edit after any parent update already queued. Two effects syncing in
  // opposite directions swap their states forever when both change in one
  // render.
  const commitParts = (next: Parts) => {
    setParts(next)
    const date = partsToDate(next)
    if (!datesEqual(date, value ?? null)) setValue(date)
  }

  const setSegment = (key: keyof Parts, raw: string) => {
    commitParts({ ...parts, [key]: raw })
  }

  const typeSegment = (
    key: keyof Parts,
    digits: string,
  ): { focus: keyof Parts | null; caret: number | null } => {
    const typed = typeDigits(parts, order, key, digits)
    if (typed.parts !== parts) commitParts(typed.parts)
    const caret =
      typed.carried && typed.focus ? typed.parts[typed.focus].length : null
    return { focus: typed.focus, caret }
  }

  const invalid = isImpossible(parts)
  const reportedInvalidRef = React.useRef(invalid)
  const onInvalidChange = options.onInvalidChange
  React.useEffect(() => {
    if (reportedInvalidRef.current === invalid) return
    reportedInvalidRef.current = invalid
    onInvalidChange?.(invalid)
  }, [invalid, onInvalidChange])

  const adjustSegment = (key: keyof Parts, delta: number) => {
    const today = new Date()
    const typed = (part: string, max: number, fallback: number) => {
      const n = Number.parseInt(part, 10)
      return n >= 1 && n <= max ? n : fallback
    }
    let y = typed(parts.year, 9999, today.getFullYear())
    let m = typed(parts.month, 12, today.getMonth() + 1)
    let d = typed(parts.day, 31, today.getDate())
    if (key === "year") y = Math.min(Math.max(y + delta, 1), 9999)
    if (key === "month") m = wrap(m + delta, 12)
    const monthLength = daysInMonth(y, m)
    d = key === "day" ? wrap(d + delta, monthLength) : Math.min(d, monthLength)
    commitParts({
      year: String(y).padStart(4, "0"),
      month: String(m).padStart(2, "0"),
      day: String(d).padStart(2, "0"),
    })
  }

  const order: Array<keyof Parts> = (() => {
    if (options.format === undefined && uiLocale.enabled) {
      return new Intl.DateTimeFormat(uiLocale.locale, {
        calendar: "gregory",
        year: "numeric",
        month: "numeric",
        day: "numeric",
      })
        .formatToParts(new Date(2026, 8, 8))
        .map((part) => part.type)
        .filter(
          (part): part is keyof Parts =>
            part === "year" || part === "month" || part === "day",
        )
    }
    const f = options.format ?? "ymd"
    if (f === "mdy") return ["month", "day", "year"]
    if (f === "dmy") return ["day", "month", "year"]
    return ["year", "month", "day"]
  })()

  return { parts, setSegment, typeSegment, adjustSegment, order, invalid }
}
