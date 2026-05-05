/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DependencyList } from "react"
import { useEffect, useMemo, useRef } from "react"
import { useUnmountEffect } from "./useUnmountEffect"

export type DebouncedFunction<Fn extends (...args: any[]) => any> = (
  this: ThisParameterType<Fn>,
  ...args: Parameters<Fn>
) => void

export function useDebouncedCallback<Fn extends (...args: any[]) => any>(
  callback: Fn,
  deps: DependencyList,
  delay: number,
  maxWait = 0,
): DebouncedFunction<Fn> {
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const waitTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const cb = useRef(callback)
  const lastCall = useRef<{
    args: Parameters<Fn>
    this: ThisParameterType<Fn>
  }>(undefined)

  const clear = () => {
    if (timeout.current) {
      clearTimeout(timeout.current)
      timeout.current = undefined
    }

    if (waitTimeout.current) {
      clearTimeout(waitTimeout.current)
      waitTimeout.current = undefined
    }
  }

  useUnmountEffect(clear)

  useEffect(() => {
    cb.current = callback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return useMemo(() => {
    const execute = () => {
      clear()

      if (!lastCall.current) {
        return
      }

      const context = lastCall.current
      lastCall.current = undefined

      cb.current.apply(context.this, context.args)
    }

    const wrapped = function (
      this: ThisParameterType<Fn>,
      ...args: Parameters<Fn>
    ) {
      if (timeout.current) {
        clearTimeout(timeout.current)
      }

      lastCall.current = { args, this: this }

      timeout.current = setTimeout(execute, delay)

      if (maxWait > 0 && !waitTimeout.current) {
        waitTimeout.current = setTimeout(execute, maxWait)
      }
    } as DebouncedFunction<Fn>

    Object.defineProperties(wrapped, {
      length: { value: callback.length },
      name: { value: `${callback.name || "anonymous"}__debounced__${delay}` },
    })

    return wrapped
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, maxWait, ...deps])
}
