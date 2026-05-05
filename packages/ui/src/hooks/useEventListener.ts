/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
import type { RefObject } from "react"
import { useEffect, useMemo } from "react"
import { useIsMounted } from "./useIsMounted"
import { useSyncedRef } from "./useSyncedRef"
import { hasOwnProperty, off, on } from "./util"

export function useEventListener<T extends EventTarget>(
  target: RefObject<T | null> | T | null,
  ...params:
    | Parameters<T["addEventListener"]>
    | [
        string,
        EventListenerOrEventListenerObject | ((...args: any[]) => any),
        ...any,
      ]
): void {
  const isMounted = useIsMounted()

  const listenerRef = useSyncedRef(params[1])
  const eventListener = useMemo<EventListener>(
    () =>
      function (this: T, ...args) {
        if (!isMounted()) {
          return
        }

        if (typeof listenerRef.current === "function") {
          listenerRef.current.apply(this, args)
        } else if (typeof listenerRef.current!.handleEvent === "function") {
          listenerRef.current!.handleEvent.apply(this, args)
        }
      },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useEffect(() => {
    const tgt = isRefObject(target) ? target.current : target
    if (!tgt) {
      return
    }

    const restParams: unknown[] = params.slice(2)

    on(tgt, params[0], eventListener, ...restParams)

    return () => {
      off(tgt, params[0], eventListener, ...restParams)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, params[0]])
}

function isRefObject<T>(
  target: RefObject<T | null> | T | null,
): target is RefObject<T | null> {
  return (
    target !== null &&
    typeof target === "object" &&
    hasOwnProperty(target, "current")
  )
}
