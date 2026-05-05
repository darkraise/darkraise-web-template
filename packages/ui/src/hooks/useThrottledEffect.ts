import type { DependencyList, EffectCallback } from "react"
import { useEffect, useRef } from "react"
import { useSyncedRef } from "./useSyncedRef"

export function useThrottledEffect(
  effect: EffectCallback,
  deps: DependencyList,
  delay: number,
): void {
  const effectRef = useSyncedRef(effect)
  const lastRun = useRef<number>(-Infinity)
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    lastRun.current = -Infinity
    if (pending.current) {
      clearTimeout(pending.current)
      pending.current = null
    }
  }, [delay])
  useEffect(() => {
    const now = Date.now()
    const since = now - lastRun.current
    if (since >= delay) {
      lastRun.current = now
      effectRef.current()
    } else {
      if (pending.current) clearTimeout(pending.current)
      pending.current = setTimeout(() => {
        lastRun.current = Date.now()
        effectRef.current()
      }, delay - since)
    }
    return () => {
      if (pending.current) {
        clearTimeout(pending.current)
        pending.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
