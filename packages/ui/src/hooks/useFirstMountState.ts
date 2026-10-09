import { useEffect, useRef } from "react"

export function useFirstMountState(): boolean {
  const isFirstMount = useRef(true)

  useEffect(() => {
    isFirstMount.current = false
  }, [])

  // eslint-disable-next-line react-hooks/refs -- `isFirstMount` holds whether this is the first mount, and reading it during render is this hook's contract.
  return isFirstMount.current
}
