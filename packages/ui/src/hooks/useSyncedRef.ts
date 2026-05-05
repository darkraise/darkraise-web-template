import { useMemo, useRef } from "react"

export function useSyncedRef<T>(value: T): { readonly current: T } {
  const ref = useRef(value)

  ref.current = value

  return useMemo(
    () =>
      Object.freeze({
        get current() {
          return ref.current
        },
      }),
    [],
  )
}
