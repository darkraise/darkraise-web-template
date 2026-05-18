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
  // Cancel pending debounced persistence writes when the provider
  // unmounts so timers don't fire against a torn-down storage reference.
  React.useEffect(() => {
    return () => {
      store.dispose()
    }
  }, [store])
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
