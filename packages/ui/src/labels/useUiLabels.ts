import { createContext, useContext } from "react"
import { defaultMessages } from "../i18n/defaultMessages"
import type { UiMessages } from "../i18n/types"

// Defaulting the context to the full English set is what lets every component
// call useUiLabels() unconditionally — no provider is ever required.
export const UiLabelsContext = createContext<UiMessages>(defaultMessages)

export function useUiLabels(): UiMessages {
  return useContext(UiLabelsContext)
}
