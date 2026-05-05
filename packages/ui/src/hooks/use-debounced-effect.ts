import type { DependencyList, EffectCallback } from "react"
import { useEffect } from "react"
import { useSyncedRef } from "./use-synced-ref"

export function useDebouncedEffect(
  effect: EffectCallback,
  deps: DependencyList,
  delay: number,
): void {
  const effectRef = useSyncedRef(effect)
  useEffect(() => {
    const id = setTimeout(() => effectRef.current(), delay)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay])
}
