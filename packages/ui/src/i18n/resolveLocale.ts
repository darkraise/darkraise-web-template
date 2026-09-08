import { en } from "../locales/en"
import type { UiLocaleDefinition } from "./types"

export function canonicalLocale(locale: string): string {
  try {
    return Intl.getCanonicalLocales(locale)[0] ?? "en"
  } catch {
    return "en"
  }
}

export function resolveLocale(
  requested: string,
  locales: readonly UiLocaleDefinition[],
) {
  const locale = canonicalLocale(requested)
  const packs = [en, ...locales]
  const find = (key: string) =>
    [...packs].reverse().find((pack) => canonicalLocale(pack.locale) === key)
  const pack = find(locale) ?? find(locale.split("-")[0] ?? "en") ?? en
  return { locale, pack }
}
