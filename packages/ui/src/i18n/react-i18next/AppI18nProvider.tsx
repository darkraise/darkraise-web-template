import { useCallback, useEffect, useSyncExternalStore } from "react"
import { I18nextProvider } from "react-i18next"
import type { i18n } from "i18next"
import { UiI18nProvider } from "../UiI18nProvider"
import { resolveLocale } from "../resolveLocale"
import type { UiI18nProviderProps } from "../types"

const documentOwners = new WeakSet<Document>()
export interface AppI18nProviderProps extends Omit<
  UiI18nProviderProps,
  "locale"
> {
  instance: i18n
  storageKey?: string
  syncDocument?: boolean
}
export function AppI18nProvider({
  instance,
  storageKey,
  syncDocument = false,
  ...props
}: AppI18nProviderProps) {
  if (!instance.isInitialized)
    throw new Error(
      "Initialize the translation instance before rendering AppI18nProvider.",
    )
  const subscribe = useCallback(
    (notify: () => void) => {
      instance.on("languageChanged", notify)
      return () => {
        instance.off("languageChanged", notify)
      }
    },
    [instance],
  )
  const snapshot = useCallback(() => instance.language || "en", [instance])
  const locale = useSyncExternalStore(subscribe, snapshot, snapshot)
  const dir =
    props.dir ?? resolveLocale(locale, props.locales ?? []).pack.dir ?? "ltr"
  useEffect(() => {
    if (!storageKey) return
    try {
      window.localStorage.setItem(storageKey, locale)
    } catch {
      /* State remains usable when persistence is denied. */
    }
  }, [locale, storageKey])
  useEffect(() => {
    if (!syncDocument) return
    if (documentOwners.has(document))
      throw new Error("Only one AppI18nProvider may synchronize a document.")
    documentOwners.add(document)
    const root = document.documentElement
    const previous = {
      lang: root.getAttribute("lang"),
      dir: root.getAttribute("dir"),
    }
    return () => {
      for (const key of ["lang", "dir"] as const) {
        const value = previous[key]
        if (value === null) root.removeAttribute(key)
        else root.setAttribute(key, value)
      }
      documentOwners.delete(document)
    }
  }, [syncDocument])
  useEffect(() => {
    if (!syncDocument) return
    document.documentElement.lang = locale
    document.documentElement.dir = dir
  }, [locale, dir, syncDocument])
  return (
    <I18nextProvider i18n={instance}>
      <UiI18nProvider {...props} locale={locale}>
        {props.children}
      </UiI18nProvider>
    </I18nextProvider>
  )
}
