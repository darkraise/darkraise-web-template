import { useEffect } from "react"
import { useSyncedRef } from "./use-synced-ref"

export function useIntervalEffect(callback: () => void, ms?: number): void {
  const cbRef = useSyncedRef(callback)

  useEffect(() => {
    if (!ms && ms !== 0) {
      return
    }

    const id = setInterval(() => {
      cbRef.current()
    }, ms)

    return () => {
      clearInterval(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms])
}
