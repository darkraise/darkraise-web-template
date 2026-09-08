import { canonicalLocale } from "../resolveLocale"
import type { UiLocaleDefinition } from "../types"

export interface BrowserLocaleOptions {
  initialLocale?: string
  storageKey?: string
  locales: readonly UiLocaleDefinition[]
  browserLocales?: readonly string[]
}
export function resolveBrowserLocale({
  initialLocale,
  storageKey,
  locales,
  browserLocales,
}: BrowserLocaleOptions): string {
  const match = (value: string | null | undefined) => {
    if (!value) return undefined
    let locale: string
    try {
      locale = Intl.getCanonicalLocales(value)[0] ?? ""
    } catch {
      return undefined
    }
    return (
      locales.find((pack) => canonicalLocale(pack.locale) === locale)?.locale ??
      locales.find(
        (pack) => canonicalLocale(pack.locale) === locale.split("-")[0],
      )?.locale
    )
  }
  const explicit = match(initialLocale)
  if (explicit) return explicit
  if (storageKey && typeof window !== "undefined") {
    try {
      const saved = match(window.localStorage.getItem(storageKey))
      if (saved) return saved
    } catch {
      /* Storage is optional. */
    }
  }
  const preferences =
    browserLocales ??
    (typeof navigator === "undefined" ? [] : navigator.languages)
  for (const preference of preferences) {
    const supported = match(preference)
    if (supported) return supported
  }
  return match("en") ?? locales[0]?.locale ?? "en"
}
