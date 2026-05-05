import type { DependencyList, EffectCallback } from "react"
import { useEffect } from "react"

export function useConditionalEffect(
  effect: EffectCallback,
  deps: DependencyList,
  conditions: ReadonlyArray<unknown>,
): void {
  useEffect(() => {
    if (conditions.every(Boolean)) return effect()
    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
