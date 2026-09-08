import { createContext, useContext } from "react"
import { en } from "../locales/en"
import type { UiLocaleState } from "./types"

export const UiLocaleContext = createContext<UiLocaleState>({
  locale: "en",
  messageLocale: "en",
  dir: "ltr",
  enabled: false,
  locales: [en],
  formats: {},
})
export function useUiLocale() {
  return useContext(UiLocaleContext)
}
