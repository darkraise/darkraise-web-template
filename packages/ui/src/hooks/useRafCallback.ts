/* eslint-disable @typescript-eslint/no-explicit-any */
import { useInsertionEffect, useMemo, useState } from "react"
import { useUnmountEffect } from "./useUnmountEffect"
import { isBrowser } from "./util"

function createFrameScheduler<T extends (...args: any[]) => any>(cb: T) {
  let latest = cb
  let frame = 0

  const cancel = () => {
    if (!isBrowser) {
      return
    }

    if (frame) {
      cancelAnimationFrame(frame)
      frame = 0
    }
  }

  return {
    cancel,
    setCallback(next: T) {
      latest = next
    },
    schedule(args: Parameters<T>) {
      if (!isBrowser) {
        return
      }

      cancel()

      frame = requestAnimationFrame(() => {
        latest(...args)
        frame = 0
      })
    },
  }
}

export function useRafCallback<T extends (...args: any[]) => any>(
  cb: T,
): [(...args: Parameters<T>) => void, () => void] {
  const [scheduler] = useState(() => createFrameScheduler(cb))

  useInsertionEffect(() => {
    scheduler.setCallback(cb)
  })

  useUnmountEffect(scheduler.cancel)

  return [
    useMemo(() => {
      const wrapped = (...args: Parameters<T>) => {
        scheduler.schedule(args)
      }

      Object.defineProperties(wrapped, {
        length: { value: cb.length },
        name: { value: `${cb.name || "anonymous"}__raf` },
      })

      return wrapped
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),

    scheduler.cancel,
  ]
}
