import { useCallback, useEffect, useRef } from "react"

export interface VibrateActions {
  vibrate: (pattern: number | number[]) => boolean
  stop: () => void
}

export function useVibrate(): VibrateActions {
  const active = useRef<boolean>(false)
  const supported =
    typeof navigator !== "undefined" && typeof navigator.vibrate === "function"
  const vibrate = useCallback(
    (pattern: number | number[]): boolean => {
      if (!supported) return false
      active.current = true
      return navigator.vibrate(pattern)
    },
    [supported],
  )
  const stop = useCallback((): void => {
    if (!supported) return
    navigator.vibrate(0)
    active.current = false
  }, [supported])
  useEffect(
    () => () => {
      if (active.current) navigator.vibrate?.(0)
    },
    [],
  )
  return { vibrate, stop }
}
