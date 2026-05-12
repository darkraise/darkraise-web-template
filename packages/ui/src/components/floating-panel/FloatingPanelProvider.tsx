"use client"

import * as React from "react"
import {
  createFloatingPanelStore,
  type CreateStoreOptions,
  type FloatingPanelStore,
} from "./floatingPanelStore"

const FloatingPanelStoreContext =
  React.createContext<FloatingPanelStore | null>(null)

export interface FloatingPanelProviderProps extends CreateStoreOptions {
  children?: React.ReactNode
}

export function FloatingPanelProvider({
  children,
  storage,
  persistDebounceMs,
}: FloatingPanelProviderProps) {
  const [store] = React.useState<FloatingPanelStore>(() =>
    createFloatingPanelStore({ storage, persistDebounceMs }),
  )
  return (
    <FloatingPanelStoreContext.Provider value={store}>
      {children}
    </FloatingPanelStoreContext.Provider>
  )
}

export function useFloatingPanelStore(): FloatingPanelStore {
  const store = React.useContext(FloatingPanelStoreContext)
  if (!store) {
    throw new Error(
      `[FloatingPanel] useAppFloatingPanels / scope="app" requires <FloatingPanelProvider> upstream.`,
    )
  }
  return store
}
