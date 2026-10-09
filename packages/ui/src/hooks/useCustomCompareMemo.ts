import type { DependencyList } from "react"
import { useMemo, useRef } from "react"

export function useCustomCompareMemo<T>(
  factory: () => T,
  deps: DependencyList,
  compare: (prev: DependencyList, next: DependencyList) => boolean,
): T {
  const ref = useRef<DependencyList | undefined>(undefined)
  const tick = useRef<number>(0)
  /* eslint-disable react-hooks/refs, react-hooks/use-memo, react-hooks/exhaustive-deps
     -- `ref` is this hook's compare cache: it holds the dependencies of the
     last change and is read and replaced during render by contract; `tick`
     keys the memo to that change. */
  if (ref.current === undefined || !compare(ref.current, deps)) {
    ref.current = deps
    tick.current++
  }
  return useMemo(factory, [tick.current])
  /* eslint-enable react-hooks/refs, react-hooks/use-memo, react-hooks/exhaustive-deps */
}
