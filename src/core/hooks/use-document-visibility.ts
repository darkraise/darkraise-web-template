import { useState } from "react"
import { useEventListener } from "./use-event-listener"
import { useMountEffect } from "./use-mount-effect"
import { isBrowser } from "./util"

const isDocumentVisible = () => document.visibilityState === "visible"

export function useDocumentVisibility(
  initializeWithValue: false,
): boolean | undefined
export function useDocumentVisibility(initializeWithValue?: true): boolean
export function useDocumentVisibility(
  initializeWithValue = true,
): boolean | undefined {
  const [isVisible, setIsVisible] = useState(
    isBrowser && initializeWithValue ? isDocumentVisible() : undefined,
  )

  useMountEffect(() => {
    if (!initializeWithValue) {
      setIsVisible(isDocumentVisible())
    }
  })

  useEventListener(isBrowser ? document : null, "visibilitychange", () => {
    setIsVisible(isDocumentVisible())
  })

  return isVisible
}
