import type { DependencyList, RefObject } from "react"
import { useMemo } from "react"
import { useEventListener } from "./useEventListener"
import { useSyncedRef } from "./useSyncedRef"
import { isBrowser, yieldFalse, yieldTrue } from "./util"

export type KeyboardEventPredicate = (event: KeyboardEvent) => boolean
export type KeyboardEventFilter =
  | null
  | string
  | boolean
  | KeyboardEventPredicate
export type KeyboardEventHandler<T extends EventTarget> = (
  this: T,
  event: KeyboardEvent,
) => void

export type UseKeyboardEventOptions<T extends EventTarget> = {
  event?: "keydown" | "keypress" | "keyup"
  target?: RefObject<T | null> | T | null
  eventOptions?: boolean | AddEventListenerOptions
}

const createKeyPredicate = (
  keyFilter: KeyboardEventFilter,
): KeyboardEventPredicate => {
  if (typeof keyFilter === "function") {
    return keyFilter
  }

  if (typeof keyFilter === "string") {
    return (ev) => ev.key === keyFilter
  }

  return keyFilter ? yieldTrue : yieldFalse
}

const WINDOW_OR_NULL = isBrowser ? globalThis : null

export function useKeyboardEvent<T extends EventTarget>(
  keyOrPredicate: KeyboardEventFilter,
  callback: KeyboardEventHandler<T>,
  deps: DependencyList = [],
  options: UseKeyboardEventOptions<T> = {},
): void {
  const { event = "keydown", target = WINDOW_OR_NULL, eventOptions } = options
  const cbRef = useSyncedRef(callback)

  const handler = useMemo<KeyboardEventHandler<T>>(() => {
    const predicate = createKeyPredicate(keyOrPredicate)

    return function (this: T, ev) {
      if (predicate(ev)) {
        cbRef.current.call(this, ev)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEventListener(target, event, handler, eventOptions)
}
