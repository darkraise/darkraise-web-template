import { useEffect, useState } from "react"

export function useDebouncedState<T>(
  initial: T,
  delay: number,
): [T, (v: T) => void, T] {
  const [immediate, setImmediate] = useState<T>(initial)
  const [debounced, setDebounced] = useState<T>(initial)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(immediate), delay)
    return () => clearTimeout(t)
  }, [immediate, delay])
  return [debounced, setImmediate, immediate]
}
