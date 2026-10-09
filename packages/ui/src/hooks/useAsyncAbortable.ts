import { useMemo, useRef, useState } from "react"
import type { AsyncState, UseAsyncActions, UseAsyncMeta } from "./useAsync"
import { useAsync } from "./useAsync"
import { useSyncedRef } from "./useSyncedRef"

export type UseAsyncAbortableActions<
  Result,
  Args extends unknown[] = unknown[],
> = {
  abort: () => void
  reset: () => void
} & UseAsyncActions<Result, Args>

export type UseAsyncAbortableMeta<
  Result,
  Args extends unknown[] = unknown[],
> = {
  abortController: AbortController | undefined
} & UseAsyncMeta<Result, Args>

export type ArgsWithAbortSignal<Args extends unknown[] = unknown[]> = [
  AbortSignal,
  ...Args,
]

export function useAsyncAbortable<Result, Args extends unknown[] = unknown[]>(
  asyncFn: (...params: ArgsWithAbortSignal<Args>) => Promise<Result>,
  initialValue: Result,
): [
  AsyncState<Result>,
  UseAsyncAbortableActions<Result, Args>,
  UseAsyncAbortableMeta<Result, Args>,
]
export function useAsyncAbortable<Result, Args extends unknown[] = unknown[]>(
  asyncFn: (...params: ArgsWithAbortSignal<Args>) => Promise<Result>,
  initialValue?: Result,
): [
  AsyncState<Result | undefined>,
  UseAsyncAbortableActions<Result, Args>,
  UseAsyncAbortableMeta<Result, Args>,
]

export function useAsyncAbortable<Result, Args extends unknown[] = unknown[]>(
  asyncFn: (...params: ArgsWithAbortSignal<Args>) => Promise<Result>,
  initialValue?: Result,
): [
  AsyncState<Result | undefined>,
  UseAsyncAbortableActions<Result, Args>,
  UseAsyncAbortableMeta<Result, Args>,
] {
  const abortControllerRef = useRef<AbortController>(undefined)
  const [abortController, setAbortController] = useState<AbortController>()
  // Sync the caller's `asyncFn` into a ref so each invocation uses the
  // latest version. Without this, `useAsync` captures `fn` once (via its
  // own internal ref) at first render and never picks up later prop
  // changes to `asyncFn`. Callers passing inline async functions would
  // otherwise see the first render's closure invoked forever.
  const asyncFnRef = useSyncedRef(asyncFn)

  const fn = async (...args: Args): Promise<Result> => {
    abortControllerRef.current?.abort()

    const ac = new AbortController()
    abortControllerRef.current = ac
    setAbortController(ac)

    return asyncFnRef.current(ac.signal, ...args).finally(() => {
      if (abortControllerRef.current === ac) {
        abortControllerRef.current = undefined
        setAbortController(undefined)
      }
    })
  }

  const [state, asyncActions, asyncMeta] = useAsync<Result, Args>(
    fn,
    initialValue,
  )

  return [
    state,
    useMemo(() => {
      const actions = {
        reset() {
          actions.abort()
          asyncActions.reset()
        },
        abort() {
          abortControllerRef.current?.abort()
        },
      }

      return {
        ...asyncActions,
        ...actions,
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
    { ...asyncMeta, abortController },
  ]
}
