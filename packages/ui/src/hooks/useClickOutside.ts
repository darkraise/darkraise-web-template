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
  // Stable serialization keeps the effect from re-binding listeners on every
  // render when the caller passes an inline events array.
  const eventsKey = events.join("|")

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

    const list = eventsKey.split("|")
    for (const name of list) {
      on(document, name, handler, { passive: true })
    }

    return () => {
      for (const name of list) {
        off(document, name, handler, { passive: true })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsKey])
}
