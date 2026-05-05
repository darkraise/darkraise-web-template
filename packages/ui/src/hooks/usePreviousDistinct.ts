import { useEffect, useRef } from "react"

export function usePreviousDistinct<T>(
  value: T,
  compare: (prev: T | undefined, next: T) => boolean = Object.is,
): T | undefined {
  const prev = useRef<T | undefined>(undefined)
  const current = useRef<T | undefined>(undefined)
  const initialized = useRef<boolean>(false)

  useEffect(() => {
    if (!initialized.current) {
      current.current = value
      initialized.current = true
    } else if (!compare(current.current, value)) {
      prev.current = current.current
      current.current = value
    }
  })

  // eslint-disable-next-line react-hooks/refs
  return prev.current
}
