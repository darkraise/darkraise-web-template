/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DependencyList } from "react"
import { useMemo, useRef } from "react"
import { useUnmountEffect } from "./useUnmountEffect"

export type ThrottledFunction<Fn extends (...args: any[]) => any> = (
  this: ThisParameterType<Fn>,
  ...args: Parameters<Fn>
) => void

export function useThrottledCallback<Fn extends (...args: any[]) => any>(
  callback: Fn,
  deps: DependencyList,
  delay: number,
  noTrailing = false,
): ThrottledFunction<Fn> {
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const lastCall = useRef<{
    args: Parameters<Fn>
    this: ThisParameterType<Fn>
  }>(undefined)

  useUnmountEffect(() => {
    if (timeout.current) {
      clearTimeout(timeout.current)
      timeout.current = undefined
    }
  })

  return useMemo(() => {
    const execute = (context: ThisParameterType<Fn>, args: Parameters<Fn>) => {
      lastCall.current = undefined
      callback.apply(context, args)

      timeout.current = setTimeout(() => {
        timeout.current = undefined

        if (!noTrailing && lastCall.current) {
          execute(lastCall.current.this, lastCall.current.args)
          lastCall.current = undefined
        }
      }, delay)
    }

    const wrapped = function (
      this: ThisParameterType<Fn>,
      ...args: Parameters<Fn>
    ) {
      if (timeout.current) {
        lastCall.current = { args, this: this }
        return
      }

      execute(this, args)
    } as ThrottledFunction<Fn>

    Object.defineProperties(wrapped, {
      length: { value: callback.length },
      name: { value: `${callback.name || "anonymous"}__throttled__${delay}` },
    })

    return wrapped
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, noTrailing, ...deps])
}
