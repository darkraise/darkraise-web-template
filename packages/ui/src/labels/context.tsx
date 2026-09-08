import { useContext, useMemo, type ReactNode } from "react"
import { UiLabelsContext } from "./useUiLabels"
import { mergeLabels } from "./mergeLabels"
import type { DeepPartialLabels } from "./types"
import type { UiMessages } from "../i18n/types"

export function UiLabelsProvider({
  value,
  children,
}: {
  value: DeepPartialLabels<UiMessages>
  children: ReactNode
}) {
  // Merging over the nearest ancestor rather than over defaultLabels is what
  // lets a subtree override a subset of an outer provider's strings.
  const parent = useContext(UiLabelsContext)
  const merged = useMemo(() => mergeLabels(parent, value), [parent, value])
  return (
    <UiLabelsContext.Provider value={merged}>
      {children}
    </UiLabelsContext.Provider>
  )
}
