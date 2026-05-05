import type { DependencyList } from "react"
import { useMemo, useRef } from "react"

export function useCustomCompareMemo<T>(
  factory: () => T,
  deps: DependencyList,
  compare: (prev: DependencyList, next: DependencyList) => boolean,
): T {
  const ref = useRef<DependencyList | undefined>(undefined)
  const tick = useRef<number>(0)
  if (ref.current === undefined || !compare(ref.current, deps)) {
    ref.current = deps
    tick.current++
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, [tick.current])
}
