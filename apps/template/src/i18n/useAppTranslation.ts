import { useTranslation } from "react-i18next"
import { useCallback } from "react"

export function useAppTranslation() {
  const { t } = useTranslation()
  return useCallback(
    (text: string, values?: Record<string, string | number>) =>
      t(text, { ...values, defaultValue: text }),
    [t],
  )
}
