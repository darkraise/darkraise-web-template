import type { RefObject } from "react"
import { useEffect } from "react"
import { useSyncedRef } from "./useSyncedRef"
import { off, on } from "./util"

const DEFAULT_EVENTS = ["mousedown", "touchstart"]

export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  callback: EventListener,
  events: string[] = DEFAULT_EVENTS,
): void {
  const cbRef = useSyncedRef(callback)
  const refRef = useSyncedRef(ref)

  useEffect(() => {
    function handler(this: HTMLElement, event: Event) {
      if (!refRef.current.current) {
        return
      }

      const { target: evtTarget } = event
      const cb = cbRef.current

      if (
        !evtTarget ||
        (Boolean(evtTarget) &&
          !refRef.current.current.contains(evtTarget as Node))
      ) {
        cb.call(this, event)
      }
    }

    for (const name of events) {
      on(document, name, handler, { passive: true })
    }

    return () => {
      for (const name of events) {
        off(document, name, handler, { passive: true })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...events])
}
