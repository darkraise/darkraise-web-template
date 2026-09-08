import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  LocaleSwitcher,
  UnitedStatesFlagIcon,
  VietnamFlagIcon,
  type LocaleSwitcherOption,
} from "darkraise-ui/components/locale-switcher"
import { changeAppLanguage } from "darkraise-ui/i18n/react-i18next"
import { appLocales } from "./index"
import { useAppTranslation } from "./useAppTranslation"

const icons: Record<string, LocaleSwitcherOption["icon"]> = {
  en: <UnitedStatesFlagIcon />,
  vi: <VietnamFlagIcon />,
}
const languageOptions = appLocales.map((locale) => ({
  ...locale,
  icon: icons[locale.locale],
}))

export function AppLocaleSwitcher({ id }: { id?: string }) {
  const { i18n } = useTranslation()
  const t = useAppTranslation()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(false)
  return (
    <div>
      <LocaleSwitcher
        id={id}
        value={i18n.resolvedLanguage ?? i18n.language}
        options={languageOptions}
        pending={pending}
        className="w-auto min-w-28"
        onValueChange={(locale) => {
          setPending(true)
          setError(false)
          void changeAppLanguage(i18n, locale)
            .catch(() => setError(true))
            .finally(() => setPending(false))
        }}
      />
      {error && (
        <p role="alert">{t("Unable to change language. Please try again.")}</p>
      )}
    </div>
  )
}
