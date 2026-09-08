import {
  createDarkraiseI18n,
  resolveBrowserLocale,
} from "darkraise-ui/i18n/react-i18next"
import { en } from "darkraise-ui/locales/en"
import { vi } from "darkraise-ui/locales/vi"
import { en as english } from "./en"
import { vi as vietnamese } from "./vi"

export const appLocales = [en, vi]
export const languageStorageKey = "darkraise-demo.language"
export async function initializeAppI18n() {
  const [{ showcaseEnglish }, { showcaseVietnamese }] = await Promise.all([
    import("./showcase-en"),
    import("./showcase-vi"),
  ])
  return createDarkraiseI18n({
    locale: resolveBrowserLocale({
      locales: appLocales,
      storageKey: languageStorageKey,
    }),
    locales: appLocales,
    keySeparator: false,
    nsSeparator: false,
    resources: {
      en: { translation: { ...showcaseEnglish, ...english } },
      vi: { translation: { ...showcaseVietnamese, ...vietnamese } },
    },
  })
}
