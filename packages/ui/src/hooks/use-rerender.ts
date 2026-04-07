import { useCallback, useState } from "react"

const stateChanger = (state: number) => (state + 1) % Number.MAX_SAFE_INTEGER

export function useRerender(): () => void {
  const [, setState] = useState(0)

  return useCallback(() => {
    setState(stateChanger)
  }, [])
}
