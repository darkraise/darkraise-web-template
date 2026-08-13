import { createContext, useContext, useMemo, type ReactNode } from "react"
import { defaultLabels } from "./defaults"
import { mergeLabels } from "./mergeLabels"
import type { DeepPartialLabels, UiLabels } from "./types"

// Defaulting the context to the full English set is what lets every component
// call useUiLabels() unconditionally — no provider is ever required.
const UiLabelsContext = createContext<UiLabels>(defaultLabels)

export function UiLabelsProvider({
  value,
  children,
}: {
  value: DeepPartialLabels<UiLabels>
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

export function useUiLabels(): UiLabels {
  return useContext(UiLabelsContext)
}
