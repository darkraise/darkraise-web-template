"use client"

import * as React from "react"
import { useFloatingPanelStore } from "./FloatingPanelProvider"
import type { AppPanelEntry } from "./floatingPanelStore"

export interface UseAppFloatingPanelsResult {
  open: (id: string, componentProps?: Record<string, unknown>) => void
  close: (id: string) => void
  toggle: (id: string) => void
  /**
   * Returns a point-in-time snapshot of all registered entries. Not reactive —
   * intended for diagnostics, debugging, and one-shot inspections. Components
   * that need to react to entry changes should subscribe via useSyncExternalStore
   * to the store directly.
   */
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
