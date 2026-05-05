import type { DependencyList, EffectCallback } from "react"
import { useEffect } from "react"
import { useSyncedRef } from "./useSyncedRef"

export function useRafEffect(
  effect: EffectCallback,
  deps: DependencyList,
): void {
  const effectRef = useSyncedRef(effect)
  useEffect(() => {
    const id = requestAnimationFrame(() => effectRef.current())
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
