import { useEffect } from "react"
import { useSyncedRef } from "./useSyncedRef"

export function useUnmountEffect(effect: CallableFunction): void {
  const effectRef = useSyncedRef(effect)

  useEffect(
    () => () => {
      effectRef.current()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
}
