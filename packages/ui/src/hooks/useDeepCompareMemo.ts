import type { DependencyList } from "react"
import { useMemo, useRef } from "react"

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (a === null || b === null) return false
  if (typeof a !== "object" || typeof b !== "object") return false

  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
  if (a instanceof RegExp && b instanceof RegExp)
    return a.source === b.source && a.flags === b.flags

  if (Array.isArray(a) !== Array.isArray(b)) return false

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }

  const aObj = a as Record<string, unknown>
  const bObj = b as Record<string, unknown>
  const aKeys = Object.keys(aObj)
  const bKeys = Object.keys(bObj)

  if (aKeys.length !== bKeys.length) return false

  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(bObj, key)) return false
    if (!deepEqual(aObj[key], bObj[key])) return false
  }

  return true
}

const depsDeepEqual = (a: DependencyList, b: DependencyList): boolean =>
  deepEqual(a, b)

export function useDeepCompareMemo<T>(
  factory: () => T,
  deps: DependencyList,
): T {
  const ref = useRef<DependencyList | undefined>(undefined)
  const tick = useRef<number>(0)
  if (ref.current === undefined || !depsDeepEqual(ref.current, deps)) {
    ref.current = deps
    tick.current++
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, [tick.current])
}
