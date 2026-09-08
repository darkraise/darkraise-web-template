export const i18nTemplate = (storageKey) => `import { useState } from "react"
import { useTranslation } from "react-i18next"
import { createDarkraiseI18n, resolveBrowserLocale, changeAppLanguage } from "darkraise-ui/i18n/react-i18next"
import { LocaleSwitcher, UnitedStatesFlagIcon, VietnamFlagIcon } from "darkraise-ui/components/locale-switcher"
import { en } from "darkraise-ui/locales/en"
import { vi } from "darkraise-ui/locales/vi"

export const locales = [en, vi]
const languageOptions = [
  { locale: en.locale, label: en.label, icon: <UnitedStatesFlagIcon /> },
  { locale: vi.locale, label: vi.label, icon: <VietnamFlagIcon /> },
]
export const storageKey = ${JSON.stringify(storageKey)}
export function initializeI18n() {
  return createDarkraiseI18n({
    locale: resolveBrowserLocale({locales, storageKey}),
    locales,
    resources: {
      en: { translation: { welcome: "Welcome", ready: "Your project is ready. Start building in src/app.tsx", languageError: "Unable to change language. Please try again." } },
      vi: { translation: { welcome: "Chào mừng", ready: "Dự án đã sẵn sàng. Bắt đầu xây dựng trong src/app.tsx", languageError: "Không thể đổi ngôn ngữ. Vui lòng thử lại." } },
    },
  })
}

export function AppLanguageSwitcher() {
  const {i18n, t} = useTranslation()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(false)
  return <div>
    <LocaleSwitcher value={i18n.resolvedLanguage ?? i18n.language} options={languageOptions} pending={pending} onValueChange={(locale) => {
      setPending(true)
      setError(false)
      void changeAppLanguage(i18n, locale).catch(() => setError(true)).finally(() => setPending(false))
    }} />
    {error && <p role="alert">{t("languageError")}</p>}
  </div>
}
`

export const multilingualMain = `import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { AppI18nProvider } from "darkraise-ui/i18n/react-i18next"
import { initializeI18n, locales, storageKey } from "./i18n"
import { App } from "./app"
import "./styles/globals.css"

const root = createRoot(document.getElementById("root")!)
void initializeI18n().then((instance) => {
  root.render(<StrictMode><AppI18nProvider instance={instance} locales={locales} storageKey={storageKey} syncDocument><App /></AppI18nProvider></StrictMode>)
}).catch(() => {
  root.render(<p role="alert">Unable to initialize the application. Please reload to try again.</p>)
})
`
