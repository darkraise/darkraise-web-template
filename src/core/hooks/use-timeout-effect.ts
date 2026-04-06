import { useCallback, useEffect, useRef } from "react"
import { useSyncedRef } from "./use-synced-ref"

type TimeoutID = ReturnType<typeof setTimeout> | null

const cancelTimeout = (id: TimeoutID) => {
  if (id) {
    clearTimeout(id)
  }
}

export function useTimeoutEffect(
  callback: () => void,
  ms?: number,
): [cancel: () => void, reset: () => void] {
  const cbRef = useSyncedRef(callback)
  const msRef = useSyncedRef(ms)
  const timeoutIdRef = useRef<TimeoutID>(null)

  const cancel = useCallback(() => {
    cancelTimeout(timeoutIdRef.current)
  }, [])

  const reset = useCallback(() => {
    if (msRef.current === undefined) {
      return
    }

    cancel()
    timeoutIdRef.current = setTimeout(() => {
      cbRef.current()
    }, msRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    reset()
    return cancel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms])

  return [cancel, reset]
}
