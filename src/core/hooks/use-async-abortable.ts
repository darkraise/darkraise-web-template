import { useMemo, useRef } from "react"
import type { AsyncState, UseAsyncActions, UseAsyncMeta } from "./use-async"
import { useAsync } from "./use-async"

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
  const abortController = useRef<AbortController>(undefined)

  const fn = async (...args: Args): Promise<Result> => {
    abortController.current?.abort()

    const ac = new AbortController()
    abortController.current = ac

    return asyncFn(ac.signal, ...args).finally(() => {
      if (abortController.current === ac) {
        abortController.current = undefined
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
          abortController.current?.abort()
        },
      }

      return {
        ...asyncActions,
        ...actions,
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
    { ...asyncMeta, abortController: abortController.current },
  ]
}
