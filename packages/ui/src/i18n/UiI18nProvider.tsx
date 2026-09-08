import { useContext, useMemo } from "react"
import { UiLabelsContext } from "../labels/useUiLabels"
import { mergeLabels } from "../labels/mergeLabels"
import { defaultMessages } from "./defaultMessages"
import { UiLocaleContext } from "./context"
import { resolveLocale } from "./resolveLocale"
import type { UiI18nProviderProps } from "./types"

export function UiI18nProvider({
  locale,
  locales,
  labels = {},
  dir,
  formats,
  children,
}: UiI18nProviderProps) {
  const parent = useContext(UiLocaleContext)
  const parentMessages = useContext(UiLabelsContext)
  const registered = locales ?? parent.locales
  const resolved = useMemo(
    () => resolveLocale(locale ?? parent.locale, registered),
    [locale, parent.locale, registered],
  )
  const state = useMemo(
    () => ({
      locale: resolved.locale,
      messageLocale:
        locale === undefined ? parent.messageLocale : resolved.pack.locale,
      dir:
        dir ??
        (locale === undefined ? parent.dir : (resolved.pack.dir ?? "ltr")),
      enabled: true,
      locales: registered,
      formats: { ...parent.formats, ...formats },
    }),
    [
      resolved,
      dir,
      locale,
      parent.dir,
      parent.messageLocale,
      parent.formats,
      registered,
      formats,
    ],
  )
  const messages = useMemo(
    () =>
      mergeLabels(
        locale === undefined
          ? parentMessages
          : mergeLabels(defaultMessages, resolved.pack.messages),
        labels,
      ),
    [locale, parentMessages, resolved.pack, labels],
  )
  return (
    <UiLocaleContext.Provider value={state}>
      <UiLabelsContext.Provider value={messages}>
        {children}
      </UiLabelsContext.Provider>
    </UiLocaleContext.Provider>
  )
}
