import type { Dispatch } from "react"
import { useCallback, useState } from "react"
import { useSyncedRef } from "./useSyncedRef"
import type { InitialState, NextState } from "./util"
import { resolveHookState } from "./util"

export function useMediatedState<State = undefined>(): [
  State | undefined,
  Dispatch<NextState<State | undefined>>,
]
export function useMediatedState<State>(
  initialState: InitialState<State>,
): [State, Dispatch<NextState<State>>]
export function useMediatedState<State, RawState = State>(
  initialState: InitialState<State>,
  mediator?: (state: RawState) => State,
): [State, Dispatch<NextState<RawState, State>>]

export function useMediatedState<State, RawState = State>(
  initialState?: InitialState<State>,
  mediator?: (state: RawState | State | undefined) => State,
): [State | undefined, Dispatch<NextState<RawState, State | undefined>>] {
  const [state, setState] = useState(() =>
    mediator ? mediator(resolveHookState(initialState)) : initialState,
  )
  const mediatorRef = useSyncedRef(mediator)

  return [
    state as State,
    useCallback((value) => {
      if (mediatorRef.current) {
        setState((previousState) =>
          mediatorRef.current?.(
            resolveHookState<RawState, State | undefined>(
              value,
              previousState as State,
            ),
          ),
        )
      } else {
        setState(value as unknown as State)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  ]
}
