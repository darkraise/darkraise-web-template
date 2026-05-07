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

  const setState = React.useCallback(
    (next: Updater<T>) => {
      const resolved =
        typeof next === "function" ? (next as (prev: T) => T)(current) : next
      if (!isControlled) {
        setUncontrolled(resolved)
      }
      stableOnChange(resolved)
    },
    [current, isControlled, stableOnChange],
  )

  return [current, setState]
}
