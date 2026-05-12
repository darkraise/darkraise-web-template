"use client"

import * as React from "react"
import { useFloatingPanelStore } from "./FloatingPanelProvider"
import type { AppPanelEntry } from "./floatingPanelStore"

export interface UseAppFloatingPanelsResult {
  open: (id: string, componentProps?: Record<string, unknown>) => void
  close: (id: string) => void
  toggle: (id: string) => void
  list: () => AppPanelEntry[]
}

export function useAppFloatingPanels(): UseAppFloatingPanelsResult {
  const store = useFloatingPanelStore()
  return React.useMemo(
    () => ({
      open: store.open,
      close: store.close,
      toggle: store.toggle,
      list: store.list,
    }),
    [store],
  )
}
