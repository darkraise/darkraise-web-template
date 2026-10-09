import { useRef } from "react"

export function usePreviousDistinct<T>(
  value: T,
  compare: (prev: T | undefined, next: T) => boolean = Object.is,
): T | undefined {
  const prev = useRef<T | undefined>(undefined)
  const current = useRef<T | undefined>(undefined)
  const initialized = useRef<boolean>(false)

  /* eslint-disable react-hooks/refs -- the hook stores the last distinct values and reads them during render by contract. A render that repeats the current value leaves both refs unchanged, so a Strict Mode double render returns the same value. */
  if (!initialized.current) {
    current.current = value
    initialized.current = true
  } else if (!compare(current.current, value)) {
    prev.current = current.current
    current.current = value
  }
  return prev.current
  /* eslint-enable react-hooks/refs */
}
