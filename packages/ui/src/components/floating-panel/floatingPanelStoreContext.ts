"use client"

import * as React from "react"
import { type FloatingPanelStore } from "./floatingPanelStore"

export const FloatingPanelStoreContext =
  React.createContext<FloatingPanelStore | null>(null)

export function useFloatingPanelStore(): FloatingPanelStore {
  const store = React.useContext(FloatingPanelStoreContext)
  if (!store) {
    throw new Error(
      `[FloatingPanel] useAppFloatingPanels / scope="app" requires <FloatingPanelProvider> upstream.`,
    )
  }
  return store
}
