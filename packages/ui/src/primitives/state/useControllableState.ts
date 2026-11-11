import * as React from "react"
import { useEvent } from "./useEvent"

export interface UseControllableStateOptions<T> {
  value?: T
  defaultValue?: T
  onChange?: (next: T) => void
}

type Updater<T> = T | ((prev: T) => T)

export function useControllableState<T>(
  options: UseControllableStateOptions<T>,
): [T, (next: Updater<T>) => void] {
  const { value, defaultValue, onChange } = options
  const [uncontrolled, setUncontrolled] = React.useState<T | undefined>(
    defaultValue,
  )

  const isControlled = value !== undefined
  const stableOnChange = useEvent((next: T) => {
    onChange?.(next)
  })

  const current = (isControlled ? value : uncontrolled) as T

  // Mirror controlled value into local state so the last seen value sticks
  // if the consumer transitions controlled -> undefined.
  React.useEffect(() => {
    if (isControlled) setUncontrolled(value)
  }, [isControlled, value])

  // Callers keep setters from earlier renders (a submenu registers its close
  // when it opens), so the setter reads the committed value, not its closure.
  const committed = React.useRef(current)
  React.useLayoutEffect(() => {
    committed.current = current
  })

  // The committed value is stale until React re-renders, so a second set in
  // the same tick compares and composes against the first. Cleared after the
  // tick so a controlled owner that kept its value is asked again next time.
  const pending = React.useRef<{ value: T } | null>(null)

  const setState = React.useCallback(
    (next: Updater<T>) => {
      const base = pending.current ? pending.current.value : committed.current
      const resolved =
        typeof next === "function" ? (next as (prev: T) => T)(base) : next
      if (Object.is(resolved, base)) return
      if (pending.current === null) {
        queueMicrotask(() => {
          pending.current = null
        })
      }
      pending.current = { value: resolved }
      if (!isControlled) {
        setUncontrolled(resolved)
      }
      stableOnChange(resolved)
    },
    [isControlled, stableOnChange],
  )

  return [current, setState]
}
