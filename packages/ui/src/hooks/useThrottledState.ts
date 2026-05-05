import { useCallback, useState } from "react"
import { useThrottledCallback } from "./useThrottledCallback"

export function useThrottledState<T>(
  initial: T,
  delay: number,
): readonly [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initial)
  const throttled = useThrottledCallback((next: T) => setValue(next), [], delay)
  const set = useCallback((v: T) => throttled(v), [throttled])
  return [value, set] as const
}
