/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo, useRef } from "react"
import { useSyncedRef } from "./use-synced-ref"
import { useUnmountEffect } from "./use-unmount-effect"
import { isBrowser } from "./util"

export function useRafCallback<T extends (...args: any[]) => any>(
  cb: T,
): [(...args: Parameters<T>) => void, () => void] {
  const cbRef = useSyncedRef(cb)
  const frame = useRef<number>(0)

  const cancel = useCallback(() => {
    if (!isBrowser) {
      return
    }

    if (frame.current) {
      cancelAnimationFrame(frame.current)
      frame.current = 0
    }
  }, [])

  useUnmountEffect(cancel)

  return [
    useMemo(() => {
      const wrapped = (...args: Parameters<T>) => {
        if (!isBrowser) {
          return
        }

        cancel()

        frame.current = requestAnimationFrame(() => {
          cbRef.current(...args)
          frame.current = 0
        })
      }

      Object.defineProperties(wrapped, {
        length: { value: cb.length },
        name: { value: `${cb.name || "anonymous"}__raf` },
      })

      return wrapped
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),

    cancel,
  ]
}
