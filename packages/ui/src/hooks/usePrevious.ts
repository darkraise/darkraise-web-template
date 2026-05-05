import { useEffect, useRef } from "react"

export function usePrevious<T>(value?: T): T | undefined {
  const previous = useRef<T>(undefined)

  useEffect(() => {
    previous.current = value
  })

  // eslint-disable-next-line react-hooks/refs
  return previous.current
}
