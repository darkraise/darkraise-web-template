import { useInsertionEffect, useMemo, useRef } from "react"

export function useSyncedRef<T>(value: T): { readonly current: T } {
  const ref = useRef(value)

  // Insertion effects run before layout effects and ref callbacks, so every
  // effect and handler of the committed render reads the new value, while a
  // render React discards never reaches the ref.
  useInsertionEffect(() => {
    ref.current = value
  })

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
