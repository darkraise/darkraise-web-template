import { useMemo } from "react"
import { useUiLocale } from "./context"

export function useUiFormatters() {
  const { locale, formats } = useUiLocale()
  return useMemo(
    () => ({
      number: (value: number, options?: Intl.NumberFormatOptions) =>
        new Intl.NumberFormat(locale, { ...formats.number, ...options }).format(
          value,
        ),
      date: (value: Date | number, options?: Intl.DateTimeFormatOptions) =>
        new Intl.DateTimeFormat(locale, {
          timeZone: formats.timeZone,
          ...formats.date,
          ...options,
        }).format(value),
      calendarDate: (value: Date, options?: Intl.DateTimeFormatOptions) =>
        new Intl.DateTimeFormat(locale, {
          year: "numeric",
          month: "short",
          day: "numeric",
          ...options,
          calendar: "gregory",
          timeZone: undefined,
        }).format(value),
      time: (value: Date | number, options?: Intl.DateTimeFormatOptions) =>
        new Intl.DateTimeFormat(locale, {
          hour: "numeric",
          minute: "2-digit",
          timeZone: formats.timeZone,
          ...formats.time,
          ...options,
        }).format(value),
      relativeTime: (
        value: number,
        unit: Intl.RelativeTimeFormatUnit,
        options?: Intl.RelativeTimeFormatOptions,
      ) => new Intl.RelativeTimeFormat(locale, options).format(value, unit),
      plural: (value: number, options?: Intl.PluralRulesOptions) =>
        new Intl.PluralRules(locale, options).select(value),
    }),
    [locale, formats],
  )
}
