import { createInstance, type i18n, type InitOptions } from "i18next"
import { initReactI18next } from "react-i18next"
import type { UiLocaleDefinition } from "../types"

export interface CreateDarkraiseI18nOptions extends Omit<
  InitOptions,
  "lng" | "supportedLngs"
> {
  locale: string
  locales: readonly UiLocaleDefinition[]
}
export async function createDarkraiseI18n({
  locale,
  locales,
  ...options
}: CreateDarkraiseI18nOptions): Promise<i18n> {
  const instance = createInstance()
  instance.use(initReactI18next)
  await new Promise<void>((resolve, reject) => {
    void instance.init(
      {
        fallbackLng: "en",
        interpolation: { escapeValue: false },
        ...options,
        lng: locale,
        supportedLngs: locales.map((pack) => pack.locale),
      },
      (error) => (error ? reject(error) : resolve()),
    )
  })
  return instance
}

const changes = new WeakMap<i18n, Promise<void>>()
export function changeAppLanguage(
  instance: i18n,
  locale: string,
): Promise<void> {
  const next = (changes.get(instance) ?? Promise.resolve())
    .catch(() => {})
    .then(async () => {
      await new Promise<void>((resolve, reject) => {
        void instance.loadLanguages(locale, (error) =>
          error ? reject(error) : resolve(),
        )
      })
      await new Promise<void>((resolve, reject) => {
        void instance.changeLanguage(locale, (error) =>
          error ? reject(error) : resolve(),
        )
      })
    })
  changes.set(instance, next)
  return next
}
