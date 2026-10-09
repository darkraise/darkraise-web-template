import { useEffect, useRef } from "react"

export function usePrevious<T>(value?: T): T | undefined {
  const previous = useRef<T>(undefined)

  useEffect(() => {
    previous.current = value
  })

  // eslint-disable-next-line react-hooks/refs -- `previous` holds the previous render's value, and reading it during render is this hook's contract.
  return previous.current
}
