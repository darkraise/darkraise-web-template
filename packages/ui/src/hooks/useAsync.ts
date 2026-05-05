import { useMemo, useRef, useState } from "react"
import { useSyncedRef } from "./useSyncedRef"

export type AsyncStatus = "loading" | "success" | "error" | "not-executed"

export type AsyncState<Result> =
  | {
      status: "not-executed"
      error: undefined
      result: Result
    }
  | {
      status: "success"
      error: undefined
      result: Result
    }
  | {
      status: "error"
      error: Error
      result: Result
    }
  | {
      status: AsyncStatus
      error: Error | undefined
      result: Result
    }

export type UseAsyncActions<Result, Args extends unknown[] = unknown[]> = {
  reset: () => void
  execute: (...args: Args) => Promise<Result>
}

export type UseAsyncMeta<Result, Args extends unknown[] = unknown[]> = {
  promise: Promise<Result> | undefined
  lastArgs: Args | undefined
}

export function useAsync<Result, Args extends unknown[] = unknown[]>(
  asyncFn: (...params: Args) => Promise<Result>,
  initialValue: Result,
): [
  AsyncState<Result>,
  UseAsyncActions<Result, Args>,
  UseAsyncMeta<Result, Args>,
]
export function useAsync<Result, Args extends unknown[] = unknown[]>(
  asyncFn: (...params: Args) => Promise<Result>,
  initialValue?: Result,
): [
  AsyncState<Result | undefined>,
  UseAsyncActions<Result, Args>,
  UseAsyncMeta<Result, Args>,
]

export function useAsync<Result, Args extends unknown[] = unknown[]>(
  asyncFn: (...params: Args) => Promise<Result>,
  initialValue?: Result,
): [
  AsyncState<Result | undefined>,
  UseAsyncActions<Result, Args>,
  UseAsyncMeta<Result, Args>,
] {
  const [state, setState] = useState<AsyncState<Result | undefined>>({
    status: "not-executed",
    error: undefined,
    result: initialValue,
  })
  const promiseRef = useRef<Promise<Result>>(undefined)
  const argsRef = useRef<Args>(undefined)

  const methods = useSyncedRef({
    async execute(...params: Args) {
      argsRef.current = params
      const promise = asyncFn(...params)
      promiseRef.current = promise

      setState((s) => ({ ...s, status: "loading" }))

      promise.then(
        (result) => {
          if (promise === promiseRef.current) {
            setState((s) => ({
              ...s,
              status: "success",
              error: undefined,
              result,
            }))
          }
        },

        (error: Error) => {
          if (promise === promiseRef.current) {
            setState((previousState) => ({
              ...previousState,
              status: "error",
              error,
            }))
          }
        },
      )

      return promise
    },
    reset() {
      setState({
        status: "not-executed",
        error: undefined,
        result: initialValue,
      })
      promiseRef.current = undefined
      argsRef.current = undefined
    },
  })

  return [
    state,
    useMemo(
      () => ({
        reset() {
          methods.current.reset()
        },
        execute: async (...params: Args) => methods.current.execute(...params),
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    ),
    { promise: promiseRef.current, lastArgs: argsRef.current },
  ]
}
