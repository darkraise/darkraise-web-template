import type { SetStateAction } from "react"
import { useMemo } from "react"
import { useMediatedState } from "./use-mediated-state"
import { useSyncedRef } from "./use-synced-ref"
import type { InitialState } from "./util"
import { resolveHookState } from "./util"

export type CounterActions = {
  get: () => number
  inc: (delta?: SetStateAction<number>) => void
  dec: (delta?: SetStateAction<number>) => void
  set: (value: SetStateAction<number>) => void
  reset: (value?: SetStateAction<number>) => void
}

export function useCounter(
  initialValue: InitialState<number> = 0,
  max?: number,
  min?: number,
): [number, CounterActions] {
  const [state, setState] = useMediatedState(
    initialValue,
    (v: number): number => {
      if (max !== undefined) {
        v = Math.min(max, v)
      }

      if (min !== undefined) {
        v = Math.max(min, v)
      }

      return v
    },
  )
  const stateRef = useSyncedRef(state)

  return [
    state,
    useMemo<CounterActions>(
      () => ({
        get: () => stateRef.current,
        set: setState,
        dec(delta = 1) {
          setState((value) => value - resolveHookState(delta, value))
        },
        inc(delta = 1) {
          setState((value) => value + resolveHookState(delta, value))
        },
        reset(value = initialValue) {
          setState((v) => resolveHookState(value, v))
        },
      }),
      [initialValue, setState, stateRef],
    ),
  ]
}
