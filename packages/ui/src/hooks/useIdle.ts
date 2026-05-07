import { useEffect, useRef, useState } from "react"
import { useDocumentVisibility } from "./useDocumentVisibility"

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "wheel",
  "scroll",
] as const

export function useIdle(
  ms = 60_000,
  events: readonly string[] = ACTIVITY_EVENTS,
): boolean {
  const [idle, setIdle] = useState<boolean>(false)
  const isVisible = useDocumentVisibility()
  const resetRef = useRef<(() => void) | null>(null)
  // Stable join of the events array so the effect re-subscribes when a
  // caller passes a different list, even though the array identity changes
  // on every render.
  const eventsKey = events.join("|")

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const reset = (): void => {
      if (timer) clearTimeout(timer)
      setIdle(false)
      timer = setTimeout(() => setIdle(true), ms)
    }
    resetRef.current = reset
    const list = eventsKey.split("|")
    for (const ev of list) {
      window.addEventListener(ev, reset, { passive: true })
    }
    reset()
    return () => {
      if (timer) clearTimeout(timer)
      for (const ev of list) {
        window.removeEventListener(ev, reset)
      }
      resetRef.current = null
    }
  }, [ms, eventsKey])

  useEffect(() => {
    if (isVisible === false) setIdle(true)
    else resetRef.current?.()
  }, [isVisible])

  return idle
}
