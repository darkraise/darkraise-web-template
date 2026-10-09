import * as React from "react"
import { useUiLocale } from "../../i18n/context"
import { useControllableState } from "@primitives/state"

export type DateInputFormat = "ymd" | "mdy" | "dmy"

export interface UseDateInputOptions {
  value?: Date | null
  defaultValue?: Date | null
  onValueChange?: (date: Date | null) => void
  format?: DateInputFormat
}

interface Parts {
  year: string
  month: string
  day: string
}

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

  const adjustSegment = (key: keyof Parts, delta: number) => {
    const date = value ?? new Date()
    const y = date.getFullYear() + (key === "year" ? delta : 0)
    const m = date.getMonth() + (key === "month" ? delta : 0)
    const d = date.getDate() + (key === "day" ? delta : 0)
    commitParts(partsFromDate(new Date(y, m, d)))
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

  return { parts, setSegment, adjustSegment, order }
}
