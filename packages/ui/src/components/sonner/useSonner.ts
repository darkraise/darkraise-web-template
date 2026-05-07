"use client"

import * as React from "react"

import { toast, toastStore, type Toast } from "./toastStore"

export interface UseSonnerReturn {
  toast: typeof toast
  toasts: Toast[]
}

export function useSonner(): UseSonnerReturn {
  const subscribe = React.useCallback(
    (onChange: () => void) => toastStore.subscribe(onChange),
    [],
  )
  const getSnapshot = React.useCallback(() => toastStore.getState().toasts, [])
  const toasts = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return { toast, toasts }
}
